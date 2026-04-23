#!/usr/bin/env python3
"""
scripts/gen-report.py — 週報骨架生成腳本
從 backend/data/weeks/W*.json 生成 Markdown 週報骨架

用法：
    python scripts/gen-report.py W17          # 指定週次
    python scripts/gen-report.py              # 自動偵測本週
    python scripts/gen-report.py W17 --force  # 覆寫已存在的報告

腳本會：
    1. 從 W*.json 自動填入所有表格與數字
    2. 用 <!-- TODO --> 標記需要人工撰寫的敘事段落
    3. 輸出到 backend/reports/Pgm_Weekly_Report_YYMMDD.md
    4. 列出所有待填寫項目，方便快速完成
"""

import sys, os, json, math, datetime, re, glob, argparse
from pathlib import Path

# ── 路徑設定 ──────────────────────────────────────────────────────────────────
REPO_ROOT   = Path(__file__).parent.parent
WEEKS_DIR   = REPO_ROOT / "backend" / "data" / "weeks"
REPORTS_DIR = REPO_ROOT / "backend" / "reports"

# ── 對照表 ────────────────────────────────────────────────────────────────────
TEAM_NAMES = {
    "media-agent":  "Media Agent",
    "learnmode":    "LearnMode",
    "chuangzaoli":  "創造栗",
    "tv-solution":  "TV Solution",
    "healthcare":   "BU2 Healthcare",
}

STATUS_ICON = {
    "on-track": "🟢 On Track",
    "at-risk":  "🟡 At Risk",
    "behind":   "🔴 Behind",
    "done":     "✅ Done",
    "upcoming": "🔵 Upcoming",
    "delayed":  "🔴 Delayed",
}

LEVEL_ICON = {
    "high":   "🔴 高",
    "medium": "🟡 中",
    "low":    "🟢 低",
}

ACTION_ICON = {
    "done":        "✅",
    "in-progress": "🔄",
    "pending":     "⏳",
    "blocked":     "🚫",
}


# ── 週次計算（與 store.js _weekLabel() 完全一致）─────────────────────────────
def _js_jan1_day(year):
    jan1 = datetime.date(year, 1, 1)
    return (jan1.weekday() + 1) % 7  # JS getDay(): Sun=0

def current_week_label():
    today = datetime.date.today()
    jan1  = datetime.date(today.year, 1, 1)
    offset = (today - jan1).days
    w = math.ceil((offset + _js_jan1_day(today.year) + 1) / 7)
    return f"W{w:02d}"

def week_date_range(week_label, year=None):
    """回傳該週所有日期（list of datetime.date）"""
    if year is None:
        year = datetime.date.today().year
    week_num    = int(week_label[1:])
    jan1        = datetime.date(year, 1, 1)
    js_jan1_day = _js_jan1_day(year)
    dates = []
    for offset in range(366):
        d = jan1 + datetime.timedelta(days=offset)
        w = math.ceil((offset + js_jan1_day + 1) / 7)
        if w == week_num:
            dates.append(d)
        elif w > week_num:
            break
    return dates

def get_friday(dates):
    return next((d for d in dates if d.weekday() == 4), dates[-1])


# ── 輔助函式 ──────────────────────────────────────────────────────────────────
def col(s, maxlen=0):
    """Markdown 表格安全字串：跳脫 | 並截斷"""
    s = str(s).replace('|', '｜').strip()
    if maxlen and len(s) > maxlen:
        s = s[:maxlen] + '…'
    return s

def detect_source_pdfs(dates):
    """從 ~/Downloads 偵測本週相關 PDF 名稱（提示用）"""
    downloads = Path.home() / "Downloads"
    if not downloads.exists():
        return []
    date_strs = {d.strftime('%y%m%d') for d in dates}
    return sorted(
        f.name for f in downloads.glob("*.pdf")
        if re.search(r'\d{6}', f.stem) and
           re.search(r'\d{6}', f.stem).group() in date_strs
    )


