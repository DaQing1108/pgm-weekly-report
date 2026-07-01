#!/usr/bin/env bash
# =============================================================================
# scripts/sync-skill.sh
# 同步 program-sync-report Skill 的三個副本，避免「改了源頭但沒生效」的問題：
#   1. program-sync-report-src/SKILL.md   ← 唯一應手動編輯的來源
#   2. program-sync-report.skill          ← 由 src 重新打包的 zip（進版控，供發布/分享）
#   3. ~/.claude/skills/program-sync-report/SKILL.md ← Claude Code 實際載入執行的版本
#
# 用法：
#   ./scripts/sync-skill.sh
# =============================================================================

set -eo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; RESET='\033[0m'
info()    { echo -e "${CYAN}ℹ ${RESET}$*"; }
success() { echo -e "${GREEN}✅ $*${RESET}"; }
error()   { echo -e "${RED}❌ $*${RESET}"; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}"

SRC="program-sync-report-src/SKILL.md"
PKG="program-sync-report.skill"
INSTALLED_DIR="${HOME}/.claude/skills/program-sync-report"
INSTALLED="${INSTALLED_DIR}/SKILL.md"

[[ -f "${SRC}" ]] || error "找不到來源檔：${SRC}"

# 1. 重新打包 zip
info "重新打包 ${PKG}..."
rm -f "${PKG}"
zip -r "${PKG}" program-sync-report-src/ -x '*.DS_Store' > /dev/null
success "已打包：${PKG}"

# 2. 安裝到 Claude Code 實際載入的 skills 目錄
if [[ -d "${INSTALLED_DIR}" ]]; then
  info "安裝至 ${INSTALLED}..."
  cp "${SRC}" "${INSTALLED}"
  success "已安裝最新版本"
else
  info "${INSTALLED_DIR} 不存在，跳過安裝（尚未在此機器安裝過此 Skill）"
fi

# 3. 驗證三份內容一致
PKG_CONTENT=$(unzip -p "${PKG}" "program-sync-report-src/SKILL.md" 2>/dev/null)
SRC_CONTENT=$(cat "${SRC}")

if [[ "${PKG_CONTENT}" != "${SRC_CONTENT}" ]]; then
  error "打包後內容仍與來源不一致，請檢查 zip 結構"
fi

if [[ -f "${INSTALLED}" ]]; then
  if ! cmp -s "${SRC}" "${INSTALLED}"; then
    error "已安裝版本與來源不一致"
  fi
fi

echo ""
success "三份副本已同步：src / .skill zip / 已安裝版本"
