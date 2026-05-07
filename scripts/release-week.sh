#!/usr/bin/env bash
# =============================================================================
# scripts/release-week.sh
# 週報系統每週發布腳本 — 確保 JSON 資料 + Markdown 週報同步提交上線
#
# 用法：
#   ./scripts/release-week.sh W17
#   ./scripts/release-week.sh        ← 自動偵測目前週次
#
# 腳本會：
#   1. 確認 backend/data/weeks/<WEEK>.json 存在
#   2. 偵測 backend/reports/ 中新增/修改的 .md 週報
#   3. 列出將提交的內容讓你確認
#   4. git add → git commit → git push
# =============================================================================

set -eo pipefail  # 任何指令或管線失敗即停止

# ── 顏色輸出 ─────────────────────────────────────────────────────────────────
RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${CYAN}ℹ ${RESET}$*"; }
success() { echo -e "${GREEN}✅ $*${RESET}"; }
warn()    { echo -e "${YELLOW}⚠ $*${RESET}"; }
error()   { echo -e "${RED}❌ $*${RESET}"; exit 1; }

# ── 切換到 repo 根目錄 ────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}"

# ── 計算目前週次（與 store.js _weekLabel() 邏輯相同） ────────────────────────
current_week_label() {
  python3 - <<'PYEOF'
import datetime, math, sys

today = datetime.date.today()
jan1  = datetime.date(today.year, 1, 1)
# Python weekday(): Mon=0…Sun=6；JS getDay(): Sun=0…Sat=6
# JS jan1.getDay() 等於 Python (jan1.weekday()+1) % 7
js_jan1_day = (jan1.weekday() + 1) % 7
days_diff   = (today - jan1).days
week = math.ceil((days_diff + js_jan1_day + 1) / 7)
print(f"W{week:02d}")
PYEOF
}

# ── 解析參數 ──────────────────────────────────────────────────────────────────
AUTO_YES=false
MD_ONLY=false
WEEK=""
for _arg in "$@"; do
  if [[ "${_arg}" == "--yes" || "${_arg}" == "-y" ]]; then
    AUTO_YES=true
  elif [[ "${_arg}" == "--md-only" ]]; then
    MD_ONLY=true
  elif [[ -z "${WEEK}" ]]; then
    WEEK="${_arg}"
  fi
done

if [[ -z "${WEEK}" ]]; then
  WEEK="$(current_week_label)"
  info "未指定週次，自動偵測為：${BOLD}${WEEK}${RESET}"
else
  # 標準化：w16 → W16
  WEEK="$(echo "${WEEK}" | tr '[:lower:]' '[:upper:]')"
  # 驗證格式
  if [[ ! "${WEEK}" =~ ^W[0-9]{2}$ ]]; then
    error "週次格式錯誤：'${WEEK}'。應為 W09…W53，例如：W17"
  fi
fi

echo ""
echo -e "${BOLD}═══════════════════════════════════════════${RESET}"
if [[ "${MD_ONLY}" == "true" ]]; then
  echo -e "${BOLD}  📄 Release Week：${WEEK}（MD-only 模式）${RESET}"
else
  echo -e "${BOLD}  📦 Release Week：${WEEK}${RESET}"
fi
echo -e "${BOLD}═══════════════════════════════════════════${RESET}"
echo ""

# ── 確認 git 狀態乾淨（非必要，只是提示） ───────────────────────────────────
DIRTY=$(git status --porcelain | grep -v "^??" || true)
if [[ -n "${DIRTY}" ]]; then
  warn "目前 working tree 有已修改但未暫存的檔案："
  echo "${DIRTY}"
  echo ""
fi

# ── 1. 確認 JSON 資料檔存在 ───────────────────────────────────────────────────
JSON_PATH="backend/data/weeks/${WEEK}.json"

if [[ "${MD_ONLY}" == "true" ]]; then
  # MD-only 模式：JSON 不存在時自動建立最小骨架，存在時允許 projects=0
  if [[ ! -f "${JSON_PATH}" ]]; then
    warn "${JSON_PATH} 不存在，自動建立 MD-only 骨架..."
    python3 -c "
import json, datetime
data = {
  'projects': [], 'risks': [], 'actions': [], 'milestones': [],
  'snapshots': [], 'drafts': [], 'members': [],
  '_mdOnly': True,
  '_exportedAt': datetime.datetime.utcnow().isoformat() + 'Z',
  '_version': '2.1'
}
with open('${JSON_PATH}', 'w') as f:
    json.dump(data, f, indent=2)
