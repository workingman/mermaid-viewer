# QA State — mmv (Mermaid Viewer)

## Tech Stack (derived from TDD)
- Build command(s): `pnpm tauri dev` (dev), `pnpm tauri build` (release)
- Dev server: `pnpm dev` (Vite on localhost:1420)
- Test command: `pnpm vitest run` (frontend), `cargo test` (Rust backend)
- Compilers/bundlers: Rust/cargo (backend), Vite/TypeScript (frontend), PostCSS (CSS)
- Linter(s): ESLint + Prettier

## Current Position
Layer: RENDER
Step: verifying
Cycle: 1

## Layer Status
| Layer    | Status  | Issues Filed                 | Issues Open | Notes                              |
|----------|---------|------------------------------|-------------|------------------------------------|
| BUILD    | PASS    | #143, #144, #145, #146, #147 |             | All 5 fixed and verified clean     |
| BOOT     | PASS    |                              |             | Window appeared, no errors         |
| RENDER   | ACTIVE  | #148                         |             | F-007 fixed, needs manual verify   |
| FUNCTION | PENDING |                              |             |                                    |
| POLISH   | PENDING |                              |             |                                    |

## Layer Summaries (wisdom — persists across context boundaries)

### BUILD
6 findings across 3 domains: 1 blocking TS error (MermaidConfig API mismatch, #143),
3 substantive Rust warnings (FileWatcher entirely unwired #144, WindowState/WindowManager
partial dead code #145), 1 substantive CSS warning (@import ordering #146), 1 cosmetic
bundle warning (chunk size #147). ESLint clean. Root pattern: agents implemented modules
but didn't always complete the wiring step — FileWatcher is the clearest example. CSS
issue is a spec violation (imports must precede rules) caused by late-stage file appends.

### BOOT
Zero findings. Vite dev server started in 145ms, Rust compiled with zero warnings,
binary launched without panics or errors. Human confirmed window appeared.
Clean pass on first attempt — no issues filed.

### RENDER

### FUNCTION

### POLISH

## Active Context
RENDER layer — issue #148, 4 fixes applied but SVG output is invisible.

Fixes applied:
1. `89c9ff8` — Race condition: pull-based `get_initial_file`
2. `d5813a2` — SVG parser: `image/svg+xml` → `text/html`
3. `6cce43b` — Crash fix + capabilities
4. (uncommitted) — WebviewUrl::App("index.html".into())

Pipeline status: runs to completion, SVG lands in DOM at
`<svg viewBox="-28 -28 80 460">` (800x4600px computed) but INVISIBLE.
Root cause: compositor/parser produces SVG with no visible content.

Next: follow debug plan in `agent-memory/render-debug-plan.md`.
Dev mode hack in `main.ts` loads test file in main window.
Must bisect pipeline: parse → layout → compose to find bad stage.

## Human Feedback Log
- BOOT: "Did a window appear?" → Yes
- RENDER: "Window opened but it's blank, no diagram rendered"
