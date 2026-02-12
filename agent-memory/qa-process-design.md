# QA Process Design Notes

## Design Decisions (confirmed by Geoff)

1. **Tech-stack agnostic.** Process structure is generic. Tech stack is a
   parameter. PRD/TDD drive the execution steps — the prompt never hardcodes
   `cargo build` or `pnpm test`. Instead, it says "run the project's build
   command" and the agent derives specifics from the TDD.

2. **Linear layers (BUILD → BOOT → RENDER → FUNCTION → POLISH).** Conservative
   first: each layer must pass before inspecting the next. TODO: investigate
   overlapping BUILD+BOOT as a process improvement.

3. **Layer fallback.** If evidence at layer N indicates a layer N-2 issue,
   fall back. The orchestrator can enter at any layer and drop back to any
   earlier layer. State file tracks which layers are clean vs dirty.

4. **Always file issues.** No inline fixing, ever. Every fix goes through the
   full lifecycle: collect → triage → file GH issue → execute → verify. Even
   for trivial 1-issue layers. Documentation and traceability over speed.

5. **Context engineering is first-class.** The orchestrator must survive
   context depletion. External state files are the mechanism. A new session
   reads the state and picks up without losing critical context or carrying
   stale detail.

## Context Engineering Architecture

### The Problem
The orchestrator manages 5 layers, each with multiple steps. By Layer 4,
its context window is full of Layer 1-3 details that are no longer needed
but may contain occasionally-useful "wisdom."

### The Solution: qa-state.md as External Memory

The orchestrator writes a state file at each transition point. This file is:
- Small enough to read entirely at session start (~200-400 lines)
- The SOLE source of truth for "where are we"
- The recovery mechanism for context depletion

#### State File Structure
```markdown
# QA State — {project name}
## Tech Stack (derived from TDD)
- Build: {command}
- Compilers: {list}
- Test framework: {command}
- Dev server: {command}

## Current Position
Layer: RENDER
Step: collecting (awaiting human checklist)

## Layer Status
| Layer    | Status | Issues Filed | Issues Fixed | Notes            |
|----------|--------|-------------|-------------|------------------|
| BUILD    | PASS   | #201, #202  | #201, #202  | Clean after fix  |
| BOOT     | PASS   | (none)      | —           | Window confirmed |
| RENDER   | ACTIVE | —           | —           | Checklist sent   |
| FUNCTION | —      | —           | —           |                  |
| POLISH   | —      | —           | —           |                  |

## Layer Summaries (wisdom)
### BUILD
- Root cause cluster: 17 Rust warnings → 2 issues (unwired modules,
  unused WindowState). CSS @import ordering → 1 issue.
- Lesson: file_watcher and window_manager modules were implemented but
  never registered in lib.rs.

### BOOT
- Clean on first try after BUILD fixes.

## Active Context
- Human was sent render checklist (5 items from PRD §3.1)
- Waiting for human response
- Function checklist already prepared (8 items from PRD §3.2-3.5)

## Findings Log Reference
See qa-findings.md for full structured findings.
```

#### When to Write State
- After completing each step within a layer (collect, triage, file, verify)
- Before any potentially context-heavy operation (launching subagents)
- Whenever the orchestrator senses context is getting long

#### Context Recovery Protocol
If context depletes (or agent is manually restarted):
1. Read `qa-state.md` — know exactly where to resume
2. Read `qa-findings.md` — know what's been found and what's resolved
3. Read active layer's unfixed issues from GitHub — know current scope
4. Skip all prior-layer detail — it's summarized in state file
5. Continue from the recorded step

### What Gets Evicted vs Retained

**Retained in state file (always):**
- Current layer + step
- Layer status table
- Per-layer wisdom summaries (3-5 lines each)
- Active issue numbers
- Tech stack parameters

**Retained in findings log (available via grep):**
- Every finding with: layer, severity, description, resolution, issue #
- Human checklist responses
- Verification results

**Evicted (not stored anywhere — gone):**
- Raw build output (reproducible by re-running)
- Full triage reasoning
- Subagent fix outputs (results are in git commits)
- Intermediate drafts of issue bodies (final version is in GitHub)

### Fallback Mechanism
When a finding at layer N suggests a lower-layer issue:
1. Orchestrator updates state: layer N-K status → DIRTY
2. Orchestrator writes finding to qa-findings.md with `fallback: true`
3. Orchestrator drops to layer N-K, re-runs verification
4. If verification fails, enters that layer's collect→file→fix cycle
5. After layer N-K passes again, walks forward re-verifying each
   intermediate layer before returning to layer N

## Prompt Architecture

Single prompt: `first-run-qa.md` (tech-stack agnostic)

```
Inputs: PRD path, TDD path
Outputs: qa-state.md, qa-findings.md, GH issues

Layer Definitions (agnostic structure):
  BUILD:
    - What: compiler/bundler output
    - How: derived from TDD § architecture/tech-stack
    - Gate: zero warnings, zero errors
    - Human: none

  BOOT:
    - What: runtime startup behavior
    - How: launch via TDD's dev command, monitor process
    - Gate: process alive + human confirms window
    - Human: one Y/N confirmation

  RENDER:
    - What: visual correctness
    - How: checklist generated from PRD acceptance criteria
    - Gate: human confirms all checklist items
    - Human: fill checklist, optional screenshot

  FUNCTION:
    - What: feature correctness
    - How: automated tests (TDD § test strategy) + manual checklist (PRD)
    - Gate: tests pass + human confirms manual items
    - Human: manual testing

  POLISH:
    - What: edge cases, UX, performance
    - How: checklist from PRD non-functional requirements
    - Gate: human sign-off → v0.9
    - Human: extended use

State Management:
  - Write qa-state.md at every transition
  - Write qa-findings.md at every finding
  - Recovery protocol for context depletion

Issue Creation:
  - Template: observed vs expected, domain, repro, fix hints, deps
  - Grouping: by root cause cluster, not by individual symptom
  - Domain tags: same as execution issues (backend/rust, frontend/ts, etc.)
```

## Open Questions
- Should layer-specific checklists be generated once (at start) or
  just-in-time (before each layer)? JIT saves context but adds latency.
  Recommendation: JIT — don't generate FUNCTION checklist until RENDER passes.
- Screenshot capture automation (`screencapture` on macOS) — worth building
  into RENDER layer? Reduces human involvement. Platform-specific though.
  Maybe a tech-stack parameter: `screenshot_command: screencapture -l`.
