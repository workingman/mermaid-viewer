# Development Process

Reusable prompt templates for AI-assisted software development.

## Pipeline

```
create-prd.md  →  create-tdd.md  →  create-issues.md  →  execute-issues.md  →  first-run-qa.md
     |                  |                   |                      |                    |
  WHAT to build      HOW to build       WHO does what      IMPLEMENT code      VERIFY quality
  (problem, FRs,     (stack, schemas,   (GitHub Issues     (spawn agents,      (BUILD→BOOT→
   acceptance         contracts, dir     w/ exit criteria   parallel exec,      RENDER→FUNCTION
   criteria)          structure)         & checkpoints)     commit & close)     →POLISH)
```

## Artifacts

| Template | Purpose |
|---|---|
| `create-prd.md` | Generate a Product Requirements Document from a raw idea |
| `create-tdd.md` | Generate a Technical Design Document from a PRD |
| `create-issues.md` | Decompose a PRD + TDD into self-contained GitHub Issues |
| `execute-issues.md` | Orchestrate AI agents to implement issues in parallel with efficiency and correctness |
| `first-run-qa.md` | Structured QA process from "implemented" to "works correctly" |

## Quality Assurance

After implementation, use `first-run-qa.md` to systematically verify the project through five layers: BUILD → BOOT → RENDER → FUNCTION → POLISH.

### Starting a QA Session

**To start or resume QA work, use the skill:**

```
/qa-continue
```

This automatically:
1. Reads `process/first-run-qa.md` (the QA process definition)
2. Recovers state from `qa-state.md` and `qa-findings.md`
3. Checks open QA issues
4. Resumes from the recorded position

**State files:**
- `qa-state.md` — current layer, step, cycle, and wisdom summaries
- `qa-findings.md` — append-only log of all findings

### QA Pyramid

```
     POLISH     — Edge cases, perf, UX quality (human-primary)
    FUNCTION    — Features work correctly (automated + manual)
   RENDER       — UI/output appears correctly (human-primary)
  BOOT          — App starts and stays running (agent + 1 confirmation)
 BUILD          — Compiles, bundles, lints cleanly (fully agentic)
```

Each layer gates the next. The process is stateful and survives context depletion.

## Standards

- `docs/standards/general.md` — language-agnostic coding standards (always loaded)
- Language-specific addenda live as Claude Code skills (`.claude/skills/`)
  so they are progressively disclosed when the language is in use

## Greenfield vs. Brownfield

### Greenfield (new project)
The pipeline runs start-to-finish:
1. Write the PRD (problem definition, requirements, acceptance criteria)
2. Write the TDD (all technical decisions, architecture, data models)
3. Generate issues (self-contained tasks agents can execute uninterrupted)
4. Execute issues (spawn agents with optimized context, parallel when possible)
5. Verify quality (systematic QA through BUILD→BOOT→RENDER→FUNCTION→POLISH)

### Brownfield (existing codebase)
The pipeline is the same, but Step 2 changes significantly:
- **Codebase assessment is mandatory.** The TDD must document existing
  architecture, conventions, patterns, and module boundaries before
  proposing changes.
- **The TDD "works with" rather than "replaces."** New components must
  integrate with existing patterns unless there's an explicit decision
  to refactor (which becomes its own issue).
- **Standards may already exist.** If the project has established conventions
  (linting config, test patterns, directory structure), the TDD references
  those rather than imposing new ones.
- **Issue scope is constrained.** "Files to Modify" in each issue is
  critical — agents need to know exactly where existing code lives and
  what patterns to follow.
- **Risk is higher.** Brownfield issues must include regression criteria:
  "All existing tests continue to pass."

The prompt templates handle this via the "Assess the Codebase" step in
create-tdd.md and the "Assess Current State" step in create-issues.md.
Both instruct the agent to read the codebase first. For greenfield projects,
those steps simply find nothing and move on.

## TODO: Playbook

Write a comprehensive playbook document that covers:
- Step-by-step walkthrough of bootstrapping a new project with this process
- How to adapt for brownfield projects
- When human input is needed vs. when agents run autonomously
- How to tune task scope (agent time per issue: default max 1 hour)
- How to set up standards and skills for a new project
- Lessons learned and anti-patterns discovered during use
- How the process scales to multi-person, multi-component systems
