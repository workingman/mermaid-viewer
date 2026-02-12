# RENDER Layer Debug Plan

## Status
- WebviewUrl fix landed (uncommitted): `WebviewUrl::App("index.html".into())`
- Dynamic windows now load the frontend and execute JS
- The render pipeline runs to completion without errors
- BUT the SVG in the DOM is invisible — compositor/parser bug

## Evidence (from dev mode inspection)
- SVG is in DOM: `<svg viewBox="-28 -28 80 460">` at 800x4600px
- Pipeline path: `loadInitialFile()` → `handleMmdChange()` → `parse()` →
  `renderPipeline()` → `executeRender()` → `displaySvg()` — all succeed
- The `flow-mermaid-viewer.mmd` file is a `graph TD` flowchart with ~20 nodes
- ViewBox `-28 -28 80 460` looks suspiciously small (80 units wide for a
  20-node graph)

## Current Code State
- `src/main.ts` has a DEV MODE hack: if label=main and no pending file,
  loads `/Users/sam/dev/mmv/docs/flow-mermaid-viewer.mmd`. MUST REMOVE before
  committing.
- `src-tauri/src/windows/window_manager.rs:62` changed from
  `WebviewUrl::default()` to `WebviewUrl::App("index.html".into())`. This is
  the real fix — keep this.
- Debug markers (eprintln, DOM text) have been removed.
- `index.html` and `main.ts` are clean except for the dev hack.

## Debugging Plan (Step by Step)

### 1. Start dev mode
```bash
pnpm tauri dev
```
Main window loads test file automatically (dev hack in place).

### 2. Inspect SVG in Elements tab
Expand the `<svg>` in `#app`. Check:
- Child elements: `<g>`, `<rect>`, `<text>`, `<path>`?
- Visible attributes: `fill`, `stroke`, `opacity`?
- ViewBox vs actual content bounds?

### 3. Console.log at pipeline boundaries
Add logging in `main.ts` (Vite hot-reloads, no rebuild needed):
```typescript
// In handleMmdChange, after parse():
console.log('[PIPE] parsed:', {
  diagramType: result.graph.diagramType,
  nodes: result.graph.nodes.length,
  edges: result.graph.edges.length,
  fragments: result.nodeSvgFragments.size,
  hasPassthrough: !!result.passthroughSvg,
});

// In executeRender, after isGraphDiagram check:
console.log('[PIPE] isGraph:', isGraphDiagram(graph.diagramType));

// In executeRender, after computeLayout:
console.log('[PIPE] layout:', layout);

// In executeRender, after compose:
console.log('[PIPE] svg:', svg.outerHTML.length, svg.getAttribute('viewBox'));
```

### 4. Bisect: try raw passthrough SVG
In browser console:
```javascript
document.getElementById('app').innerHTML = renderDeps.passthroughSvg
```
If passthrough shows the diagram → bug is in computeLayout or compose.
If passthrough is also blank → bug is in parse.

### 5. Fix the identified module

### 6. Clean up
- Remove dev hack from main.ts
- Rebuild: `pnpm tauri build`
- Test via: `open -a mmv.app flow-mermaid-viewer.mmd`
- Run full RENDER checklist

## Lessons Learned (for skill)

### Tauri v2 Dynamic Windows
- `WebviewWindowBuilder` does NOT inherit URL from `tauri.conf.json`.
  Must explicitly pass `WebviewUrl::App("index.html".into())`.
- `"doc-*"` glob pattern in capabilities IS valid Tauri v2 syntax.
- `core:default` permission covers custom `invoke_handler` commands.

### Debugging Tauri Apps
- **Always start in dev mode** — devtools, console, hot-reload. Never
  waste time with release-only builds for debugging.
- **Dev mode can't receive Apple Events** (no .app bundle). Workaround:
  add a temporary hardcoded file load in `loadInitialFile()` for the
  main window when no pending file exists.
- **Never write debug output to the render target** — use console.log
  or a separate debug element, not the same `#app` container that the
  renderer writes to.
- **Bisect the pipeline** with console.log at stage boundaries. Don't
  guess which stage is broken — log the data shape at each handoff.
- **Release builds take ~80s** and have no devtools. Dev mode has hot-
  reload for JS changes. Minimize release build cycles.

### Common Tauri v2 Pitfalls
- `WebviewUrl::default()` = no content URL. Only works for the main
  window (which gets URL from tauri.conf.json).
- `app_handle.state::<T>()` panics if state not managed. Use
  `try_state()` in `RunEvent` handlers (Apple Events arrive early).
- Events emitted right after `WebviewWindowBuilder::build()` are lost —
  JS hasn't loaded yet. Use pull-based commands instead.
- Mermaid SVG contains HTML in `<foreignObject>`. DOMParser with
  `image/svg+xml` fails — must use `text/html`.
