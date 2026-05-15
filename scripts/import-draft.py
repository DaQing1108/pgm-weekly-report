#!/usr/bin/env python3
"""
scripts/import-draft.py — 從週報草稿 MD 匯入 Dashboard

用法：
    python3 scripts/import-draft.py ~/Desktop/ProgramSync_W21_2026-05-22_draft.md
    python3 scripts/import-draft.py ~/Desktop/ProgramSync_W21_2026-05-22_draft.md --push
    python3 scripts/import-draft.py ~/Desktop/ProgramSync_W21_2026-05-22_draft.md --yes

功能：
    1. 解析草稿 MD 中的 專案進度、Action Items、Risks 三張表
    2. 轉換為 Dashboard JSON 格式
    3. 若目標 W##.json 已存在，合併（保留已有項目的 ID 與 _createdAt）
    4. 寫入 backend/data/weeks/W##.json
    5. --push：呼叫 Railway API 同步至線上 DB（需 ADMIN_TOKEN 環境變數）
"""

import sys
import os
import re
import json
import argparse
import urllib.request
import urllib.error
from pathlib import Path
from datetime import datetime, timedelta, timezone

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
def parse_table(text, section_header):
    """
    找到 section_header 之後的第一張 markdown table，
    回傳 list of dict（key = header 欄名）。
    """
    # 找 section
    pattern = rf"##\s+{re.escape(section_header)}\s*\n(.*?)(?=\n##\s|\Z)"
    m = re.search(pattern, text, re.DOTALL)
    if not m:
        return []

    block = m.group(1)
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
        # pad or trim to match header count
        while len(cells) < len(headers):
            cells.append("")
        row = {h: cells[i] for i, h in enumerate(headers)}
        rows.append(row)
    return rows

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
def parse_projects(text, week_label, week_start, existing):
    rows = parse_table(text, "專案進度")
    projects = []
    for i, row in enumerate(rows, 1):
        name       = row.get("專案名稱", "").strip()
        status     = row.get("狀態", "on-track").strip().lower()
        progress   = row.get("進度 %", "0").strip().rstrip("%")
        week_done  = row.get("本週更新", "").strip()
        notes      = row.get("備註", "").strip()

        if not name or name.startswith("-"):
            continue

        # 從備註推斷 owner（「XXX 主導」「XXX 負責」）
        owner_match = re.search(r"(\w+(?:\s+\w+)?)\s*(?:主導|負責|Responsible)", notes)
        owner = owner_match.group(1) if owner_match else ""

        try:
            progress_int = int(float(progress))
        except (ValueError, TypeError):
            progress_int = 0

        existing_item = find_existing(existing, "name", name)
        proj = {
            "id":           existing_item["id"] if existing_item else make_id("proj", week_label, i),
            "name":         name,
            "team":         existing_item.get("team", infer_team(name + " " + notes)) if existing_item else infer_team(name + " " + notes),
            "status":       status,
            "weekStart":    week_start,
            "description":  existing_item.get("description", week_done) if existing_item else week_done,
            "owner":        existing_item.get("owner", owner) if existing_item else owner,
            "dueDate":      existing_item.get("dueDate", "") if existing_item else "",
            "progress":     progress_int,
            "targetDate":   existing_item.get("targetDate", "") if existing_item else "",
            "progressMode": "manual",
            "weekDone":     week_done,
            "blockers":     notes,
            "_createdAt":   existing_item["_createdAt"] if existing_item else iso_now(),
            "_updatedAt":   iso_now(),
        }
        projects.append(proj)
    return projects

# ── 草稿解析：Action Items ────────────────────────────────────────────────────
STATUS_MAP = {
    "pending":     "not-started",
    "in-progress": "in-progress",
    "in progress": "in-progress",
    "done":        "done",
    "completed":   "done",
}

def parse_actions(text, week_label, week_start, existing, projects):
    rows = parse_table(text, "Action Items")
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
        status_norm = STATUS_MAP.get(status, "not-started")

        existing_item = find_existing(existing, "task", task)

        # 嘗試關聯專案
        project_id   = ""
        project_name = ""
        for pname, pid in proj_name_to_id.items():
            keywords = [w for w in pname.split() if len(w) > 2]
            if any(kw in task for kw in keywords):
                project_id   = pid
                project_name = pname
                break

        action = {
            "id":        existing_item["id"] if existing_item else make_id("action", week_label, i),
            "task":      task,
            "owner":     owner,
            "team":      existing_item.get("team", infer_team(task)) if existing_item else infer_team(task),
            "dueDate":   parse_date(due_raw),
            "status":    status_norm,
            "priority":  existing_item.get("priority", "P2") if existing_item else "P2",
            "weekStart": week_start,
            "projectId": existing_item.get("projectId", project_id) if existing_item else project_id,
            "category":  category,
            "project":   existing_item.get("project", project_name) if existing_item else project_name,
            "_createdAt": existing_item["_createdAt"] if existing_item else iso_now(),
            "_updatedAt": iso_now(),
        }
        actions.append(action)
    return actions

