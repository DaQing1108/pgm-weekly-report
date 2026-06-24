#!/usr/bin/env python3
"""
scripts/import-draft.py — 從週報草稿 MD 匯入 Dashboard

用法：
    # 舊版草稿（四張表格格式）
    python3 scripts/import-draft.py backend/drafts/ProgramSync_W21_2026-05-22_draft.md
    python3 scripts/import-draft.py backend/drafts/ProgramSync_W21_2026-05-22_draft.md --push

    # v2 九章敘事週報（含 Appendix: Dashboard Export）
    python3 scripts/import-draft.py VIA_Cowork/.../260519_ProgramSync_Week21_FINAL.md --push

    # 略過確認提示
    python3 scripts/import-draft.py <path> --push --yes

功能：
    1. 自動偵測格式：
       - v2 格式（九章報告）：從 "Appendix: Dashboard Export" 解析
       - 舊版格式（草稿）：從四張 Markdown 表格解析
    2. 轉換為 Dashboard JSON 格式
    3. 若目標 W##.json 已存在，合併（保留已有項目的 ID 與 _createdAt）
    4. 進度 % 處理：v2 格式的 [keep] 標記會保留現有週次的進度值
    5. 寫入 backend/data/weeks/W##.json
    6. --push：呼叫 Railway API 同步至線上 DB（需 ADMIN_TOKEN 環境變數）
    7. 上週 carry-forward：新週次匯入時，自動從上週 JSON 繼承 owner / targetDate / team，
       避免每週重填；status 與 progress 仍以本週 Appendix 為準
"""

import sys
import os
import re
import json
import argparse
import subprocess
import tempfile
from pathlib import Path
from datetime import datetime, timedelta, timezone

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
except ImportError:
    pass  # python-dotenv 未安裝時跳過，依賴 shell 環境變數

REPO_ROOT  = Path(__file__).parent.parent
WEEKS_DIR  = REPO_ROOT / "backend" / "data" / "weeks"
RAILWAY_URL = "https://pgm-weekly-report-production.up.railway.app"

# ── 週次計算（同 new-week.py，anchor = W01 = 2026-01-05）────────────────────
def week_num(label):
    m = re.match(r"W(\d{1,2})$", label.strip(), re.IGNORECASE)
    return int(m.group(1)) if m else None

def week_start_for(label):
    num = week_num(label)
    if num is None:
        return None
    anchor = datetime(2025, 12, 29)  # W01 = Dec 29 2025 (ISO week anchor)
    return (anchor + timedelta(weeks=(num - 1))).strftime("%Y-%m-%d")

def iso_now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")

# ── Team 關鍵字推斷 ──────────────────────────────────────────────────────────
TEAM_KEYWORDS = {
    "tv-solution":  ["OpenMAM", "TVBS", "人臉", "Face", "Aura", "Olapedia", "Logo", "側臉"],
    "media-agent":  ["STT", "語音", "AI Server", "資料管理", "Text-Based", "AI 剪輯",
                     "AI Sharing", "Agentic", "片庫"],
    "chuangzaoli":  ["小栗方", "創造栗", "SEL", "官網", "繪本", "樂高"],
    "learnmode":    ["LearnMode", "學習吧", "加分吧", "教育", "客語", "學校"],
}
DEFAULT_TEAM = "media-agent"

def infer_team(text):
    for team, keywords in TEAM_KEYWORDS.items():
        if any(k in text for k in keywords):
            return team
    return DEFAULT_TEAM

# ── 日期格式轉換 ─────────────────────────────────────────────────────────────
def parse_date(raw):
    raw = raw.strip()
    if not raw or raw.upper() in ("TBD", "ASAP", "-", "—", ""):
        return ""
    # 2026/05/20 or 2026-05-20
    m = re.match(r"(\d{4})[/-](\d{1,2})[/-](\d{1,2})", raw)
    if m:
        return f"{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"
    # Q3 / 9月 demo
    if re.search(r"Q[1-4]|月|demo", raw, re.IGNORECASE):
        return ""
    return ""

