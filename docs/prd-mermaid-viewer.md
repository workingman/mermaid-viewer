# PRD: Mermaid Rendering and Layout Application

## 0. Metadata

| Attribute | Details |
| :--- | :--- |
| **Author** | Sam |
| **Status** | Draft |
| **Priority** | P1 - High |
| **Target Release** | Phase 1 (Finder + read-only rendering) |

---

## 1. Problem & Opportunity (The "Why")

**Do not start with the solution.**

**The Problem:**
There is no fast, native way to view Mermaid (`.mmd`) diagram files on macOS. The team currently relies on browser-based tools (mermaid.live) which adds friction to every diagram interaction. Worse, Mermaid's default auto-layout produces cluttered, hard-to-read diagrams that obscure the relationships the team is trying to understand. When the team collaborates on diagram content, they need to see clearly how things are related, but the default rendering works against comprehension rather than supporting it.

**The Evidence:**
- The team needs a fast way to look at Mermaid diagrams during collaboration on content and structure.
- Understanding relationships between elements requires the ability to reposition nodes and create custom layouts that reflect the team's mental model, not just the parser's default.
- Default Mermaid layout is consistently described as "ugly" and insufficient for comprehension of complex diagrams.
- AI tools increasingly generate and modify `.mmd` files on disk, but there is no live preview that updates when the file changes. The current workflow requires manually copy-pasting into a browser.
- `.mmd` files received from third parties cannot be quickly opened and understood without a rendering tool.

**The Opportunity:**
A native viewer that opens `.mmd` files instantly from Finder, with live file-watching and interactive layout editing, would eliminate the browser round-trip, make AI-generated diagrams immediately visible, and give the team the ability to lay out diagrams according to their own understanding of the domain. This replaces mermaid.live as the primary diagram tool.

---

## 2. Key Decisions & Trade-offs (Alignment)

1. **Phase 1 is minimal:** Finder integration + read-only rendering + error handling only. No editing, no sidecar support, no layers. Get the core "double-click to view" loop working first.

2. **Layer system is deferred:** Layers (visual grouping/toggling of nodes) are a real need but are explicitly deferred until the core viewing and editing experience is solid.

3. **Separation of layout from semantics:** Layout data lives in a sidecar file, never in the `.mmd` source. This keeps `.mmd` files lean and suitable as LLM context, at the cost of managing two files per diagram.

4. **All Mermaid diagram types supported from day one:** No subset approach. If Mermaid.js can render it, the app must render it.

5. **Edge rendering quality matters:** Relationship arrows must use orthogonal routing (90-degree turns with rounded corners), show crossing indicators (gap/bridge), and maintain minimum parallel separation. The default Mermaid edge rendering is not sufficient. This is a core differentiator, not a polish item.

6. **Error handling favors continuity:** On syntax errors, show the last valid render with an error indicator rather than a blank screen. This keeps the diagram useful during iterative editing.

7. **macOS only for v1:** No cross-platform requirement. An optional web deployment may come later but is not required and will not have full feature parity.

---

## 3. Functional Requirements (The "What")

### FR-001: Finder File Association

The system must register as the default handler for `.mmd` files on macOS. Double-clicking a `.mmd` file in Finder must open the application and render the diagram.

**Acceptance Criteria:**
- [ ] Given a `.mmd` file in Finder, When the user double-clicks it, Then the app launches (or comes to foreground) and renders the diagram
- [ ] Given the app is already running, When the user double-clicks a different `.mmd` file, Then the new file is opened
- [ ] Given a `.mmd` file in Finder, When the user right-clicks it, Then the app appears in the "Open With" menu

### FR-002: Mermaid Diagram Rendering

The system must render any valid Mermaid diagram. All standard diagram types must be supported (flowcharts, sequence diagrams, state diagrams, class diagrams, ER diagrams, Gantt charts, pie charts, git graphs, etc.).

**Acceptance Criteria:**
- [ ] Given a valid `.mmd` file containing any supported Mermaid diagram type, When it is opened, Then the diagram renders correctly
- [ ] Given a diagram with up to 50 nodes, When it renders, Then rendering completes within 1 second
- [ ] Given a rendered diagram, When the user views it, Then all node labels, edge labels, and relationship arrows are legible

### FR-003: Edge Rendering Quality

Relationship arrows must use orthogonal routing with high visual quality. This is a core requirement, not a cosmetic enhancement.

**Acceptance Criteria:**
- [ ] Given a rendered diagram, When edges are drawn, Then they use straight line segments with 90-degree turns only (no diagonal or curved paths between nodes)
- [ ] Given an edge with a bend point, When it renders, Then the corner uses a small-radius curve (not a sharp right angle)
- [ ] Given two edges that cross, When they render, Then one edge shows a visible gap/bridge at the crossing point to indicate the lines are not connected
- [ ] Given two edges running parallel, When they render, Then they maintain a minimum visible separation (not overlapping or touching)
- [ ] Given editing mode is active and a node is dragged, When the node moves, Then all connected edges re-route in real time maintaining these quality constraints

### FR-004: Real-Time File Monitoring

The system must watch the currently open `.mmd` file (and its sidecar file, when sidecar support is implemented) for changes on disk and re-render immediately when changes are detected.