# ── 草稿解析：Risks ───────────────────────────────────────────────────────────
def parse_risks(text, week_label, week_start, existing):
    rows = parse_table(text, "Risks")
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

# ── Push 至 Railway ───────────────────────────────────────────────────────────
def push_to_railway(week_label, payload):
    token = os.environ.get("ADMIN_TOKEN", "")
    if not token:
        # 嘗試讀取 .env
        env_path = REPO_ROOT / ".env"
        if env_path.exists():
            for line in env_path.read_text().splitlines():
                if line.startswith("ADMIN_TOKEN="):
                    token = line.split("=", 1)[1].strip().strip('"').strip("'")
                    break
    if not token:
        print("❌  ADMIN_TOKEN 未設定，無法 push。請設定環境變數或 .env 檔。")
        return False

    url  = f"{RAILWAY_URL}/api/weeks/{week_label}"
    data = json.dumps(payload).encode("utf-8")
    req  = urllib.request.Request(
        url,
        data=data,
        headers={
            "Content-Type":  "application/json",
            "Authorization": f"Bearer {token}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            body = json.loads(resp.read())
            if body.get("success"):
                print(f"✅  Railway 同步成功：{url}")
                return True
            else:
                print(f"⚠️   Railway 回應異常：{body}")
                return False
    except urllib.error.HTTPError as e:
        print(f"❌  HTTP {e.code}：{e.read().decode()}")
        return False
    except Exception as e:
        print(f"❌  Push 失敗：{e}")
        return False

# ── 主程式 ────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="從週報草稿 MD 匯入 Dashboard JSON")
    parser.add_argument("draft", help="草稿 MD 檔案路徑（例：~/Desktop/ProgramSync_W21_2026-05-22_draft.md）")
    parser.add_argument("--push",  action="store_true", help="同步至 Railway 線上 DB")
    parser.add_argument("--yes",   action="store_true", help="略過確認直接寫入")
    args = parser.parse_args()

    draft_path = Path(args.draft).expanduser().resolve()
    if not draft_path.exists():
        print(f"❌  找不到草稿：{draft_path}")
        sys.exit(1)

    # 從檔名取得週次
    m = re.search(r"ProgramSync_(W\d{1,2})_", draft_path.name, re.IGNORECASE)
    if not m:
        print("❌  無法從檔名解析週次，檔名格式應為 ProgramSync_W##_YYYY-MM-DD_draft.md")
        sys.exit(1)
    week_label = m.group(1).upper()
    week_start = week_start_for(week_label)
    if not week_start:
        print(f"❌  無法計算 {week_label} 的 weekStart")
        sys.exit(1)

    print(f"\n📄  草稿：{draft_path.name}")
    print(f"📅  週次：{week_label}（weekStart: {week_start}）")

    # 讀取草稿
    text = draft_path.read_text(encoding="utf-8")

    # 讀取現有 JSON（合併用）
    out_path = WEEKS_DIR / f"{week_label}.json"
    existing_data = {}
    if out_path.exists():
        existing_data = json.loads(out_path.read_text(encoding="utf-8"))
        print(f"🔀  找到現有 {week_label}.json，將合併（保留已有項目的 ID）")
    else:
        print(f"🆕  {week_label}.json 不存在，將全新建立")

    existing_projects = existing_data.get("projects", [])
    existing_actions  = existing_data.get("actions",  [])
    existing_risks    = existing_data.get("risks",    [])

    # 解析草稿
    projects = parse_projects(text, week_label, week_start, existing_projects)
    actions  = parse_actions(text, week_label, week_start, existing_actions, projects)
    risks    = parse_risks(text, week_label, week_start, existing_risks)

    print(f"\n📊  解析結果：")
    print(f"    專案進度：{len(projects)} 筆")
    print(f"    Action Items：{len(actions)} 筆")
    print(f"    Risks：{len(risks)} 筆")

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
        "milestones":   existing_data.get("milestones", []),
        "snapshots":    existing_snapshots,
        "drafts":       existing_data.get("drafts",     []),
        "members":      existing_data.get("members",    []),
        "_exportedAt":  now,
        "_savedAt":     now,
        "_version":     "import-draft-v1",
        "_dataVersion": existing_data.get("_dataVersion", 1),
    }

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
        push_to_railway(week_label, payload)

    print(f"\n🎉  完成！開啟 Dashboard 確認：{RAILWAY_URL}")

if __name__ == "__main__":
    main()