# ── Markdown 表格解析 ────────────────────────────────────────────────────────
def _extract_table_rows(block: str) -> list:
    """從 Markdown 區塊中解析表格，回傳 list of dict。"""
    lines = [l.strip() for l in block.splitlines() if l.strip().startswith("|")]
    if len(lines) < 2:
        return []

    def split_row(line):
        return [c.strip() for c in line.strip("|").split("|")]

    headers = split_row(lines[0])
    rows = []
    for line in lines[2:]:          # skip separator line
        if re.match(r"\|[-| ]+\|", line):
            continue
        cells = split_row(line)
        while len(cells) < len(headers):
            cells.append("")
        row = {h: cells[i] for i, h in enumerate(headers)}
        rows.append(row)
    return rows

def parse_table(text, section_header):
    """
    找到 ## section_header 之後的第一張 markdown table，
    回傳 list of dict（key = header 欄名）。
    """
    pattern = rf"##\s+{re.escape(section_header)}\s*\n(.*?)(?=\n##\s|\Z)"
    m = re.search(pattern, text, re.DOTALL)
    if not m:
        return []
    return _extract_table_rows(m.group(1))

# ── v2 格式偵測與 Appendix 解析 ─────────────────────────────────────────────

def is_v2_format(text: str) -> bool:
    """偵測是否為九章敘事週報（v2）格式，含 Appendix: Dashboard Export。"""
    return "## Appendix: Dashboard Export" in text

def parse_appendix_table(text: str, section_name: str) -> list:
    """
    從 v2 週報的 Appendix 區塊中，解析指定子章節（### 標題）的 Markdown 表格。
    """
    appendix_match = re.search(
        r"## Appendix: Dashboard Export\s*\n(.*?)(?=\n## |\Z)",
        text, re.DOTALL
    )
    if not appendix_match:
        return []

    appendix_text = appendix_match.group(1)
    pattern = rf"###\s+{re.escape(section_name)}\s*\n(.*?)(?=\n### |\Z)"
    m = re.search(pattern, appendix_text, re.DOTALL)
    if not m:
        return []
    return _extract_table_rows(m.group(1))

# ── ID 生成 & 合併工具 ───────────────────────────────────────────────────────
def make_id(prefix, week_label, index):
    return f"{prefix}-{week_label.lower()}-{index:02d}"

def find_existing(existing_list, key_field, value):
    """在 existing_list 中依 key_field 模糊匹配，回傳找到的項目或 None。"""
    value_clean = value.strip()
    for item in existing_list:
        existing_val = item.get(key_field, "").strip()
        if existing_val == value_clean:
            return item
        # 子字串匹配（處理截斷的標題）
        if len(value_clean) > 10 and (value_clean[:15] in existing_val or
                                       existing_val[:15] in value_clean):
            return item
    return None

# ── 草稿解析：專案進度 ────────────────────────────────────────────────────────
def parse_projects(text, week_label, week_start, existing, v2=False, prev_existing=None):
    rows = parse_appendix_table(text, "專案進度") if v2 else parse_table(text, "專案進度")
    projects = []
    for i, row in enumerate(rows, 1):
        name         = row.get("專案名稱", "").strip()
        status       = row.get("狀態", "on-track").strip().lower()
        progress_raw = row.get("進度 %", "0").strip().rstrip("%")
        week_done    = row.get("本週更新", "").strip()
        notes        = row.get("備註", "").strip()

        if not name or name.startswith("-"):
            continue

        # 從備註推斷 owner（「XXX 主導」「XXX 負責」）
        owner_match = re.search(r"(\w+(?:\s+\w+)?)\s*(?:主導|負責|Responsible)", notes)
        owner = owner_match.group(1) if owner_match else ""

        existing_item = find_existing(existing, "name", name)
        # 當週無此專案時，從上週資料繼承 owner / targetDate / team 等持久欄位
        prev_item = find_existing(prev_existing or [], "name", name) if not existing_item else None
        ref = existing_item or prev_item

        # [keep] 標記（v2 格式）：保留現有週次的進度值，不以草稿覆蓋
        if progress_raw == "[keep]":
            progress_int = ref.get("progress", 0) if ref else 0
        else:
            try:
                progress_int = int(float(progress_raw))
            except (ValueError, TypeError):
                progress_int = 0

        proj = {
            "id":           existing_item["id"] if existing_item else (prev_item["id"] if prev_item else make_id("proj", week_label, i)),
            "name":         name,
            "team":         ref.get("team", infer_team(name + " " + notes)) if ref else infer_team(name + " " + notes),
            "status":       status,
            "weekStart":    week_start,
            "description":  existing_item.get("description", week_done) if existing_item else week_done,
            "owner":        ref.get("owner", owner) if ref else owner,
            "dueDate":      ref.get("dueDate", "") if ref else "",
            "progress":     progress_int,
            "targetDate":   ref.get("targetDate", "") if ref else "",
            "progressMode": "manual",
            "weekDone":     week_done,
            "blockers":     notes,
            "_createdAt":   existing_item["_createdAt"] if existing_item else (prev_item["_createdAt"] if prev_item else iso_now()),
            "_updatedAt":   iso_now(),
        }
        projects.append(proj)
    return projects

