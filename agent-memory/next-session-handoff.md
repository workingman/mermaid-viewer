# Next Session Handoff: Update create-issues.md + Right-Sizing

## What Happened This Session

### Sub-Issue Regeneration (DONE)
- Regenerated all sub-issues for parents #1-#8 using v3 template
- Batch 1 (#1-#4) and Batch 2 (#5-#8) all completed successfully
- All 8 agents passed self-validation checklists
- **39 sub-issues created** (issues #64-#102), all open and linked to parents
- Only parent #6 came in under 5 sub-issues (got 4). All others hit exactly 5.

### Problem Identified: Agents Anchor on Max 5
- 7 of 8 parents produced exactly 5 sub-issues
- The "maximum 5 per invocation" rule was treated as a TARGET, not a ceiling
- Some parents likely need fewer (padding) and some might need more (compression)
- Root cause: scoping and execution happen in the same step

### New Artifacts Created (DONE)
1. **`.claude/skills/gh-issue-create/SKILL.md`** — body-file pattern for gh issue create (avoids heredoc quoting issues)
2. **`process/create-issues.md`** — updated CLI examples to use body-file instead of heredoc
3. **`.claude/hooks/log-subagent-stats.sh`** — SubagentStop hook that logs agent token usage, tool uses, duration to `.agent-stats.jsonl`
4. **`process/agent-observability.md`** — docs for the observability system
5. **`.claude/settings.local.json`** — registered SubagentStop hook
6. **`.gitignore`** — added `.agent-stats.jsonl`

### NOT YET DONE: Update create-issues.md with right-sizing + two-phase approach

This is the urgent next step. The file needs these changes:

#### 1. New "Right-Sizing" section
Define sizing in terms of **context window**, not human hours. Heuristics:
- **Conceptual coherence** — one responsibility per issue
- **Bounded file surface** — agent shouldn't need to read/modify too many files
- **Clear interfaces** — inputs and outputs defined so agent stays on rails
- **2-5 checkpoints of roughly even weight** — no single checkpoint > 40% of work
- **Testable in isolation** — 2-8 tests without needing full system
- **Do NOT pad to any cap** — create only as many issues as scope requires

#### 2. Two-phase process for sub-issue generation
- **Phase 2a (Plan):** For each parent, determine the right number of sub-issues. Output a numbered list of titles + one-line summaries. No cap. This is lightweight.
- **Phase 2b (Execute):** Take the planned list, chunk into batches of max 5, spawn one agent per batch to create and link the issues. Second agent gets already-created issue numbers.

#### 3. Update "Granularity Guidance" section
Replace "Takes a developer 1-4 hours" with context-oriented heuristics. The target is: **one agent context window per issue**. Checkpoints are the safety net when the estimate is wrong.

#### 4. Update Context Management Rule 2
Clarify that max 5 is an **execution cap** (context management during creation), not a **scoping target**. Add explicit language: "Create only as many sub-issues as the scope requires — typically 2-5. Do not pad to reach 5. If the scope is fully covered in 3 issues, stop at 3."

#### 5. Separate invocation templates
- **Planning template** — reads PRD/TDD/parent, outputs a numbered list of right-sized sub-issues (no creation, no cap)
- **Execution template** — takes the planned list, creates up to 5, links them, runs self-validation

#### 6. Add AGENT_META to invocation templates
For observability. Convention: include `AGENT_META: {"type": "issue-creation", "parent": 5}` in every Task prompt. The SubagentStop hook extracts this automatically.

### Decision Pending: Delete and Recreate Sub-Issues?
Geoff raised whether the current 39 sub-issues should be deleted and recreated with proper right-sizing. Deferred until after the template is updated. Recommendation: audit 2-3 parents first (e.g., #5 smallest scope, #2 largest scope) to see how bad the padding/compression actually is, then decide.

## File Locations
- `process/create-issues.md` — the file to update (read it fully before editing)
- `process/agent-observability.md` — new observability docs
- `.claude/hooks/log-subagent-stats.sh` — new SubagentStop hook
- `.claude/skills/gh-issue-create/SKILL.md` — new body-file skill

## Key Design Principles (from conversation)
- **Right-sizing + checkpoints are complementary**: right-sizing is optimistic planning, checkpoints are graceful degradation
- **Token budget is the real constraint**, not human hours
- **Observability** (SubagentStop hook) lets us calibrate sizing over time
- **"Guardrails over gates"** — don't stop agents, give them structural constraints