**Acceptance Criteria:**
- [ ] Given the app is displaying a diagram, When the `.mmd` file is modified by an external process, Then the diagram re-renders within 500ms
- [ ] Given rapid successive file changes (e.g., an AI tool writing multiple updates), When the app detects the changes, Then it debounces and renders the final state without flickering or crashing

### FR-005: Sidecar File Support (Layout Hints)

The system must read an optional sidecar file (co-located with the `.mmd` file) that provides layout hints including node positions and styling metadata. When present, layout hints override the auto-layout for the referenced nodes. When absent or partially applicable, the system falls back to auto-layout for unhinted nodes.

**Acceptance Criteria:**
- [ ] Given a `.mmd` file with a corresponding sidecar file, When the diagram renders, Then node positions match the sidecar hints
- [ ] Given a `.mmd` file with no sidecar file, When the diagram renders, Then auto-layout is used for all nodes
- [ ] Given a sidecar file referencing node IDs not present in the `.mmd` file, When the diagram renders, Then orphaned hints are silently ignored
- [ ] Given a `.mmd` file with nodes not referenced in the sidecar, When the diagram renders, Then unhinted nodes use auto-layout
- [ ] Given the sidecar file is modified externally, When the app detects the change, Then the diagram re-renders with updated layout hints

### FR-006: Layout Editing Mode

The system must provide an explicit toggle to enter a layout editing mode. In this mode, the user can drag nodes to reposition them. Relationship arrows must update in real time. All layout changes are persisted to the sidecar file. Semantic editing (creating/deleting/modifying relationships) is not permitted.

**Acceptance Criteria:**
- [ ] Given the app is in viewing mode, When the user activates the editing toggle, Then the UI clearly indicates editing mode is active
- [ ] Given editing mode is active, When the user drags a node, Then the node follows the cursor smoothly
- [ ] Given editing mode is active, When the user drags a node, Then all relationship arrows connected to that node re-route in real time
- [ ] Given editing mode is active, When the user selects a node, Then the node displays a selection highlight
- [ ] Given editing mode is active, When the user drags a node near another node, Then alignment guides appear
- [ ] Given editing mode is active, When the user releases a dragged node, Then the new position is persisted to the sidecar file
- [ ] Given editing mode is active, Then the user cannot create, delete, or modify relationships

### FR-007: Error Handling for Invalid Mermaid Syntax

The system must handle Mermaid syntax errors gracefully by preserving the last successful render.

**Acceptance Criteria:**
- [ ] Given a previously valid diagram is displayed, When the `.mmd` file is saved with a syntax error, Then the last valid render remains visible
- [ ] Given an error state, Then a visible error indicator is shown (design TBD)
- [ ] Given an error state, When the `.mmd` file is corrected and saved, Then the diagram re-renders normally and the error indicator disappears
- [ ] Given a `.mmd` file that has never rendered successfully, When opened, Then the app shows the error message inline

### FR-008: Viewport Navigation

The system must support zoom and pan interactions for navigating rendered diagrams. Multi-touch input (trackpad, Magic Mouse) must be supported as the primary navigation method.

**Acceptance Criteria:**
- [ ] Given a rendered diagram, When the user pinch-zooms on a multi-touch surface, Then the diagram zooms in or out centered on the pinch point
- [ ] Given a rendered diagram, When the user two-finger scrolls on a multi-touch surface, Then the diagram pans in the corresponding direction (up, down, left, right)
- [ ] Given a rendered diagram, When the user presses Cmd++ or Cmd+-, Then the diagram zooms in or out
- [ ] Given a rendered diagram, When the user presses Cmd+0, Then the diagram fits to the window
- [ ] Given a zoomed-in diagram larger than the viewport, Then macOS-style overlay scroll indicators show the current viewport position within the full diagram

---

## 4. Non-Goals (Out of Scope)

- Public diagram hosting or sharing
- Collaborative multi-user editing (real-time or otherwise)
- Marketing, enterprise distribution, or app store submission
- Editing Mermaid source code within the application
- Creating or modifying relationships in layout editing mode
- Layer system (deferred to a future phase, not part of this PRD)
- Full feature parity between macOS app and any optional web deployment
- Cross-platform support (Windows, Linux)

---

## 5. Technical Constraints & Assumptions

- Must run as a native macOS application with Finder integration (file type association, "Open With" menu)
- Must use a web-based rendering surface (the Mermaid ecosystem is JavaScript/browser-based)
- Must support all diagram types that the current stable release of Mermaid.js supports
- `.mmd` files must remain unmodified by the application (the app is read-only with respect to Mermaid source; layout goes to the sidecar)
- Sidecar files must be co-located with their `.mmd` file (same directory)
- Sidecar file format must be human-readable (JSON) and reference nodes by stable identifiers
- App bundle size should be under 15 MB
- Rendering must complete within 1 second for diagrams with up to 50 nodes
- File change detection and re-render must complete within 500ms
- Designed for a small internal team (2-5 engineers); no multi-tenancy or access control

---

## 6. Design & Visuals

See companion file: `docs/flow-mermaid-viewer.mmd`

**Primary UI states:**

1. **Viewing Mode (default):** Rendered diagram fills the window. Minimal chrome. The primary experience is "open file, see diagram."
2. **Editing Mode:** Toggled via a pill-style control. Nodes become draggable. Selection highlights and alignment guides appear. Relationship arrows update in real time.
3. **Error State:** Last valid render remains visible with a non-blocking error indicator (banner, badge, or similar -- design TBD after testing).
