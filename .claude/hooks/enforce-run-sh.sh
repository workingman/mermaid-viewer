#!/bin/bash
# PreToolUse hook for Bash: block multi-line commands that don't use run.sh.
# Multi-line ad hoc scripts must be written to .tmp/agent-*.sh via the Write
# tool and executed with `bash run.sh <script>`.

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command')

# Count newlines in the command
NEWLINE_COUNT=$(echo "$COMMAND" | wc -l)

# Allow single-line commands (no newlines)
if [ "$NEWLINE_COUNT" -le 1 ]; then
  exit 0
fi

# Allow if the entire command is just `bash run.sh ...`
if echo "$COMMAND" | grep -qE '^bash run\.sh '; then
  exit 0
fi

# Allow chained single-liners (&&, ||, ;) that don't contain heredocs
if ! echo "$COMMAND" | grep -qE '<<|<<-'; then
  # No heredocs — check if it's just command chaining on one logical line
  # that happens to have a newline from formatting
  # Be strict: if there are newlines, block it
  :
fi

# Block: multi-line command not using run.sh
jq -n '{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "BLOCKED: Multi-line Bash command detected. Write the script to .tmp/agent-<name>.sh using the Write tool, then run it with: bash run.sh .tmp/agent-<name>.sh"
  }
}'
exit 0