print('   已建立：${JSON_PATH}')
"
  else
    JSON_SIZE=$(wc -c < "${JSON_PATH}" | tr -d ' ')
    info "週次資料：${JSON_PATH}（${JSON_SIZE} bytes，MD-only 模式跳過 projects 驗證）"
  fi
else
  # 完整模式：JSON 必須存在且 projects > 0
  if [[ ! -f "${JSON_PATH}" ]]; then
    error "找不到 ${JSON_PATH}\n請先確認該週資料已匯出，或執行 store.exportAll() 後重試。\n若本週僅有 MD 週報，請使用 --md-only 旗標：\n  ./scripts/release-week.sh ${WEEK} --md-only"
  fi

  JSON_SIZE=$(wc -c < "${JSON_PATH}" | tr -d ' ')
  info "週次資料：${JSON_PATH}（${JSON_SIZE} bytes）"

  python3 -c "
import json, sys
with open('${JSON_PATH}') as f:
    d = json.load(f)
p = len(d.get('projects', []))
r = len(d.get('risks', []))
a = len(d.get('actions', []))
m = len(d.get('milestones', []))
print(f'   projects={p}  risks={r}  actions={a}  milestones={m}')
if p == 0:
    print('ERROR:projects=0', file=sys.stderr)
    sys.exit(1)
" || error "${JSON_PATH} 的 projects 為空（0 筆）。\n   若本週僅有 MD 週報，請改用：\n     ./scripts/release-week.sh ${WEEK} --md-only\n   若有資料，請先從瀏覽器 Console 執行 store.exportAll() 再重試。"
fi

echo ""

# ── 2. 確認本週 MD 週報存在（已提交或新增均可）──────────────────────────────
info "搜尋 ${WEEK} 的 MD 週報..."

WEEK_DATE_INFO=$(python3 - "${WEEK}" <<'PYEOF'
import sys, math, datetime, glob, re

week_label  = sys.argv[1]
week_num    = int(week_label[1:])
year        = datetime.date.today().year
jan1        = datetime.date(year, 1, 1)
js_jan1_day = (jan1.weekday() + 1) % 7   # 與 store.js _weekLabel() 一致

# 枚舉本週所有日期（所有使 _weekLabel(d)==week_num 的日期）
week_dates = []
for offset in range(366):
    d = jan1 + datetime.timedelta(days=offset)
    w = math.ceil((offset + js_jan1_day + 1) / 7)
    if w == week_num:
        week_dates.append(d)
    elif w > week_num:
        break

if not week_dates:
    print(f"ERROR:無法計算 {week_label} 的日期範圍")
    sys.exit(0)

monday = week_dates[0]
# 找本週實際的週五（weekday 4），找不到則取最後一天
friday = next((d for d in week_dates if d.weekday() == 4), week_dates[-1])
end_of_week = week_dates[-1]

# 搜尋 backend/reports/ 中檔名日期落在本週的 MD 檔
found_file = None
for f in sorted(glob.glob("backend/reports/Pgm_Weekly_Report_*.md")):
    m = re.search(r'(\d{6})\.md$', f)
    if m:
        s = m.group(1)
        try:
            fdate = datetime.date(2000 + int(s[:2]), int(s[2:4]), int(s[4:6]))
            if fdate in week_dates:
                found_file = f
                break
        except ValueError:
            pass

if found_file:
    print(f"FOUND:{found_file}")
else:
    suggested = f"Pgm_Weekly_Report_{friday.strftime('%y%m%d')}.md"
    print(f"MISSING:{monday.strftime('%Y/%m/%d')}-{end_of_week.strftime('%Y/%m/%d')}:{suggested}")
PYEOF
)

REPORT_STATUS="${WEEK_DATE_INFO%%:*}"