# ── 草稿解析：Action Items ────────────────────────────────────────────────────
STATUS_MAP = {
    "pending":       "pending",
    "not-started":   "pending",
    "in-progress":   "in-progress",
    "in progress":   "in-progress",
    "done":          "done",
    "completed":     "done",
    "blocked":       "blocked",
}

def parse_actions(text, week_label, week_start, existing, projects, v2=False, prev_existing=None):
    rows = parse_appendix_table(text, "Action Items") if v2 else parse_table(text, "Action Items")
    actions = []
    proj_name_to_id = {p["name"]: p["id"] for p in projects}

    for i, row in enumerate(rows, 1):
        task     = row.get("任務描述", "").strip()
        owner    = row.get("負責人", "").strip()
        due_raw  = row.get("目標日期", "").strip()
        status   = row.get("狀態", "pending").strip().lower()
        category = row.get("分類", "").strip().lower()

        if not task or task.startswith("-"):
            continue

        # 狀態正規化
        status_norm = STATUS_MAP.get(status, "pending")

        existing_item = find_existing(existing, "task", task)

        # 當週無此 action 時，從上週資料繼承 project / team / owner / category / dueDate
        prev_item = find_existing(prev_existing or [], "task", task) if not existing_item else None

        # 嘗試關聯專案（keyword 匹配，prev_item 有值時優先繼承）
        project_id   = ""
        project_name = ""
        for pname, pid in proj_name_to_id.items():
            keywords = [w for w in pname.split() if len(w) > 2]
            if any(kw in task for kw in keywords):
                project_id   = pid
                project_name = pname
                break

        # 狀態保留規則：Railway 已有紀錄時，保留 Railway 的 status
        # （避免 Quick Input 手動改成 done 後被 MD 的舊值蓋回）
        # 例外：MD 明確標 done → 仍以 done 更新（進度只進不退除非人工退回）
        # 注意：status 不從 prev_item 繼承，每週 MD 的狀態才是本週狀態
        if existing_item:
            existing_status = existing_item.get("status", "pending")
            if status_norm == "done":
                final_status = "done"           # MD 說完成 → 採用
            else:
                final_status = existing_status  # 否則保留 Railway 的狀態
        else:
            final_status = status_norm

        # owner / dueDate / category：MD 有值用 MD，空時繼承上週
        resolved_owner    = owner if owner else (prev_item.get("owner", "") if prev_item else "")
        resolved_due      = parse_date(due_raw)
        if not resolved_due and prev_item:
            resolved_due  = prev_item.get("dueDate", "")
        resolved_category = category if category else (prev_item.get("category", "") if prev_item else "")

        # project / projectId / team：MD 無此欄，優先繼承上週，否則用 keyword 推斷
        if prev_item:
            resolved_project_id   = prev_item.get("projectId", project_id)
            resolved_project_name = prev_item.get("project",   project_name)
            resolved_team         = prev_item.get("team",       infer_team(task))
        else:
            resolved_project_id   = project_id
            resolved_project_name = project_name
            resolved_team         = infer_team(task)

        action = {
            "id":        existing_item["id"] if existing_item else (prev_item["id"] if prev_item else make_id("action", week_label, i)),
            "task":      task,
            "owner":     resolved_owner,
            "team":      existing_item.get("team", resolved_team) if existing_item else resolved_team,
            "dueDate":   resolved_due,
            "status":    final_status,
            "priority":  existing_item.get("priority", "P2") if existing_item else (prev_item.get("priority", "P2") if prev_item else "P2"),
            "weekStart": week_start,
            "projectId": existing_item.get("projectId", resolved_project_id) if existing_item else resolved_project_id,
            "category":  resolved_category,
            "project":   existing_item.get("project", resolved_project_name) if existing_item else resolved_project_name,
            "_createdAt": existing_item["_createdAt"] if existing_item else (prev_item["_createdAt"] if prev_item else iso_now()),
            "_updatedAt": iso_now(),
        }
        actions.append(action)
    return actions

