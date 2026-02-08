# PRD: Mermaid Rendering and Layout Application

## 1. Introduction/Overview

This application is a macOS-native Mermaid rendering tool with optional web deployment. It is designed for a small internal technical team (2-5 engineers) and is not intended for public distribution.

The core purpose is to enable instant viewing of Mermaid (`.mmd`) files via Finder integration, while allowing precise visual layout control through a sidecar file, without polluting the Mermaid source with presentation concerns.

A key design goal is to keep Mermaid files semantically rich but context-efficient, making them suitable for use in LLM prompts, session continuation, and AI-driven updates. The tool should fully replace mermaid.live for all diagram viewing workflows.

---

## 2. Goals

1. Provide instant, native Finder-integrated viewing of `.mmd` files on macOS.
2. Support all valid Mermaid diagram types (flowcharts, sequence diagrams, state diagrams, class diagrams, etc.).
3. Separate layout/styling concerns from semantic diagram content via a sidecar file model.
4. Enable real-time re-rendering when `.mmd` or sidecar files change on disk.
5. Support visual layout editing (node repositioning) without altering Mermaid semantics.
6. Replace mermaid.live as the team's primary diagram viewing tool.

---

## 3. User Stories

- **US-1:** As a developer, I want to double-click a `.mmd` file in Finder and immediately see a rendered diagram, so that I can quickly understand diagram content without opening a browser or separate tool.

- **US-2:** As a developer, I want the diagram to re-render automatically when I (or an AI tool) modifies the `.mmd` file on disk, so that I get a live feedback loop during iterative diagram design.

- **US-3:** As a developer, I want to drag nodes to reposition them and see relationship arrows update in real time, so that I can create clearer visual layouts without editing code.

- **US-4:** As a developer, I want layout changes saved to a sidecar file (not the `.mmd` file itself), so that the Mermaid source stays lean and suitable as LLM context.

- **US-5:** As a developer, I want to open a `.mmd` file received from a third party and quickly understand its structure visually, so that I can grok unfamiliar diagrams without reading raw Mermaid syntax.

- **US-6:** As a developer, I want the app to gracefully handle Mermaid syntax errors by showing the last valid render with an error indicator, so that I am not blocked by transient errors during editing.

---

## 4. Functional Requirements

### FR-1: Finder File Association

The system must register as the default handler for `.mmd` files on macOS. Double-clicking a `.mmd` file in Finder must open the application and render the diagram.

**Acceptance Criteria:**
- [ ] Given a `.mmd` file in Finder, When the user double-clicks it, Then the app launches (or comes to foreground) and renders the diagram
- [ ] Given the app is already running with a file open, When the user double-clicks a different `.mmd` file, Then the new file is opened (in a new window or replacing the current view, TBD)
- [ ] The app appears in Finder's "Open With" menu for `.mmd` files

### FR-2: Mermaid Diagram Rendering

The system must render any valid Mermaid diagram using Mermaid.js. All standard diagram types must be supported.

**Acceptance Criteria:**
- [ ] Given a valid `.mmd` file containing a flowchart, When it is opened, Then the flowchart renders correctly
- [ ] Given a valid `.mmd` file containing a sequence diagram, When it is opened, Then the sequence diagram renders correctly
- [ ] Given a valid `.mmd` file containing a state diagram, When it is opened, Then the state diagram renders correctly
- [ ] Given a valid `.mmd` file containing a class diagram, When it is opened, Then the class diagram renders correctly
- [ ] Given a `.mmd` file using any other valid Mermaid diagram type, When it is opened, Then the diagram renders correctly
- [ ] Rendering completes within 1 second for diagrams with up to 50 nodes

### FR-3: Sidecar File Support (Layout Hints)

The system must read an optional JSON sidecar file that provides layout hints (node positions, styling metadata). When present, layout hints override Mermaid's auto-layout. When absent or partially applicable, the system falls back to Mermaid auto-layout for unhinted nodes.

**Acceptance Criteria:**
- [ ] Given a `.mmd` file with a corresponding sidecar JSON file, When the diagram renders, Then node positions match the sidecar hints
- [ ] Given a `.mmd` file with no sidecar file, When the diagram renders, Then Mermaid auto-layout is used
- [ ] Given a sidecar file that references node IDs not present in the `.mmd` file, When the diagram renders, Then orphaned hints are silently ignored
- [ ] Given a `.mmd` file with nodes not referenced in the sidecar, When the diagram renders, Then unhinted nodes use Mermaid auto-layout

### FR-4: Real-Time File Monitoring

The system must watch both the `.mmd` file and its sidecar file for changes on disk and re-render immediately when either changes.

**Acceptance Criteria:**
- [ ] Given the app is displaying a diagram, When the `.mmd` file is modified externally, Then the diagram re-renders within 500ms
- [ ] Given the app is displaying a diagram, When the sidecar file is modified externally, Then the diagram re-renders within 500ms
- [ ] Given rapid successive file changes (e.g., AI writing multiple updates), Then the app debounces and renders the final state without flickering or crashing

### FR-5: Layout Editing Mode

The system must provide an explicit toggle to enter a layout editing mode. In this mode, the user can drag nodes to reposition them. Relationship arrows must update in real time to reflect new positions. All layout changes are persisted to the sidecar file.

**Acceptance Criteria:**
- [ ] Given the app is in viewing mode, When the user activates the layout editing toggle, Then the UI indicates editing mode is active
- [ ] Given editing mode is active, When the user drags a node, Then the node follows the cursor smoothly
- [ ] Given editing mode is active, When the user drags a node, Then all relationship arrows connected to that node update their paths in real time
- [ ] Given editing mode is active, When the user selects a node, Then the node displays a selection highlight
- [ ] Given editing mode is active, When the user drags a node near another node, Then alignment guides appear
- [ ] Given editing mode is active, When the user releases a dragged node, Then the new position is saved to the sidecar file
- [ ] Given editing mode is active, The user cannot create, delete, or modify relationships (semantic editing is not allowed)