# ── 主要生成邏輯 ──────────────────────────────────────────────────────────────
def build_report(week_label, data, dates):
    monday  = dates[0]
    friday  = get_friday(dates)
    period  = f"{monday.strftime('%Y/%m/%d')} – {friday.strftime('%Y/%m/%d')}"

    projects   = data.get('projects', [])
    risks      = data.get('risks', [])
    actions    = data.get('actions', [])
    milestones = data.get('milestones', [])
    snapshots  = data.get('snapshots', [])
    snap       = next(
        (s for s in reversed(snapshots) if s.get('weekLabel') == week_label),
        snapshots[-1] if snapshots else {}
    )

    on_track   = [p for p in projects if p.get('status') == 'on-track']
    at_risk    = [p for p in projects if p.get('status') == 'at-risk']
    behind     = [p for p in projects if p.get('status') == 'behind']
    open_risks = [r for r in risks if r.get('status') != 'closed']
    high_risks = [r for r in open_risks if r.get('level') == 'high']
    new_risks  = [r for r in risks
                  if r.get('weekStart') == data.get('weekStart')
                  and r.get('status') != 'closed']
    done_a     = [a for a in actions if a.get('status') == 'done']
    upcoming_ms = sorted(
        [m for m in milestones if m.get('status') == 'upcoming'],
        key=lambda x: x.get('date', '')
    )

    # 偵測本週 PDF 來源
    pdfs = detect_source_pdfs(dates)
    NUMS = "①②③④⑤⑥⑦⑧⑨⑩"

    # 保持專案在 JSON 中的團隊出現順序
    teams = list(dict.fromkeys(p['team'] for p in projects))

    L = []  # 輸出行

    # =========================================================================
    # 標頭
    # =========================================================================
    L += [
        "# VIA Technologies — Program Sync 週報",
        "",
        "---",
        "",
        "**報告標題：** VIA Technologies — Program Sync 週報",
        f"**報告週期：** {period}",
        f"**報告日期：** {friday.strftime('%Y/%m/%d')}",
        "**彙整人：** <!-- TODO: 填入彙整人姓名 -->",
        "**涵蓋團隊：** Media Agent / 創造栗 / LearnMode / TV Solution / BU2 Healthcare",
        "",
        "**來源文件：**",
    ]
    if pdfs:
        for i, p in enumerate(pdfs):
            num = NUMS[i] if i < len(NUMS) else f"{i+1}."
            L.append(f"{num} {p}")
    else:
        L += [
            "<!-- TODO: 列出本週來源會議記錄，例如：",
            f"① {monday.strftime('%y%m%d')}_Program Progress Follow",
            f"② {friday.strftime('%y%m%d')}_XXX 例會紀錄",
            "-->",
        ]
    L += ["", "---", ""]

    # =========================================================================
    # 章節一：Executive Summary（人工撰寫）
    # =========================================================================
    L += [
        "## 章節一：Executive Summary",
        "",
        "<!-- TODO: 請填寫本週重點摘要（建議 3–4 段，每段聚焦一個主題）",
        "     第一段：本週最重要的進展 / 已完成里程碑",
        "     第二段：重大決策或策略方向調整",
        "     第三段：新識別的風險或阻礙",
        "     第四段：下週關鍵事項預告 -->",
        "",
        "---",
        "",
    ]

    # =========================================================================
    # 章節二：關鍵專案進度（自動生成）
    # =========================================================================
    L += ["## 章節二：關鍵專案進度", ""]

    # 整體健康度
    total_a = snap.get('totalActions', len(actions))
    comp_a  = snap.get('completedActions', len(done_a))
    L += [
        "### 整體健康度快照",
        "",
        "| 指標 | 本週 |",
        "|------|------|",
        f"| 整體健康度 | **{snap.get('onTrackPct', '?')}%** |",
        f"| On Track / At Risk / Behind | {len(on_track)} / {len(at_risk)} / {len(behind)} |",
        f"| 高風險數 | {snap.get('highRisks', len(high_risks))} 項 |",
        f"| Action 完成率 | {comp_a} / {total_a} |",
        "",
    ]

    # 專案狀態總覽
    L += [
        "### 專案狀態總覽",
        "",
        "| 專案 | 團隊 | 狀態 | 進度 | 負責人 | 目標日期 |",
        "|------|------|------|------|--------|----------|",
    ]
    for p in projects:
        t = TEAM_NAMES.get(p.get('team', ''), p.get('team', ''))
        s = STATUS_ICON.get(p.get('status', ''), p.get('status', ''))
        L.append(
            f"| {col(p['name'], 28)} | {t} | {s} | {p.get('progress', 0)}% "
            f"| {col(p.get('owner', ''))} | {p.get('targetDate', '')} |"
        )
    L += [""]

    # 各團隊詳述
    for i, team in enumerate(teams, 1):
        team_name    = TEAM_NAMES.get(team, team)
        team_projs   = [p for p in projects if p['team'] == team]
        L += [f"### 2.{i} {team_name}", ""]

        for p in team_projs:
            s = STATUS_ICON.get(p.get('status', ''), p.get('status', ''))
            done   = col(p.get('weekDone', ''))  or '<!-- TODO: 本週完成事項 -->'
            blocks = col(p.get('blockers', ''))  or '無'
            L += [
                f"**{col(p['name'])}**（{s}）",
                "",
                f"- 本週完成：{done}",
                f"- 阻礙：{blocks}",
                f"- 進度：{p.get('progress', 0)}%　目標日期：{p.get('targetDate', '')}",
                "",
            ]

        L += [
            "<!-- TODO: 補充本團隊本週重點敘事、背景脈絡或決策理由（可選） -->",
            "",
            "---",
            "",
        ]

    # =========================================================================
    # 章節三：風險追蹤（自動生成）
    # =========================================================================
    L += [
        "## 章節三：風險追蹤",
        "",
        (f"本週追蹤中風險 **{len(open_risks)}** 項"
         f"（高 {snap.get('highRisks', 0)} / 中 {snap.get('mediumRisks', 0)}"
         f" / 低 {snap.get('lowRisks', 0)}）"
         f"；本週新增 {len(new_risks)} 項。"),
        "",
        "| 等級 | 描述 | 負責人 | 狀態 | 應對措施 |",
        "|------|------|--------|------|----------|",
    ]
    STATUS_CN = {'open': '待處理', 'in-progress': '處理中', 'closed': '已關閉'}
    for r in open_risks:
        lv  = LEVEL_ICON.get(r.get('level', ''), r.get('level', ''))
        st  = STATUS_CN.get(r.get('status', ''), r.get('status', ''))
        mit = col(r.get('mitigation', ''), 40) or '<!-- TODO -->'
        L.append(
            f"| {lv} | {col(r['description'], 45)} "
            f"| {col(r.get('owner', ''))} | {st} | {mit} |"
        )
    L += [
        "",
        "<!-- TODO: 補充本週風險討論重點、是否升降級或已關閉（可選） -->",
        "",
        "---",
        "",
    ]

    # =========================================================================
    # 章節四：Action Items（自動生成，按團隊分組）
    # =========================================================================
    L += ["## 章節四：Action Items", ""]
    for team in teams:
        team_name  = TEAM_NAMES.get(team, team)
        proj_ids   = {p['id'] for p in projects if p['team'] == team}
        team_acts  = [a for a in actions if a.get('project', '') in proj_ids]
        if not team_acts:
            continue
        L += [
            f"### {team_name}",
            "",
            "| # | 任務 | 負責人 | 截止日 | 狀態 |",
            "|---|------|--------|--------|------|",
        ]
        for idx, a in enumerate(team_acts, 1):
            icon = ACTION_ICON.get(a.get('status', ''), '')
            L.append(
                f"| {idx} | {col(a['task'], 55)} "
                f"| {col(a.get('owner', ''))} "
                f"| {a.get('dueDate', '')} "
                f"| {icon} {a.get('status', '')} |"
            )
        L += [""]
    L += ["---", ""]

    # =========================================================================
    # 章節五：里程碑追蹤（自動生成）
    # =========================================================================
    L += [
        "## 章節五：里程碑追蹤",
        "",
        "| 里程碑 | 日期 | 團隊 | 狀態 |",
        "|--------|------|------|------|",
    ]
    for m in sorted(milestones, key=lambda x: x.get('date', '')):
        t = TEAM_NAMES.get(m.get('team', ''), m.get('team', ''))
        s = STATUS_ICON.get(m.get('status', ''), m.get('status', ''))
        L.append(f"| {col(m['name'], 38)} | {m.get('date', '')} | {t} | {s} |")
    L += ["", "---", ""]

    # =========================================================================
    # 章節六：關鍵決策（人工撰寫）
    # =========================================================================
    L += [
        "## 章節六：關鍵決策",
        "",
        "<!-- TODO: 列出本週 3–6 項關鍵決策，格式如下：",
        "1. **[決策標題]**：[決策內容與背景說明]",
        "2. **[決策標題]**：[決策內容與背景說明]",
        "3. **[決策標題]**：[決策內容與背景說明]",
        "-->",
        "",
        "---",
        "",
    ]

    # =========================================================================
    # 章節七：下週重點預告（自動生成 upcoming 里程碑）
    # =========================================================================
    L += ["## 章節七：下週重點預告", ""]
    if upcoming_ms:
        L += [
            "| 日期 | 事項 | 團隊 |",
            "|------|------|------|",
        ]
        for m in upcoming_ms[:8]:
            t = TEAM_NAMES.get(m.get('team', ''), m.get('team', ''))
            L.append(f"| {m.get('date', '')} | {col(m['name'], 42)} | {t} |")
    else:
        L += ["<!-- TODO: 填入下週重點事項 -->"]

    L += [
        "",
        "<!-- TODO: 補充下週重點說明，包括需要決策者關注或提前準備的事項（可選） -->",
        "",
        "---",
        "",
        f"*VIA P&D Center Program Sync — {week_label} | {period}*",
        f"*骨架由 `scripts/gen-report.py` 自動生成，`<!-- TODO -->` 段落請人工填寫*",
    ]

    return '\n'.join(L)


