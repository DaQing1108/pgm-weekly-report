#!/bin/bash
# README update reminder hook
# Triggered by PostToolUse on Write|Edit tool calls
# Injects a reminder into Claude's context when program-sync .html or .js files are modified

FILE_PATH=$(jq -r '.tool_input.file_path // ""' 2>/dev/null)

# Check if file is in program-sync dir and is .html or .js
if echo "$FILE_PATH" | grep -qE 'program-sync/.*\.(html|js)$'; then
  printf '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"📝 README 更新提醒：你剛修改了 program-sync 的功能檔案（%s）。請確認此次異動是否影響功能說明，若有功能新增、修改或移除，請同步更新 program-sync/README.md。"}}\n' "$FILE_PATH"
fi