### FR-6: Error Handling for Invalid Mermaid Syntax

The system must handle Mermaid syntax errors gracefully. When the current `.mmd` file contains invalid syntax, the system displays the last successfully rendered diagram with a visible error indicator.

**Acceptance Criteria:**
- [ ] Given a previously valid diagram is displayed, When the `.mmd` file is saved with a syntax error, Then the last valid render remains visible
- [ ] Given an error state, Then a visible error indicator is shown (e.g., banner, icon, or badge)
- [ ] Given an error state, When the `.mmd` file is corrected and saved, Then the diagram re-renders normally and the error indicator disappears
- [ ] Given a `.mmd` file that has never rendered successfully, Then the app shows the error message inline (no previous render to fall back to)

---

## 5. Non-Goals (Out of Scope)

- Public diagram hosting or sharing
- Collaborative multi-user editing (real-time or otherwise)
- Marketing, enterprise distribution, or app store submission
- Editing Mermaid source code within the application
- Creating or modifying relationships in layout editing mode (relationships are read-only from the `.mmd` file)
- Layer system (deferred to a future phase)
- Full feature parity between macOS app and optional web deployment

---

## 6. Dependencies & Integration Points

| Dependency | What It Provides | Modification Needed? | Ordering Constraint |
|---|---|---|---|
| **Mermaid.js** | Diagram parsing and rendering engine | No (use as-is) | Must be integrated before any rendering work |
| **Tauri 2.0** | macOS native shell with WKWebView, file association support, file system watching via Rust | No (use as-is) | Foundation; must be set up before all other features |
| **macOS Finder** | File association / "Open With" integration | Configuration only (Info.plist via Tauri config) | Requires Tauri app shell to be buildable |
| **File system (`.mmd` + sidecar JSON)** | Source files and layout data | N/A (external input) | File model conventions must be defined before sidecar support |

---

## 7. Design Considerations

- **Viewing mode** is the default. Layout editing is an explicit opt-in via a pill-style toggle.
- UI complexity is hidden unless explicitly requested. The primary experience is "open file, see diagram."
- The rendering surface is a web view (HTML/JS via Mermaid.js) embedded in Tauri's WKWebView.
- Layout editing visual feedback should include: selection highlight on selected nodes and alignment guides when dragging near other nodes.

---

## 8. Technical Considerations

- **Application shell:** Tauri 2.0 (Rust backend + web frontend using macOS system WKWebView). Small bundle size (~10 MB), native file association support, excellent file watching via Rust's `notify` crate.
- **Rendering engine:** Mermaid.js running in the web view. DOM-based rendering preferred over canvas for easier node interaction (hit testing, drag handling).
- **File watching:** Rust-side file watcher (via `notify` crate) pushes events to the web frontend. Debounce rapid changes to avoid render thrashing.
- **Sidecar file format:** JSON. Co-located with the `.mmd` file (e.g., `diagram.mmd` + `diagram.mmd.layout.json`). Schema TBD but must reference nodes by stable identifiers.
- **AI-centric considerations:** Node identifiers may drift when AI rewrites diagrams. Mitigations: encourage stable naming conventions; silently discard orphaned layout hints; fall back to auto-layout for new/unrecognized nodes.

---

## 9. Implementation Phases

### Phase 1 - Foundation (First Milestone)

Finder integration + read-only rendering. No editing, no layers, no sidecar.

- FR-1: Finder File Association
- FR-2: Mermaid Diagram Rendering
- FR-6: Error Handling for Invalid Mermaid Syntax

### Phase 2 - File Monitoring + Sidecar

Live reload and sidecar-driven layout.

- FR-4: Real-Time File Monitoring
- FR-3: Sidecar File Support

### Phase 3 - Layout Editing

Interactive node repositioning with visual feedback.

- FR-5: Layout Editing Mode

### Phase 4 - Polish & Optional Web Deployment

Error handling refinements, performance optimization, optional web version.

- Performance testing with large diagrams (100+ nodes)
- Optional: deploy rendering engine as a standalone web app

### Future - Layer System

Visual layer abstraction (toggle visibility of node groups). Deferred until core viewing/editing is solid.

---

## 10. Success Metrics

**Technical metrics:**
- Diagram renders within 1 second for files with up to 50 nodes
- File change detection and re-render completes within 500ms
- App bundle size under 15 MB
- All Mermaid diagram types supported by Mermaid.js render correctly
- Test coverage for core rendering and file-watching logic exceeds 80%

**Product metrics:**
- Team members stop using mermaid.live for diagram viewing within 2 weeks of adoption
- AI-generated `.mmd` files render correctly without manual intervention in 90%+ of cases
- Layout editing changes persist correctly across app restarts 100% of the time

---

## 11. Open Questions

1. **Sidecar file schema:** What specific JSON structure should be used for node positions and styling metadata? Should it follow an existing convention or be custom?
2. **Multi-window vs. single-window:** When a second `.mmd` file is opened, should it open in a new window or replace the current view?
3. **Sidecar file naming convention:** `diagram.mmd.layout.json` vs. `diagram.layout.json` vs. `.diagram.mmd.json` (hidden file)?
4. **Web deployment scope:** If the optional web version is built, which features are included? View-only, or editing too?
5. **Error indicator design:** Banner, toast, icon badge, or something else? (To be determined after testing, per user preference.)
6. **Drag interaction details:** Should node dragging support snap-to-grid, or free-form positioning only?
