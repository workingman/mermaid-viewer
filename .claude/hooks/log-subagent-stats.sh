#!/bin/bash
# SubagentStop hook: logs agent completion stats to .agent-stats.jsonl
#
# Fires automatically when any subagent finishes. Parses the agent's
# transcript for usage stats and extracts semantic metadata from the
# AGENT_META tag in the task prompt.
#
# Best-effort: never returns non-zero (would block the workflow).

INPUT=$(cat)

# -- Extract fields from hook input --
AGENT_ID=$(echo "$INPUT" | jq -r '.agent_id // "unknown"')
SUBAGENT_TYPE=$(echo "$INPUT" | jq -r '.agent_type // "unknown"')
TRANSCRIPT=$(echo "$INPUT" | jq -r '.agent_transcript_path // .transcript_path // ""')
CWD=$(echo "$INPUT" | jq -r '.cwd // "."')

LOG_FILE="$CWD/.agent-stats.jsonl"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# -- Parse transcript (best-effort) --
TOTAL_TOKENS=0
TOOL_USES=0
STARTED_AT=""
ENDED_AT=""
AGENT_META="{}"

if [ -n "$TRANSCRIPT" ] && [ -f "$TRANSCRIPT" ]; then
  # Timestamps from first/last entry
  STARTED_AT=$(head -1 "$TRANSCRIPT" | jq -r '.timestamp // ""' 2>/dev/null) || STARTED_AT=""
  ENDED_AT=$(tail -1 "$TRANSCRIPT" | jq -r '.timestamp // ""' 2>/dev/null) || ENDED_AT=""

  # Sum tokens from assistant messages (streaming, not slurp)
  TOTAL_TOKENS=$(jq 'select(.type=="assistant") | .message.usage |
    ((.input_tokens // 0) + (.output_tokens // 0) +
     (.cache_creation_input_tokens // 0) + (.cache_read_input_tokens // 0))' \
    "$TRANSCRIPT" 2>/dev/null | awk '{s+=$1} END {print s+0}') || TOTAL_TOKENS=0

  # Count tool_use content blocks
  TOOL_USES=$(grep -c '"type":"tool_use"' "$TRANSCRIPT" 2>/dev/null) || TOOL_USES=0

  # Extract AGENT_META JSON from the task prompt
  # Convention: orchestrator includes AGENT_META: {...} in the Task prompt
  AGENT_META=$(grep -m1 'AGENT_META:' "$TRANSCRIPT" 2>/dev/null |
    grep -o 'AGENT_META: *{[^}]*}' | sed 's/AGENT_META: *//') || AGENT_META="{}"
  [ -z "$AGENT_META" ] && AGENT_META="{}"
fi

# Validate AGENT_META is valid JSON, fall back to empty object
echo "$AGENT_META" | jq . >/dev/null 2>&1 || AGENT_META="{}"

# -- Write log entry --
jq -n \
  --arg ts "$TIMESTAMP" \
  --arg id "$AGENT_ID" \
  --arg subagent_type "$SUBAGENT_TYPE" \
  --argjson meta "$AGENT_META" \
  --argjson tokens "${TOTAL_TOKENS:-0}" \
  --argjson tools "${TOOL_USES:-0}" \
  --arg started "$STARTED_AT" \
  --arg ended "$ENDED_AT" \
  '{
    timestamp: $ts,
    agent_id: $id,
    subagent_type: $subagent_type,
    meta: $meta,
    total_tokens: $tokens,
    tool_uses: $tools,
    started_at: $started,
    ended_at: $ended
  }' >> "$LOG_FILE" 2>/dev/null

exit 0