# ── 草稿解析：Risks ───────────────────────────────────────────────────────────
def parse_risks(text, week_label, week_start, existing, v2=False):
    rows = parse_appendix_table(text, "Risks") if v2 else parse_table(text, "Risks")
    risks = []
    for i, row in enumerate(rows, 1):
        desc       = row.get("風險描述", "").strip()
        level      = row.get("嚴重度", "medium").strip().lower()
        mitigation = row.get("因應措施", "").strip()

        if not desc or desc.startswith("-"):
            continue

        existing_item = find_existing(existing, "description", desc)

        risk = {
            "id":          existing_item["id"] if existing_item else make_id("risk", week_label, i),
            "description": desc,
            "level":       level,
            "status":      existing_item.get("status", "in-progress") if existing_item else "in-progress",
            "team":        existing_item.get("team", infer_team(desc + " " + mitigation)) if existing_item else infer_team(desc + " " + mitigation),
            "weekStart":   week_start,
            "mitigation":  mitigation,
            "_createdAt":  existing_item["_createdAt"] if existing_item else iso_now(),
            "_updatedAt":  iso_now(),
        }
        risks.append(risk)
    return risks

# ── 草稿解析：里程碑 ──────────────────────────────────────────────────────────
MILESTONE_STATUS_MAP = {
    "done":       "done",
    "completed":  "done",
    "upcoming":   "upcoming",
    "in-progress":"in-progress",
    "in progress":"in-progress",
}

def parse_milestones(text, week_label, week_start, existing, v2=False):
    rows = parse_appendix_table(text, "里程碑") if v2 else parse_table(text, "里程碑")
    milestones = []
    for i, row in enumerate(rows, 1):
        date_raw = row.get("日期", "").strip()
        name     = row.get("里程碑事項", "").strip()
        team_raw = row.get("團隊", "").strip()
        status   = row.get("狀態", "upcoming").strip().lower()

        if not name or name.startswith("-"):
            continue

        status_norm = MILESTONE_STATUS_MAP.get(status, "upcoming")
        existing_item = find_existing(existing, "name", name)

        # 狀態保留規則（同 Action Items）：
        # Railway 有紀錄時保留 Railway status；MD 為 done → 仍更新為 done
        if existing_item:
            existing_status = existing_item.get("status", "upcoming")
            final_status = "done" if status_norm == "done" else existing_status
        else:
            final_status = status_norm

        milestone = {
            "id":        existing_item["id"] if existing_item else make_id("ms", week_label, i),
            "name":      name,
            "date":      parse_date(date_raw),
            "status":    final_status,
            "team":      team_raw if team_raw else infer_team(name),
            "weekStart": week_start,
            "_createdAt": existing_item["_createdAt"] if existing_item else iso_now(),
            "_updatedAt": iso_now(),
        }
        milestones.append(milestone)
    return milestones

# ── 從 Railway 抓現有資料 ─────────────────────────────────────────────────────
def _fetch_railway(week_label):
    """GET /api/weeks/{week_label}，回傳 dict 或 None。
    M10: 區分「Railway 確實無此週」與「連線失敗」，後者印出警告。
    """
    url = f"{RAILWAY_URL}/api/weeks/{week_label}"
    try:
        result = subprocess.run(
            ["curl", "-s", "-w", "\n%{http_code}", "--max-time", "10", url],
            capture_output=True, text=True, timeout=15
        )
        if result.returncode != 0 or not result.stdout.strip():
            print(f"⚠️   無法連線 Railway（curl 回傳碼 {result.returncode}），改用本地資料")
            return None
        lines = result.stdout.strip().rsplit("\n", 1)
        body, http_code = lines[0], lines[1] if len(lines) > 1 else "0"
        if http_code == "404":
            return None  # 正常：Railway 無此週資料
        if http_code != "200":
            print(f"⚠️   Railway 回傳 HTTP {http_code}，改用本地資料")
            return None
        data = json.loads(body)
        if isinstance(data, dict) and "error" not in data:
            return data
        return None
    except Exception as e:
        print(f"⚠️   Railway fetch 發生例外（{e}），改用本地資料")
        return None

