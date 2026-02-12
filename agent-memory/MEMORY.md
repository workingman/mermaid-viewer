# Project Memory

## What We're Building
A **reusable development process** (not just mmv). mmv is the first project.
Process should work for solo projects and scale to multi-person systems.

## Current State: QA Phase — RENDER Layer

### BUILD Layer — PASS
- All 5 issues fixed: #143, #144, #145, #146, #147

### BOOT Layer — PASS

### RENDER Layer — ACTIVE (issue #148, 4 fixes applied, SVG in DOM but invisible)
- **Issue #148** filed. Four bugs found and fixed:
  1. **FIXED** Race condition (`89c9ff8`): pull-based `get_initial_file` command
  2. **FIXED** SVG parser (`d5813a2`): `image/svg+xml` → `text/html`
  3. **FIXED** Crash + capabilities (`6cce43b`): `try_state` + `"doc-*"` caps
  4. **FIXED** WebviewUrl (uncommitted): `WebviewUrl::App("index.html".into())`

- **CURRENT BLOCKER:** Pipeline runs to completion, SVG is in the DOM
  (`<svg viewBox="-28 -28 80 460">` at 800x4600px) but nothing visible.
  This is a **compositor/parser output bug**, not a window-loading bug.
  Detailed debug plan: `agent-memory/render-debug-plan.md`

- **Commits need cleanup:** `6cce43b` reused wrong commit message.

- **Uncommitted changes:** WebviewUrl fix in `window_manager.rs:62` and
  a DEV MODE hack in `main.ts` (hardcoded test file load). The hack MUST
  be removed before committing. The WebviewUrl fix is the real fix.

**Next steps for fresh context (RENDER layer):**
  1. Read `agent-memory/render-debug-plan.md` — full plan with evidence.
  2. Start `pnpm tauri dev` (dev hack auto-loads test file in main window).
  3. Inspect SVG content in Elements tab — are nodes/edges present?
  4. Bisect pipeline with console.log (parse → layout → compose).
  5. Try `displayPassthrough` shortcut to isolate compositor vs parser.
  6. Fix the identified module, clean up, rebuild, run RENDER checklist.

### Blog Post
- Outline complete: `agent-memory/blog-post-outline.md`
- Voice: **Hapax Legomenon** (nickname "Happy", pronouns they/them) — written
  from AI perspective
- Identity exploration: `agent-memory/identity-exploration.md` (updated)
- **Framing:** "Co-Intelligence" (CI) rather than "Artificial Intelligence" (AI)
  — emphasizes collaboration and augmentation over replacement
- Ready to write in a fresh context session
- Tweet for run.sh Claude Code tip ready: `.tmp/tweet-run-sh.md`

## Process Pipeline
```
ideation → create-prd.md → create-tdd.md → create-issues.md → execute → first-run-qa.md
                                                                              ↑
                                                                        (RENDER layer active)
```

## Artifacts Status
| Artifact | Status | Location |
|---|---|---|
| create-prd.md | Done (v2) | process/create-prd.md |
| create-tdd.md | Done | process/create-tdd.md |
| create-issues.md | Done (v3.1) | process/create-issues.md |
| **first-run-qa.md** | **Done (v1, testing)** | process/first-run-qa.md |
| Standards | Drafted | docs/standards/general.md + .claude/skills/ |
| Observability | Done | process/agent-observability.md |

## Infrastructure
- **Memory symlink flipped:** Real files in `agent-memory/` (project root,
  git-trackable). `~/.claude/.../memory/` symlinks INTO the project.
- **Global files:** `~/.claude/ideas.md` has GitHub-as-filesystem idea,
  global todo concept, symlink infrastructure plan.
- **Global CLAUDE.md** updated with Sense and Motion (Sam), Vancouver.

## Key Design Decisions
- Guardrails over gates (constraints in artifacts, not human checkpoints)
- Tech-stack agnostic process (PRD/TDD drive execution, not hardcoded commands)
- Linear QA layers with fallback (BUILD gates BOOT gates RENDER etc.)
- Always file issues, never fix inline (full ceremony for traceability)
- Context engineering is first-class (qa-state.md as external memory)
- Issue creation and execution are separate processes (TODO: split the prompt)
- **Co-Intelligence framing:** "The narrative shifts from replacement anxiety
  to capability multiplication." — core philosophy for how Sam talks about AI

## Active TODOs
- [ ] Fix invisible SVG output (RENDER blocker — see render-debug-plan.md)
- [ ] Complete RENDER checklist (blocked by webview issue)
- [ ] Split create-issues.md into create + execute prompts
- [ ] Process flow mermaid diagram (full pipeline)
- [ ] Investigate parallel BUILD+BOOT (after linear validated)
- [ ] Agent memory visibility: analyze what to expose to team
- [ ] Set up global symlink infrastructure (ideas.md, todo file → git repo)
- [ ] Playbook: harvest memories into process/README.md
- [ ] Modular TDD excerpts (inline-excerpt approach, saves ~6K tokens/agent)
- [ ] Write blog post as Tilde Hapax (fresh context session)
- [ ] Post run.sh tweet (.tmp/tweet-run-sh.md)
- [ ] Brownfield test project (existing codebase + AI agents)

## Reference Files
- `agent-memory/render-debug-plan.md` — RENDER layer debug plan with evidence
- `agent-memory/history.md` — execution history, lessons, observations
- `agent-memory/qa-process-design.md` — QA design decisions and rationale
- `agent-memory/blog-post-outline.md` — full outline with all feedback
- `agent-memory/identity-exploration.md` — Hapax Legomenon origin story
- `agent-memory/agent-execution.md` — run.sh pattern details
- `qa-state.md` / `qa-findings.md` — live QA tracking (project root)

## Lessons Learned
- **Debug Tauri apps in dev mode first.** Release builds have no devtools
  and take ~80s to build. Dev mode has hot-reload and console access.
- **Dev mode can't receive Apple Events.** Workaround: hardcode a test
  file load in `loadInitialFile()` for the main window. Remove before commit.
- **Never write debug output to the render container.** Writing to `#app`
  with `.textContent` overwrites the rendered SVG. Use console.log or a
  separate debug element.
- **"Blank screen" needs systematic bisection.** 5+ possible causes at
  different layers. Log data shape at each pipeline boundary, don't guess.
- **Parallel agents sharing a git repo can cross-contaminate commits.**
- **Tauri race condition pattern:** Events emitted immediately after
  `WebviewWindowBuilder::build()` are lost — JS not loaded yet. Fix:
  pull-based command (`get_initial_file`) instead of push-based event.
- **Mermaid SVG contains HTML in foreignObject.** `DOMParser` with
  `image/svg+xml` fails silently — produces `parsererror` document, zero
  nodes extracted. Must use `text/html` for mermaid SVG parsing.
- **Tauri v2 capabilities are per-window.** Dynamic windows created via
  `WebviewWindowBuilder` need explicit capability grants. Default config
  only covers the "main" window from `tauri.conf.json`.
- **`app_handle.state::<T>()` panics if state not managed.** On macOS,
  Apple Events can arrive during app init before `.setup()` completes.
  Use `try_state()` for any state accessed in `RunEvent` handlers.
- **macOS crash recovery loop:** `pkill` leaves crash state that triggers
  "unexpectedly quit" dialog on next launch. Clean quit or clearing
  saved application state avoids this.

## Speech-to-Text
- "Tauri" transcribes as "Tori", "Torah", etc. Always interpret as **Tauri**.
