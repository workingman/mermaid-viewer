#!/bin/bash
# PreToolUse hook for Bash: enforce the run.sh pattern.
#
# Decisions:
#   approve  — `bash run.sh ...` or single-line commands
#   deny     — anything multi-line (must use Write + run.sh)
#
# A no-op exit (exit 0 without JSON) means "no opinion" and still triggers
# Claude Code's normal permission prompt.  Every path here emits an explicit
# decision so nothing falls through.

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command')
NEWLINE_COUNT=$(echo "$COMMAND" | wc -l)

decide() {
  jq -n \
    --arg decision "$1" \
    --arg reason   "$2" \
    '{
      hookSpecificOutput: {
        hookEventName:            "PreToolUse",
        permissionDecision:       $decision,
        permissionDecisionReason: $reason
      }
    }'
}

if echo "$COMMAND" | grep -qE '^bash run\.sh '; then
  decide allow "Command uses run.sh dispatcher"
elif [ "$NEWLINE_COUNT" -le 1 ]; then
  decide allow "Single-line command"
else
  decide deny "BLOCKED: Multi-line Bash command detected. Write the script to .tmp/agent-<name>.sh using the Write tool, then run it with: bash run.sh .tmp/agent-<name>.sh"
fi