# ── Push 至 Railway ───────────────────────────────────────────────────────────
def push_to_railway(week_label, payload):
    # 從環境變數取得 token（.env 已在模組頂部由 python-dotenv 載入）
    token = os.environ.get("ADMIN_TOKEN", "")

    url = f"{RAILWAY_URL}/api/weeks/{week_label}"

    # 將 JSON 寫入暫存檔，避免 shell 轉義與 Python latin-1 編碼問題
    with tempfile.NamedTemporaryFile(
        mode="w", encoding="utf-8", suffix=".json", delete=False
    ) as tmp:
        json.dump(payload, tmp, ensure_ascii=False, indent=None)
        tmp_path = tmp.name

    try:
        cmd = [
            "curl", "-s", "-X", "POST",
            "-H", "Content-Type: application/json; charset=utf-8",
            "--data-binary", f"@{tmp_path}",
            url,
        ]
        if token:
            cmd += ["-H", f"x-admin-token: {token}"]

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        raw = result.stdout.strip()

        if result.returncode != 0:
            print(f"❌  curl 執行失敗：{result.stderr[:200]}")
            return False

        try:
            resp_json = json.loads(raw)
        except json.JSONDecodeError:
            print(f"❌  Railway 回應無法解析：{raw[:200]}")
            return False

        if resp_json.get("success"):
            print(f"✅  Railway 同步成功：{url}")
            # 自動將 payload 同步回本地 JSON，確保 git 記錄不落後 Production
            local_json = WEEKS_DIR / f"{week_label}.json"
            local_json.write_text(
                json.dumps(payload, ensure_ascii=False, indent=2),
                encoding="utf-8"
            )
            print(f"✅  本地 JSON 已同步：{local_json.relative_to(REPO_ROOT)}")
            print(f"\n📌  下一步：執行 release-week.sh 將資料提交到 git")
            print(f"     ./scripts/release-week.sh {week_label}")
            return True
        else:
            print(f"⚠️   Railway 回應異常：{resp_json}")
            return False

    except subprocess.TimeoutExpired:
        print("❌  Push 逾時（30 秒）")
        return False
    except Exception as e:
        print(f"❌  Push 失敗：{e}")
        return False
    finally:
        os.unlink(tmp_path)

# ── Preflight 靜態檢查 ────────────────────────────────────────────────────────
REQUIRED_SECTIONS   = ["專案進度", "Action Items", "Risks", "里程碑"]
VALID_ACTION_STATUS = {"pending", "in-progress", "done", "blocked"}
VALID_PROJ_STATUS   = {"on-track", "at-risk", "behind", "completed", "paused"}
VALID_MS_STATUS     = {"upcoming", "in-progress", "done", "delayed"}

def preflight(text: str, v2: bool) -> bool:
    """靜態檢查 FINAL.md，回傳 True=PASS / False=FAIL（有 ❌ 即 FAIL）."""
    print("\n🔍  Preflight 檢查中…")
    passed = True

    if v2:
        # ① Appendix 四區塊存在且有資料
        for section in REQUIRED_SECTIONS:
            rows = parse_appendix_table(text, section)
            icon = "✅" if rows else "❌"
            if not rows:
                passed = False
            print(f"  {icon}  {section}：{len(rows)} 筆")

        # ② 狀態值合法性
        action_rows = parse_appendix_table(text, "Action Items")
        bad_statuses = []
        for r in action_rows:
            raw = (r.get("狀態") or r.get("status") or "").strip().lower()
            mapped = STATUS_MAP.get(raw, raw)
            if mapped not in VALID_ACTION_STATUS:
                bad_statuses.append(raw or "(空)")
        if bad_statuses:
            print(f"  ⚠️   Action 狀態含非標準值（將 fallback 為 pending）：{set(bad_statuses)}")
        else:
            print("  ✅  Action 狀態值全部合法")

        ms_rows = parse_appendix_table(text, "里程碑")
        bad_ms = []
        for r in ms_rows:
            raw = (r.get("狀態") or r.get("status") or "").strip().lower()
            mapped = MILESTONE_STATUS_MAP.get(raw, raw)
            if mapped not in VALID_MS_STATUS:
                bad_ms.append(raw or "(空)")
        if bad_ms:
            print(f"  ⚠️   里程碑狀態含非標準值（將 fallback 為 upcoming）：{set(bad_ms)}")

        # ③ 負責人含 [待確認] 警告
        tbd_count = sum(
            1 for r in action_rows
            if "[待確認]" in (r.get("負責人") or r.get("owner") or "")
            or "待確認" in (r.get("負責人") or r.get("owner") or "")
        )
        if tbd_count:
            print(f"  ⚠️   {tbd_count} 個 Action 負責人為「待確認」")

    if passed:
        print("✅  Preflight PASS — 繼續匯入\n")
    else:
        print("❌  Preflight FAIL — 請補齊缺少的區塊後重新匯入\n")
    return passed

