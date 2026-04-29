#!/usr/bin/env bash
# =============================================================================
# scripts/new-week.sh
# 開新週：從上一週 JSON 帶入資料，建立正確的新週快照
#
# 用法：
#   ./scripts/new-week.sh        ← 自動偵測目前週次
#   ./scripts/new-week.sh W19   ← 指定週次
#
# 腳本會：
#   1. 計算新週次 label（或使用指定值）
#   2. 尋找最近一週的有效 JSON 作為基底
#   3. 複製 projects / risks / actions / milestones
#   4. 計算並附加新週 snapshot
#   5. 寫入 backend/data/weeks/<WEEK>.json
# =============================================================================

set -e

RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${CYAN}ℹ ${RESET}$*"; }
success() { echo -e "${GREEN}✅ $*${RESET}"; }
warn()    { echo -e "${YELLOW}⚠ $*${RESET}"; }
error()   { echo -e "${RED}❌ $*${RESET}"; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
WEEKS_DIR="${REPO_ROOT}/backend/data/weeks"
cd "${REPO_ROOT}"

# ── 計算目前週次（與 store.js _weekLabel() 相同邏輯）──────────────────────────
current_week_label() {
  python3 - <<'PYEOF'
import datetime, math
today = datetime.date.today()
jan1  = datetime.date(today.year, 1, 1)
js_jan1_day = (jan1.weekday() + 1) % 7
days_diff   = (today - jan1).days
week = math.ceil((days_diff + js_jan1_day + 1) / 7)
print(f"W{week:02d}")
PYEOF
}

# ── 解析參數 ──────────────────────────────────────────────────────────────────
WEEK="${1:-}"
if [[ -z "${WEEK}" ]]; then
  WEEK="$(current_week_label)"
  info "未指定週次，自動偵測為：${BOLD}${WEEK}${RESET}"
else
  WEEK="${WEEK^^}"
  [[ "${WEEK}" =~ ^W[0-9]{2}$ ]] || error "週次格式錯誤：'${WEEK}'。應為 W01…W53"
fi

echo ""
echo -e "${BOLD}═══════════════════════════════════════════${RESET}"
echo -e "${BOLD}  🗓  新週初始化：${WEEK}${RESET}"
echo -e "${BOLD}═══════════════════════════════════════════${RESET}"
echo ""

TARGET="${WEEKS_DIR}/${WEEK}.json"

# ── 若目標已存在且 projects > 0，詢問是否覆蓋 ────────────────────────────────
if [[ -f "${TARGET}" ]]; then
  EXISTING_P=$(python3 -c "
import json
with open('${TARGET}') as f: d=json.load(f)
print(len(d.get('projects',[])))
" 2>/dev/null || echo "0")
  if [[ "${EXISTING_P}" -gt 0 ]]; then
    warn "${TARGET} 已存在且含 ${EXISTING_P} 個專案。"
    read -r -p "$(echo -e "${BOLD}確定要覆蓋？[y/N] ${RESET}")" CONFIRM
    [[ "${CONFIRM}" == "y" || "${CONFIRM}" == "Y" ]] || { warn "已取消。"; exit 0; }
  else
    warn "${TARGET} 已存在但 projects=0，將重新建立。"
  fi
fi

# ── 尋找最近一週的有效 JSON 基底 ─────────────────────────────────────────────
info "尋找上一週有效資料..."
BASE_FILE=""
BASE_LABEL=""

python3 - "${WEEK}" "${WEEKS_DIR}" <<'PYEOF'
import sys, os, json, math, datetime

target_label = sys.argv[1]
weeks_dir    = sys.argv[2]
target_num   = int(target_label[1:])

files = sorted(
    [f for f in os.listdir(weeks_dir) if f.endswith('.json')],
    reverse=True
)
for fname in files:
    label = fname.replace('.json','')
    try:
        num = int(label[1:])
    except ValueError:
        continue
    if num >= target_num:
        continue
    path = os.path.join(weeks_dir, fname)
    try:
        with open(path) as f:
            d = json.load(f)
        p = len(d.get('projects', []))
        if p > 0:
            print(f"FOUND:{label}:{path}:{p}")
            sys.exit(0)
    except Exception:
        pass
print("NOTFOUND")
PYEOF
SEARCH_RESULT=$(python3 - "${WEEK}" "${WEEKS_DIR}" <<'PYEOF'
import sys, os, json

target_label = sys.argv[1]
weeks_dir    = sys.argv[2]
target_num   = int(target_label[1:])

files = sorted(
    [f for f in os.listdir(weeks_dir) if f.endswith('.json')],
    reverse=True
)
for fname in files:
    label = fname.replace('.json','')
    try:
        num = int(label[1:])
    except ValueError:
        continue
    if num >= target_num:
        continue
    path = os.path.join(weeks_dir, fname)
    try:
        with open(path) as f:
            d = json.load(f)
        p = len(d.get('projects', []))
        if p > 0:
            print(f"FOUND:{label}:{path}:{p}")
            sys.exit(0)
    except Exception:
        pass
print("NOTFOUND")
PYEOF
)

if [[ "${SEARCH_RESULT}" == "NOTFOUND" ]]; then
  error "找不到任何含有效 projects 的歷史週次 JSON。\n   請先確認 ${WEEKS_DIR}/ 中有合法的歷史資料。"
fi

BASE_LABEL="${SEARCH_RESULT#FOUND:}"; BASE_LABEL="${BASE_LABEL%%:*}"
REST="${SEARCH_RESULT#FOUND:${BASE_LABEL}:}"
BASE_FILE="${REST%%:*}"
BASE_COUNT="${REST##*:}"

info "基底週次：${BOLD}${BASE_LABEL}${RESET}（${BASE_FILE}，${BASE_COUNT} 個專案）"
echo ""

# ── 建立新週 JSON ─────────────────────────────────────────────────────────────
info "建立 ${WEEK}.json..."

python3 - "${WEEK}" "${BASE_FILE}" "${TARGET}" <<'PYEOF'
import sys, json, copy, datetime, math
from collections import defaultdict

new_label = sys.argv[1]
base_path = sys.argv[2]
out_path  = sys.argv[3]

with open(base_path) as f:
    base = json.load(f)

# 計算新週的 weekStart（與 store.js _weekLabel 邏輯一致）
new_num  = int(new_label[1:])
year     = datetime.date.today().year
jan1     = datetime.date(year, 1, 1)
js_jan1  = (jan1.weekday() + 1) % 7

week_start = None
for offset in range(366):
    d = jan1 + datetime.timedelta(days=offset)
    w = math.ceil((offset + js_jan1 + 1) / 7)
    if w == new_num:
        week_start = d.isoformat()
        break

if not week_start:
    print(f"ERROR: 無法計算 {new_label} 的 weekStart", file=sys.stderr)
    sys.exit(1)

projects  = copy.deepcopy(base.get('projects', []))
risks     = copy.deepcopy(base.get('risks', []))
actions   = copy.deepcopy(base.get('actions', []))
milestones= copy.deepcopy(base.get('milestones', []))

# 計算新週 snapshot
total    = len(projects)
on_track = sum(1 for p in projects if p.get('status') == 'on-track')
at_risk  = sum(1 for p in projects if p.get('status') == 'at-risk')
behind   = sum(1 for p in projects if p.get('status') == 'behind')
on_pct   = round(on_track / total * 100) if total else 0

h_risks  = sum(1 for r in risks if r.get('level')=='high'   and r.get('status')!='closed')
m_risks  = sum(1 for r in risks if r.get('level')=='medium' and r.get('status')!='closed')
l_risks  = sum(1 for r in risks if r.get('level')=='low'    and r.get('status')!='closed')

today    = datetime.date.today().isoformat()
overdue  = sum(1 for a in actions if a.get('dueDate','') < today and a.get('status') != 'done')
completed= sum(1 for a in actions if a.get('status') == 'done')

team_map = defaultdict(list)
for p in projects:
    t = p.get('team','')
    if t: team_map[t].append(p.get('status',''))
team_health = {t: round(sum(1 for s in ss if s=='on-track')/len(ss)*100) for t, ss in team_map.items()}

saved_at = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.000Z')

new_snap = {
    'id': f'snap-{new_label.lower()}',
    'weekStart':        week_start,
    'weekLabel':        new_label,
    'onTrackPct':       on_pct,
    'atRiskCount':      at_risk,
    'behindCount':      behind,
    'highRisks':        h_risks,
    'mediumRisks':      m_risks,
    'lowRisks':         l_risks,
    'totalProjects':    total,
    'overdueActions':   overdue,
    'completedActions': completed,
    'totalActions':     len(actions),
    'teamHealth':       team_health,
    'reviewStatus':     'draft',
    'snapshotBy':       'System',
    '_createdAt':       saved_at,
    '_updatedAt':       saved_at,
}

# 歷史 snapshots 保留（排除同 weekLabel 的舊版）
hist_snaps = [s for s in base.get('snapshots', []) if s.get('weekLabel') != new_label]

out = {
    'projects':   projects,
    'risks':      risks,
    'actions':    actions,
    'milestones': milestones,
    'snapshots':  hist_snaps + [new_snap],
    'drafts':     copy.deepcopy(base.get('drafts', [])),
    'members':    copy.deepcopy(base.get('members', [])),
    '_savedAt':   saved_at,
}

with open(out_path, 'w') as f:
    json.dump(out, f, ensure_ascii=False, indent=2)

print(f"OK:{total}:{on_pct}:{at_risk}:{overdue}:{week_start}")
PYEOF
BUILD_RESULT=$(python3 - "${WEEK}" "${BASE_FILE}" "${TARGET}" <<'PYEOF'
import sys, json, copy, datetime, math
from collections import defaultdict

new_label = sys.argv[1]
base_path = sys.argv[2]
out_path  = sys.argv[3]

with open(base_path) as f:
    base = json.load(f)

new_num  = int(new_label[1:])
year     = datetime.date.today().year
jan1     = datetime.date(year, 1, 1)
js_jan1  = (jan1.weekday() + 1) % 7

week_start = None
for offset in range(366):
    d = jan1 + datetime.timedelta(days=offset)
    w = math.ceil((offset + js_jan1 + 1) / 7)
    if w == new_num:
        week_start = d.isoformat()
        break

if not week_start:
    print(f"ERROR: 無法計算 {new_label} 的 weekStart", file=sys.stderr)
    sys.exit(1)

projects  = copy.deepcopy(base.get('projects', []))
risks     = copy.deepcopy(base.get('risks', []))
actions   = copy.deepcopy(base.get('actions', []))
milestones= copy.deepcopy(base.get('milestones', []))

total    = len(projects)
on_track = sum(1 for p in projects if p.get('status') == 'on-track')
at_risk  = sum(1 for p in projects if p.get('status') == 'at-risk')
behind   = sum(1 for p in projects if p.get('status') == 'behind')
on_pct   = round(on_track / total * 100) if total else 0

h_risks  = sum(1 for r in risks if r.get('level')=='high'   and r.get('status')!='closed')
m_risks  = sum(1 for r in risks if r.get('level')=='medium' and r.get('status')!='closed')
l_risks  = sum(1 for r in risks if r.get('level')=='low'    and r.get('status')!='closed')

today    = datetime.date.today().isoformat()
overdue  = sum(1 for a in actions if a.get('dueDate','') < today and a.get('status') != 'done')
completed= sum(1 for a in actions if a.get('status') == 'done')

team_map = defaultdict(list)
for p in projects:
    t = p.get('team','')
    if t: team_map[t].append(p.get('status',''))
team_health = {t: round(sum(1 for s in ss if s=='on-track')/len(ss)*100) for t, ss in team_map.items()}

saved_at = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.000Z')

new_snap = {
    'id': f'snap-{new_label.lower()}',
    'weekStart': week_start, 'weekLabel': new_label,
    'onTrackPct': on_pct, 'atRiskCount': at_risk, 'behindCount': behind,
    'highRisks': h_risks, 'mediumRisks': m_risks, 'lowRisks': l_risks,
    'totalProjects': total, 'overdueActions': overdue,
    'completedActions': completed, 'totalActions': len(actions),
    'teamHealth': team_health, 'reviewStatus': 'draft', 'snapshotBy': 'System',
    '_createdAt': saved_at, '_updatedAt': saved_at,
}

hist_snaps = [s for s in base.get('snapshots', []) if s.get('weekLabel') != new_label]

out = {
    'projects': projects, 'risks': risks, 'actions': actions,
    'milestones': milestones, 'snapshots': hist_snaps + [new_snap],
    'drafts': copy.deepcopy(base.get('drafts', [])),
    'members': copy.deepcopy(base.get('members', [])),
    '_savedAt': saved_at,
}

with open(out_path, 'w') as f:
    json.dump(out, f, ensure_ascii=False, indent=2)

print(f"OK:{total}:{on_pct}:{at_risk}:{overdue}:{week_start}")
PYEOF
)

if [[ "${BUILD_RESULT}" != OK:* ]]; then
  error "建立 ${WEEK}.json 失敗：${BUILD_RESULT}"
fi

IFS=':' read -r _ P_COUNT ON_PCT AT_RISK OVERDUE WEEK_START <<< "${BUILD_RESULT}"

echo ""
success "${WEEK}.json 建立完成"
echo ""
echo -e "   週次起始：${CYAN}${WEEK_START}${RESET}"
echo -e "   專案數量：${BOLD}${P_COUNT}${RESET} 個"
echo -e "   健康度  ：${BOLD}${ON_PCT}%${RESET}（At Risk: ${AT_RISK}）"
echo -e "   逾期 Actions：${AT_RISK} 項"
echo ""
echo -e "下一步：更新本週資料後，執行 ${CYAN}./scripts/release-week.sh ${WEEK}${RESET} 發布。"
echo ""