# ── TODO 統計 ─────────────────────────────────────────────────────────────────
def count_todos(text):
    return text.count('<!-- TODO')


def print_todo_summary(text, out_path):
    todos = [
        ln.strip() for ln in text.splitlines()
        if '<!-- TODO' in ln
    ]
    print(f"\n  📋 待填寫項目（{len(todos)} 處）：")
    for t in todos:
        # 擷取 TODO 後的描述
        m = re.search(r'<!-- TODO[:\s]*(.{0,60})', t)
        desc = m.group(1).strip(' -:') if m else t[:60]
        print(f"     • {desc}")
    print()
    print(f"  完成後執行：")
    print(f"    ./scripts/release-week.sh")


# ── CLI 入口 ──────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description='從 W*.json 生成週報 Markdown 骨架'
    )
    parser.add_argument('week', nargs='?', help='週次，例如 W17（省略則自動偵測）')
    parser.add_argument('--force', '-f', action='store_true',
                        help='若目標檔案已存在則強制覆寫')
    args = parser.parse_args()

    # 解析週次
    week_label = (args.week or '').strip().upper()
    if not week_label:
        week_label = current_week_label()
        print(f"ℹ 未指定週次，自動偵測為：{week_label}")
    elif not re.match(r'^W\d{2}$', week_label):
        print(f"❌ 週次格式錯誤：'{week_label}'，應為 W09…W53")
        sys.exit(1)

    print(f"\n{'═'*46}")
    print(f"  📝 gen-report.py — 生成 {week_label} 週報骨架")
    print(f"{'═'*46}\n")

    # 讀取 JSON
    json_path = WEEKS_DIR / f"{week_label}.json"
    if not json_path.exists():
        print(f"❌ 找不到 {json_path}")
        print(f"   請先確認 backend/data/weeks/{week_label}.json 已建立。")
        sys.exit(1)

    with open(json_path, encoding='utf-8') as f:
        data = json.load(f)

    p_cnt = len(data.get('projects', []))
    r_cnt = len(data.get('risks', []))
    a_cnt = len(data.get('actions', []))
    m_cnt = len(data.get('milestones', []))
    print(f"  資料來源：{json_path.name}")
    print(f"  projects={p_cnt}  risks={r_cnt}  actions={a_cnt}  milestones={m_cnt}")
    print()

    # 計算日期
    dates  = week_date_range(week_label)
    friday = get_friday(dates)

    # 決定輸出路徑
    out_name = f"Pgm_Weekly_Report_{friday.strftime('%y%m%d')}.md"
    out_path = REPORTS_DIR / out_name

    if out_path.exists() and not args.force:
        print(f"⚠  檔案已存在：{out_path.relative_to(REPO_ROOT)}")
        ans = input("   覆寫？[y/N] ").strip().lower()
        if ans != 'y':
            print("   已取消。若要強制覆寫請加 --force 參數。")
            sys.exit(0)

    # 生成報告
    report_text = build_report(week_label, data, dates)

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(report_text)

    monday = dates[0]
    print(f"  ✅ 骨架已生成：{out_path.relative_to(REPO_ROOT)}")
    print(f"  週次範圍：{monday.strftime('%Y/%m/%d')} – {friday.strftime('%Y/%m/%d')}")
    print(f"  字元數：{len(report_text):,}")

    print_todo_summary(report_text, out_path)
    print(f"  用編輯器開啟：")
    print(f"    open '{out_path}'")
    print()


if __name__ == '__main__':
    main()