# ── 主程式 ────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="從週報草稿 MD 匯入 Dashboard JSON")
    parser.add_argument("draft", help="草稿 MD 檔案路徑（例：~/Desktop/ProgramSync_W21_2026-05-22_draft.md）")
    parser.add_argument("--push",         action="store_true", help="同步至 Railway 線上 DB")
    parser.add_argument("--yes",          action="store_true", help="略過確認直接寫入")
    parser.add_argument("--auto-release", action="store_true", help="push 成功後自動執行 release-week.sh（需搭配 --push）")
    parser.add_argument("--dry-run",      action="store_true", help="只解析並輸出 JSON 摘要，不寫入任何檔案")
    parser.add_argument("--week",         help="手動指定週次（例：W24），用於 UI/API 呼叫時檔名無法解析的情況")
    args = parser.parse_args()

    draft_path = Path(args.draft).expanduser().resolve()
    if not draft_path.exists():
        print(f"❌  找不到草稿：{draft_path}")
        sys.exit(1)

    # 從檔名取得週次，支援兩種命名格式：
    # v2:  YYMMDD_ProgramSync_WeekXX_FINAL.md
    # 舊版: ProgramSync_W##_YYYY-MM-DD_draft.md
    # H8: --week 手動指定優先（UI/API 呼叫 parse_temp.md 等暫存檔時使用）
    if args.week:
        m_manual = re.match(r"W(\d{1,2})$", args.week.strip(), re.IGNORECASE)
        if not m_manual:
            print(f"❌  --week 格式錯誤（應為 W## 例如 W24）：{args.week}")
            sys.exit(1)
        week_label = f"W{int(m_manual.group(1)):02d}"
    else:
        m_v2  = re.search(r"ProgramSync_Week(\d{1,2})_", draft_path.name, re.IGNORECASE)
        m_old = re.search(r"ProgramSync_(W\d{1,2})_",    draft_path.name, re.IGNORECASE)
        if m_v2:
            week_label = f"W{int(m_v2.group(1)):02d}"
        elif m_old:
            week_label = m_old.group(1).upper()
        else:
            print("❌  無法從檔名解析週次")
            print("    v2  格式：YYMMDD_ProgramSync_WeekXX_FINAL.md")
            print("    舊版格式：ProgramSync_W##_YYYY-MM-DD_draft.md")
            print("    或使用 --week W## 手動指定")
            sys.exit(1)
    week_start = week_start_for(week_label)
    if not week_start:
        print(f"❌  無法計算 {week_label} 的 weekStart")
        sys.exit(1)

    print(f"\n📄  草稿：{draft_path.name}")
    print(f"📅  週次：{week_label}（weekStart: {week_start}）")

    # 讀取草稿
    text = draft_path.read_text(encoding="utf-8")

    # 偵測格式
    v2 = is_v2_format(text)
    if v2:
        print("📋  格式：九章敘事週報（v2）— 從 Appendix: Dashboard Export 解析")
    else:
        print("📋  格式：Dashboard 草稿（舊版）— 從四張表格解析")

    # Preflight 靜態檢查（v2 格式才有 Appendix 可驗證）
    if v2 and not args.dry_run:
        if not preflight(text, v2):
            sys.exit(1)

    # 讀取現有 JSON（合併用）
    # --push 時優先從 Railway 抓最新資料，確保不蓋掉 Quick Input 的手動編輯
    out_path = WEEKS_DIR / f"{week_label}.json"
    existing_data = {}

    if args.push:
        railway_data = _fetch_railway(week_label)
        if railway_data:
            existing_data = railway_data
            print(f"🌐  已從 Railway 取得 {week_label} 現有資料（保留 Quick Input 手動編輯）")
        elif out_path.exists():
            existing_data = json.loads(out_path.read_text(encoding="utf-8"))
            print(f"🔀  Railway 無資料，改用本地 {week_label}.json 合併")
        else:
            print(f"🆕  {week_label}.json 不存在，將全新建立")
    elif out_path.exists():
        existing_data = json.loads(out_path.read_text(encoding="utf-8"))
        print(f"🔀  找到現有 {week_label}.json，將合併（保留已有項目的 ID）")
    else:
        print(f"🆕  {week_label}.json 不存在，將全新建立")

    existing_projects = existing_data.get("projects", [])
    existing_actions  = existing_data.get("actions",  [])
    existing_risks    = existing_data.get("risks",    [])

    # 載入上週資料，作為 owner / targetDate / team / project 等的 carry-forward 來源
    prev_projects = []
    prev_actions  = []
    prev_num = week_num(week_label)
    if prev_num and prev_num > 1:
        prev_label = f"W{prev_num - 1:02d}"
        prev_data: dict = {}
        if args.push:
            prev_railway = _fetch_railway(prev_label)
            if prev_railway:
                prev_data = prev_railway
        if not prev_data:
            prev_path = WEEKS_DIR / f"{prev_label}.json"
            if prev_path.exists():
                try:
                    prev_data = json.loads(prev_path.read_text(encoding="utf-8"))
                except Exception:
                    pass
        prev_projects = prev_data.get("projects", [])
        prev_actions  = prev_data.get("actions",  [])
        if prev_projects:
            print(f"🔄  上週（{prev_label}）找到 {len(prev_projects)} 筆專案，將繼承 owner / targetDate / team")
        if prev_actions:
            print(f"🔄  上週（{prev_label}）找到 {len(prev_actions)} 筆 Actions，將繼承 project / category / owner / dueDate / team")

    # 解析草稿
    existing_milestones = existing_data.get("milestones", [])
    projects   = parse_projects(text, week_label, week_start, existing_projects, v2=v2, prev_existing=prev_projects)
    actions    = parse_actions(text, week_label, week_start, existing_actions, projects, v2=v2, prev_existing=prev_actions)
    risks      = parse_risks(text, week_label, week_start, existing_risks, v2=v2)
    milestones = parse_milestones(text, week_label, week_start, existing_milestones, v2=v2)

    print(f"\n📊  解析結果：")
    print(f"    專案進度：{len(projects)} 筆")
    print(f"    Action Items：{len(actions)} 筆")
    print(f"    Risks：{len(risks)} 筆")
    print(f"    里程碑：{len(milestones)} 筆")

    if not projects and not actions and not risks:
        print("\n⚠️   未解析到任何資料，請確認草稿格式正確。")
        sys.exit(1)

    # ── 重算本週 snapshot ────────────────────────────────────────────────────
    on_track   = sum(1 for p in projects if p["status"] == "on-track")
    at_risk    = sum(1 for p in projects if p["status"] == "at-risk")
    behind     = sum(1 for p in projects if p["status"] == "behind")
    completed  = sum(1 for p in projects if p["status"] in ("completed", "done"))
    total_proj = len(projects)
    on_track_pct = round((on_track + completed) / total_proj * 100) if total_proj else 0

    high_risks   = sum(1 for r in risks if r["level"] == "high")
    medium_risks = sum(1 for r in risks if r["level"] == "medium")
    low_risks    = sum(1 for r in risks if r["level"] == "low")

    today = datetime.now()
    overdue_actions   = sum(1 for a in actions if a["dueDate"] and
                            a["dueDate"] < today.strftime("%Y-%m-%d") and
                            a["status"] not in ("done",))
    completed_actions = sum(1 for a in actions if a["status"] == "done")

    new_snapshot = {
        "id":               f"snap-{week_label.lower()}",
        "weekStart":        week_start,
        "weekLabel":        week_label,
        "onTrackPct":       on_track_pct,
        "atRiskCount":      at_risk,
        "behindCount":      behind,
        "highRisks":        high_risks,
        "mediumRisks":      medium_risks,
        "lowRisks":         low_risks,
        "totalProjects":    total_proj,
        "overdueActions":   overdue_actions,
        "completedActions": completed_actions,
        "totalActions":     len(actions),
    }

    # 保留舊 snapshots（移除本週的舊值後插入新值）
    existing_snapshots = [s for s in existing_data.get("snapshots", [])
                          if s.get("weekLabel") != week_label]
    existing_snapshots.append(new_snapshot)

    # 組合完整 JSON
    now = iso_now()
    payload = {
        "weekLabel":    week_label,
        "weekStart":    week_start,
        "projects":     projects,
        "actions":      actions,
        "risks":        risks,
        "milestones":   milestones if milestones else existing_data.get("milestones", []),
        "snapshots":    existing_snapshots,
        "drafts":       existing_data.get("drafts",  []),
        "members":      existing_data.get("members", []),  # 從 Railway 繼承，不被覆蓋
        "_exportedAt":  now,
        "_savedAt":     now,
        "_version":     "import-draft-v2" if v2 else "import-draft-v1",
        "_dataVersion": existing_data.get("_dataVersion", 1) + 1,
    }

    # Dry-run：只輸出摘要 JSON，不寫入任何檔案
    if args.dry_run:
        summary = {
            "weekLabel":      week_label,
            "weekStart":      week_start,
            "projectCount":   len(projects),
            "actionCount":    len(actions),
            "riskCount":      len(risks),
            "milestoneCount": len(milestones),
            "projects":       [{"name": p.get("name"), "status": p.get("status"), "progress": p.get("progress")} for p in projects],
        }
        print(json.dumps(summary, ensure_ascii=False))
        sys.exit(0)

    # 確認
    if not args.yes:
        print(f"\n⚠️   即將寫入：{out_path}")
        ans = input("確認寫入？[y/N] ").strip().lower()
        if ans not in ("y", "yes"):
            print("已取消。")
            sys.exit(0)

    # 寫入 JSON
    WEEKS_DIR.mkdir(parents=True, exist_ok=True)
    out_path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )
    print(f"\n✅  已寫入：{out_path}")

    # Push 至 Railway
    if args.push:
        print(f"\n🚀  推送至 Railway...")
        push_ok = push_to_railway(week_label, payload)
        if push_ok and args.auto_release:
            print(f"\n🚀  執行 release-week.sh {week_label}...")
            release_script = REPO_ROOT / "scripts" / "release-week.sh"
            result = subprocess.run(["bash", str(release_script), week_label, "--yes"], check=False)
            if result.returncode != 0:
                print(f"⚠️  release-week.sh 結束碼 {result.returncode}，請手動確認 git 狀態")

    # ── 後驗證 ──────────────────────────────────────────────────────────────────
    VALID_ACTION_STATUSES = {"pending", "in-progress", "done", "blocked"}
    warnings = []

    if not payload.get("weekLabel"):
        warnings.append("❌  weekLabel 為空")
    if not payload.get("weekStart"):
        warnings.append("❌  weekStart 為空")
    if not payload.get("milestones"):
        warnings.append("⚠️   milestones 為空（報告 Appendix 缺少 ### 里程碑 區塊）")
    if not payload.get("members"):
        warnings.append("⚠️   members 為空（成員資料未從 Railway 繼承）")

    bad_statuses = [
        a["task"][:30] for a in payload.get("actions", [])
        if a.get("status") not in VALID_ACTION_STATUSES
    ]
    if bad_statuses:
        warnings.append(
            f"❌  {len(bad_statuses)} 個 action 狀態不合法：{bad_statuses[:3]}{'...' if len(bad_statuses) > 3 else ''}"
        )

    if warnings:
        print("\n⚠️   驗證警告：")
        for w in warnings:
            print(f"    {w}")
    else:
        print("\n✅  驗證通過：weekLabel / weekStart / milestones / members / action 狀態均正常")

    print(f"\n🎉  完成！開啟 Dashboard 確認：{RAILWAY_URL}")

if __name__ == "__main__":
    main()
