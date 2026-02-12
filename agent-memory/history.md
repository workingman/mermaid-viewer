# Historical Context (moved from MEMORY.md to keep it lean)

## Execution History
- 8 parents (#1-#8), 40 sub-issues (#103-#142). Old sub-issues #9-#102 closed "not planned".
- ALL 8 PARENTS COMPLETE. All 48 implementation issues closed.
- ~40 commits on main. 185 frontend tests (28 files), 19 Rust tests, lint clean.
- Execution ran autonomously overnight: P2/P3/P6 parallel, then P4→P5→P7→P8.
- Dependency order: #1 Scaffolding → #2 Backend, #3 Parsing, #6 Viewport (parallel) → #4 ELK → #5 Sidecar → #7 Editing → #8 E2E Wiring.

## Context Management Lessons
- Quality solid through ~12 issues, degraded at ~17, collapsed after ~20
- Fix: 1 subagent per parent, max 5 sub-issues per invocation, self-validation
- Rules codified in process/create-issues.md § Context Management

## Process Observations (for playbook)
- GitHub dependency API unavailable on our plan — text-based deps as fallback
- Anchoring on caps: "max 5" became a target. Fix: two-phase + "no cap" language
- Two-phase (plan then execute) validated: right-sized counts (3-7 per parent)
- Parallel agent git contamination: agents staging each other's files.
  Fix: explicit file paths in git add, never `git add .`
- Self-validation checklists work (all 8 passed)
- Issue number gaps from parallel creation are cosmetic

## Agent Execution Setup
- run.sh pattern in ~/.claude/CLAUDE.md (global)
- PreToolUse hook enforces run.sh: .claude/hooks/enforce-run-sh.sh (global settings)
- SubagentStop hook for observability (global settings)
- settings.local.json has project-specific permissions only (committed to git)
- 6 agent rules in .claude/CLAUDE.md: analyze before writing, checkpoints,
  test what you touch, stay in lane, commit refs issue, read standards