# 找不到 → 硬停，給出明確的補救說明
if [[ "${REPORT_STATUS}" == "MISSING" || "${REPORT_STATUS}" == "ERROR" ]]; then
  MISSING_INFO="${WEEK_DATE_INFO#*:}"
  MISSING_DATES="${MISSING_INFO%%:*}"
  SUGGESTED_NAME="${MISSING_INFO##*:}"
  echo ""
  echo -e "${RED}❌ 找不到 ${WEEK} 的 MD 週報！${RESET}"
  echo ""
  echo -e "   週次範圍：${MISSING_DATES}"
  echo -e "   預期檔名：${CYAN}backend/reports/${SUGGESTED_NAME}${RESET}"
  echo ""
  echo "   請先完成以下任一步驟，再重新執行 release-week.sh："
  echo "     手動建立：vim backend/reports/${SUGGESTED_NAME}"
  echo "     AI 輔助  ：python scripts/gen-report.py ${WEEK}  （尚未實作）"
  echo ""
  echo "   ⚠ JSON 資料與 MD 週報必須在同一個 commit 中發布。"
  exit 1
fi

# 找到 → 確認是否需要加入 commit
WEEK_REPORT_PATH="${WEEK_DATE_INFO#*:}"
REPORT_GIT_STATUS=$(git status --porcelain "${WEEK_REPORT_PATH}" 2>/dev/null | cut -c1-2 | tr -d ' ')

if [[ -z "${REPORT_GIT_STATUS}" ]]; then
  info "本週週報：${WEEK_REPORT_PATH}（已提交，無變動）"
  HAS_REPORT=false
else
  info "本週週報：${WEEK_REPORT_PATH}（新增/修改，將納入 commit）"
  HAS_REPORT=true
fi
echo ""

# ── 3. 確認 JSON 是否已在 git（新檔 or 已修改） ──────────────────────────────
JSON_GIT_STATUS=$(git status --porcelain "${JSON_PATH}" 2>/dev/null | cut -c1-2 | tr -d ' ')

FILES_TO_ADD=()

if [[ -z "${JSON_GIT_STATUS}" ]]; then
  info "${JSON_PATH} 已是最新版本（無變動），跳過。"
elif [[ "${JSON_GIT_STATUS}" == "??" || "${JSON_GIT_STATUS}" == "M" || "${JSON_GIT_STATUS}" == "A" ]]; then
  FILES_TO_ADD+=("${JSON_PATH}")
fi

if [[ "${HAS_REPORT}" == true ]]; then
  FILES_TO_ADD+=("${WEEK_REPORT_PATH}")
fi

# ── 4. 如果沒有任何需要提交的檔案 ────────────────────────────────────────────
if [[ ${#FILES_TO_ADD[@]} -eq 0 ]]; then
  success "沒有需要提交的新檔案，${WEEK} 已是最新狀態。"
  echo ""
  echo "若需強制重新提交，請手動執行："
  echo "  git add ${JSON_PATH}"
  echo "  git commit --allow-empty -m 'data: re-release ${WEEK}'"
  exit 0
fi

# ── 5. 顯示提交預覽 ────────────────────────────────────────────────────────────
echo -e "${BOLD}以下檔案將被提交：${RESET}"
for f in "${FILES_TO_ADD[@]}"; do
  echo "   + ${f}"
done
echo ""

COMMIT_MSG="data: release ${WEEK} weekly report and data"

echo -e "${BOLD}Commit 訊息：${RESET}${COMMIT_MSG}"
echo ""

# ── 6. 確認 ───────────────────────────────────────────────────────────────────
if [[ "${AUTO_YES}" == "true" ]]; then
  info "（--yes 自動確認）"
  CONFIRM="y"
else
  read -r -p "$(echo -e "${BOLD}確認提交並 push 到 origin/main？[y/N] ${RESET}")" CONFIRM
  echo ""
fi

if [[ "${CONFIRM}" != "y" && "${CONFIRM}" != "Y" ]]; then
  warn "已取消。檔案未做任何修改。"
  exit 0
fi

# ── 7. git add ────────────────────────────────────────────────────────────────
info "執行 git add..."
git add "${FILES_TO_ADD[@]}"

# ── 8. git commit ─────────────────────────────────────────────────────────────
info "執行 git commit..."
git commit -m "${COMMIT_MSG}"

# ── 9. git push ───────────────────────────────────────────────────────────────
info "執行 git push origin main..."
git push origin main

echo ""
success "完成！${WEEK} 週報已發布，Railway 將在約 1–2 分鐘後自動部署。"
echo ""
echo "     週次資料：https://pgm-weekly-report-production.up.railway.app/api/weeks/${WEEK}"
echo "     歷史週報：https://pgm-weekly-report-production.up.railway.app（Dashboard → 歷史週報中心）"
echo ""
