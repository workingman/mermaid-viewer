# QA Findings — mmv (Mermaid Viewer)

Append-only log of all findings discovered during QA.

### F-001: TypeScript build fails — `suppressErrors` not in MermaidConfig
- **Layer:** BUILD
- **Severity:** blocking
- **Domain:** frontend/ts
- **Observed:** `tsc` errors with TS2353: `suppressErrors` does not exist in type `MermaidConfig` at `src/mermaid-parser/mermaid-parser.ts:17`
- **Expected:** TypeScript compilation succeeds with zero errors
- **Root cause:** Mermaid.js API changed — `suppressErrors` config option was removed or renamed in the installed version
- **Cluster:** C-001
- **Issue:** #143
- **Status:** verified

### F-002: Rust FileWatcher module entirely dead code (12 warnings)
- **Layer:** BUILD
- **Severity:** substantive
- **Domain:** backend/rust
- **Observed:** 12 dead_code warnings in `src/watchers/file_watcher.rs` — struct FileWatcher, FileChangedPayload, and all functions (detect_kind, create_watcher, build_raw_watcher, handle_event, is_write_locked, unlock_path, should_emit, emit_change) plus methods (watch, unwatch) are never used
- **Expected:** FileWatcher module is registered in the Tauri app and actively monitors files per FR-004
- **Root cause:** FileWatcher module was implemented but never wired into the application entry point (lib.rs or main.rs)
- **Cluster:** C-002
- **Issue:** #144
- **Status:** verified

### F-003: Rust WindowState struct never constructed
- **Layer:** BUILD
- **Severity:** substantive
- **Domain:** backend/rust
- **Observed:** 2 dead_code warnings in `src/windows/mod.rs` — WindowState struct and `new` associated function unused
- **Expected:** WindowState used to track per-window file associations
- **Root cause:** Type was defined but never instantiated — window-file mapping may not be functioning
- **Cluster:** C-003
- **Issue:** #145
- **Status:** verified

### F-004: Rust WindowManager has unused methods and helper functions
- **Layer:** BUILD
- **Severity:** substantive
- **Domain:** backend/rust
- **Observed:** 3 dead_code warnings in `src/windows/window_manager.rs` — methods `remove`, `window_count` and functions `size_from_dimensions`, `fallback_size` unused
- **Expected:** WindowManager API fully integrated
- **Root cause:** Helper methods defined but not called — may indicate incomplete window lifecycle management
- **Cluster:** C-003
- **Issue:** #145
- **Status:** verified

### F-005: CSS @import statements after rules in main.css
- **Layer:** BUILD
- **Severity:** substantive
- **Domain:** frontend/css
- **Observed:** 2 PostCSS warnings: `@import './error-banner.css'` and `@import './edit-mode.css'` appear at lines 34-35, after CSS rule declarations (lines 1-32)
- **Expected:** All @import statements precede other CSS rules per CSS spec
- **Root cause:** Imports were appended to the file instead of prepended — likely by an agent that added error-banner and edit-mode styles after the initial CSS was written
- **Cluster:** C-004
- **Issue:** #146
- **Status:** verified

### F-007: Diagram does not render — blank window on file open
- **Layer:** RENDER
- **Severity:** blocking
- **Domain:** backend/rust, frontend/ts
- **Observed:** Opening a .mmd file with the built app (`open -a mmv.app file.mmd`) shows a blank window. No diagram renders. Window title may show default "Mermaid Viewer" rather than the filename.
- **Expected:** Diagram renders in the window when a .mmd file is opened (FR-002)
- **Root cause:** Race condition — `emit_opened()` in window_manager.rs fires the "window-file-opened" event immediately after `WebviewWindowBuilder::build()`, before the webview's JavaScript has loaded and registered its `listen('window-file-opened')` handler in main.ts. The event is lost.
- **Cluster:** C-006
- **Issue:** #148
- **Status:** verified (fixed via commits 89c9ff8, d5813a2, 6cce43b + WebviewUrl uncommitted)

### F-006: Vite bundle chunk size warning
- **Layer:** BUILD
- **Severity:** cosmetic
- **Domain:** frontend/bundle
- **Observed:** Some chunks > 500kB after minification (index: 1.9MB, cytoscape: 442kB). Vite suggests code-splitting.
- **Expected:** No warning, or chunks within the 500kB default limit
- **Root cause:** Mermaid.js and its transitive dependencies (katex, cytoscape, d3) are large. Expected for a desktop app — no user-facing performance impact.
- **Cluster:** C-005
- **Issue:** #147
- **Status:** verified

### F-008: DOMParser with image/svg+xml fails on mermaid SVG
- **Layer:** RENDER
- **Severity:** blocking
- **Domain:** frontend/ts
- **Observed:** `DOMParser.parseFromString(svg, 'image/svg+xml')` produces a parsererror document. Zero `.node` and `.edgePath` elements extracted. SVG compositor produces empty node-layer and edge-layer groups.
- **Expected:** Parser extracts nodes and edges from mermaid SVG
- **Root cause:** Mermaid renders HTML labels (`<br>`, `<p>`) inside `<foreignObject>`. These are valid HTML but invalid XML. The XML parser chokes at column 31033.
- **Cluster:** C-006
- **Issue:** #148
- **Status:** fixed (commit d5813a2, changed to `text/html` parsing)

### F-009: Dynamic window webview does not load frontend
- **Layer:** RENDER
- **Severity:** blocking
- **Domain:** backend/rust, config
- **Observed:** Windows created dynamically via `WebviewWindowBuilder` (label "doc-0" etc) show blank page with "Reload" button. No right-click context menu. Default "main" window loads fine.
- **Expected:** Dynamic windows load the same frontend as the default window
- **Root cause:** WebviewUrl::default() does not inherit from tauri.conf.json. Dynamic windows need explicit WebviewUrl::App("index.html".into())
- **Cluster:** C-006
- **Issue:** #148
- **Status:** verified (fixed via WebviewUrl change in window_manager.rs, uncommitted)

### F-010: App crashes on direct `open -a mmv.app file.mmd` launch
- **Layer:** RENDER
- **Severity:** blocking
- **Domain:** backend/rust
- **Observed:** `open -a mmv.app file.mmd` crashes with SIGABRT. Crash in `tao::application_open_urls`. macOS crash recovery dialog appears.
- **Expected:** App launches and opens the file
- **Root cause:** `watch_file_pair` calls `app_handle.state::<FileWatcherState>()` which panics if FileWatcher not yet managed. macOS delivers Apple Events during app init before `.setup()` completes.
- **Cluster:** C-006
- **Issue:** #148
- **Status:** fixed (commit 6cce43b, changed to `try_state`)

### F-011: Node labels are truncated or cut off
- **Layer:** RENDER
- **Severity:** substantive
- **Domain:** frontend/ts
- **Observed:** Some node labels are partially cut off or truncated in the rendered diagram. Diamond nodes at the bottom of the flowchart particularly affected. Text appears to overflow the node bounds.
- **Expected:** All node labels should be fully visible within their containing shapes (per FR-002: "Display the diagram in Viewing Mode")
- **Root cause:** getBBox() returning incorrect bounds for text elements, insufficient padding in viewBox calculation, or fragment extraction not capturing full text bounds
- **Cluster:** C-007
- **Issue:** #150
- **Status:** open
