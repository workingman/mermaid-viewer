# TDD: Mermaid Rendering and Layout Application

## 0. Metadata

| Attribute | Details |
| :--- | :--- |
| **PRD** | `docs/prd-mermaid-viewer.md` |
| **Status** | Draft |
| **Tech Lead** | Geoff |
| **Standards** | `docs/standards/general.md`, `.claude/skills/javascript-standards/SKILL.md` |

---

## 1. Technology Choices

| Category | Choice | Rationale | Alternatives Considered |
| :--- | :--- | :--- | :--- |
| Application Shell | Tauri 2.0 | ~3-5MB bundle vs. Electron's 100MB+; native macOS APIs for Finder integration, file watching (FSEvents), and multi-window management; Rust backend provides memory safety and low overhead | Electron (bloated bundle, excessive RAM), Wails (smaller ecosystem, less mature on macOS) |
| Native Language | Rust (stable) | Required by Tauri; provides direct access to FSEvents, Cocoa window APIs, and safe concurrency for file watching | N/A (Tauri dictates this) |
| Web Language | TypeScript (strict mode) | Type safety catches integration bugs at compile time; excellent Mermaid.js and ELK type definitions available | Plain JavaScript (no compile-time safety) |
| Diagram Parser | Mermaid.js (latest stable, pinned) | The .mmd format is Mermaid's native format; no alternative parser exists. Used ONLY for parsing and node shape rendering, NOT for layout | N/A (format dictates parser) |
| Layout Engine | ELK (elkjs) | Orthogonal routing with configurable edge spacing, crossing minimization, and layered layout algorithms. Handles both node positioning and edge routing. Replaces Mermaid's built-in dagre entirely | dagre (no orthogonal routing, poor crossing handling), d3-force (physics-based, wrong paradigm for structured diagrams), Graphviz/WASM (large binary, limited orthogonal support) |
| Package Manager | pnpm | Strict dependency resolution prevents phantom deps; disk-efficient via hard links; workspace support for future monorepo | npm (flat node_modules, slower), yarn (Berry complexity unnecessary for this project) |
| Build Tool | Vite | Native ESM dev server with sub-second HMR; first-class TypeScript support; Tauri's official frontend recommendation | Webpack (slow, complex config), Parcel (magic can conflict with Tauri) |
| Testing | Vitest | Shares Vite's config and transform pipeline; ESM-native; compatible with our standards (`.test.ts` colocation) | Jest (CJS-first, separate transform config) |
| CSS | Plain CSS + custom properties | No build step overhead; custom properties enable theming and dark mode without a framework; scoping via BEM-style conventions keeps selectors flat | Tailwind (utility-class noise in SVG-heavy UI), CSS Modules (unnecessary indirection for small component surface) |
| Linting | ESLint + Prettier | ESLint catches logic errors and enforces standards; Prettier eliminates formatting debates; both have strong TS support | Biome (promising but less mature plugin ecosystem) |

---

## 2. Architecture Overview

See companion diagram: `docs/arch-mermaid-viewer.mmd`

### Components

The system has two process boundaries: the **Rust/Tauri native layer** and the **WebView layer**.

**Rust/Tauri Native Layer (Backend)**

| Component | Responsibility |
| :--- | :--- |
| **FileWatcher** | Monitors `.mmd` and `.mmd.layout.json` files via FSEvents. Debounces events (100ms window). Emits file-change events to the WebView via Tauri IPC. |
| **FileIO** | Reads/writes files from disk. Exposes Tauri commands for `read_file` and `write_sidecar`. Enforces that the app never writes to `.mmd` files. |
| **WindowManager** | Creates and manages per-document windows. Handles Finder `open-file` events. Sizes new windows to 80% of screen real estate. Routes file paths to the correct window. |

**WebView Layer (Frontend)**

| Component | Responsibility |
| :--- | :--- |
| **MermaidParser** | Wraps Mermaid.js. Accepts raw `.mmd` text, returns parsed graph structure (nodes with IDs/labels/shapes, edges with source/target/labels) and per-node SVG fragments. Does NOT perform layout. |
| **LayoutEngine** | Wraps elkjs. Accepts parsed graph structure, optional sidecar hints. Produces positioned node coordinates and routed edge paths (orthogonal segments). |
| **SvgCompositor** | Takes Mermaid-rendered node SVGs + ELK layout output. Composites the final SVG: positions node shapes, draws edge paths with rounded corners, adds crossing indicators, handles parallel edge separation. |
| **SidecarManager** | Reads/writes sidecar JSON. Merges sidecar hints with parsed graph structure. Validates sidecar against current graph (silently drops orphaned hints). |
| **EditController** | Manages editing mode state. Handles drag interactions, shows background grid. On drag end, writes updated positions to sidecar via SidecarManager. Triggers re-layout of connected edges in real time. |
| **ErrorBoundary** | Caches last valid render. On parse/render failure, preserves cached SVG and shows error banner. Auto-dismisses banner when the file is corrected. |
| **ViewportController** | Manages pan, zoom, and fit-to-window. Handles scroll/pinch gestures. |

### Boundaries

| Boundary | Mechanism | Sync/Async |
| :--- | :--- | :--- |
| Rust <-> WebView | Tauri IPC (`invoke` for commands, `emit`/`listen` for events) | Async |
| MermaidParser -> LayoutEngine | Function call (same JS thread) | Sync (sub-second for <= 50 nodes) |
| LayoutEngine -> SvgCompositor | Function call | Sync |
| EditController -> SidecarManager | Function call | Async (writes to disk via Tauri IPC) |
| FileWatcher -> WebView | Tauri event emission | Async |

### End-to-End Data Flow: Opening a File from Finder

```
1. User double-clicks `architecture.mmd` in Finder
2. macOS sends open-file event to the Tauri app
3. WindowManager receives the event:
   a. If no window exists for this path, creates a new window (80% screen size)
   b. If a window exists, brings it to foreground
4. WindowManager sends the file path to the new window's WebView
5. WebView invokes Tauri command `read_file(path)` -> gets .mmd text
6. WebView invokes Tauri command `read_file(sidecar_path)` -> gets sidecar JSON or null
7. MermaidParser.parse(mmdText):
   a. Calls mermaid.parse() to validate syntax
   b. Calls mermaid.render() with a hidden container to get node SVGs
   c. Extracts graph structure: nodes[], edges[]
   d. Returns { nodes, edges, nodeSvgFragments }
8. SidecarManager.merge(parsedGraph, sidecarJson):
   a. Maps sidecar positions to matching node IDs
   b. Silently drops orphaned sidecar entries
   c. Returns mergedGraph with optional { x, y } on each node
9. LayoutEngine.layout(mergedGraph):
   a. Converts to ELK JSON format
   b. Nodes with sidecar positions are marked as fixed (ELK respects these)
   c. ELK computes positions for unfixed nodes
   d. ELK computes orthogonal edge routes for ALL edges
   e. Returns layoutResult: { positionedNodes[], routedEdges[] }
10. SvgCompositor.compose(layoutResult, nodeSvgFragments):
    a. Creates root <svg> with viewBox
    b. Places each node's SVG fragment at its ELK-assigned (x, y)
    c. Draws edge paths from ELK's bend points
    d. Applies rounded corners to bend points
    e. Detects edge crossings and inserts gap/bridge indicators
    f. Applies parallel edge separation offsets
    g. Returns final SVG element
11. ViewportController.display(svgElement):
    a. Inserts SVG into the DOM
    b. Fits viewport to content
12. FileWatcher starts watching architecture.mmd and architecture.mmd.layout.json
13. ErrorBoundary caches the successful render
```

---

## 3. Data Models

### ParsedGraph

```
ParsedGraph
  nodes: ParsedNode[]     — all nodes extracted from Mermaid parse
  edges: ParsedEdge[]     — all edges extracted from Mermaid parse
  diagramType: string     — e.g., "flowchart", "sequenceDiagram", "classDiagram"
```

### ParsedNode

```
ParsedNode
  id: string              — Mermaid node ID (e.g., "A", "userService")
  label: string           — display text (e.g., "User Service")
  shape: string           — Mermaid shape type (e.g., "rect", "diamond", "circle")
  width: number           — intrinsic width from Mermaid's rendered SVG (px)
  height: number          — intrinsic height from Mermaid's rendered SVG (px)
  svgFragment: string     — raw SVG markup for this node as rendered by Mermaid
  Constraints: id is unique within a ParsedGraph
```

### ParsedEdge

```
ParsedEdge
  id: string              — generated from "{sourceId}->{targetId}:{index}" for uniqueness
  sourceId: string        — references ParsedNode.id
  targetId: string        — references ParsedNode.id
  label: string | null    — edge label text, if any
  arrowType: string       — e.g., "arrow_point", "arrow_open", "arrow_circle", "arrow_cross"
  lineStyle: string       — "solid" | "dotted" | "thick"
  Constraints: sourceId and targetId must reference valid ParsedNode.id values
```

### SidecarFile (JSON Schema)

File naming convention: `<filename>.mmd.layout.json`
Example: `architecture.mmd` -> `architecture.mmd.layout.json`

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["version", "nodes"],
  "additionalProperties": false,
  "properties": {
    "version": {
      "type": "integer",
      "const": 1,
      "description": "Schema version for forward compatibility"
    },
    "nodes": {
      "type": "object",
      "description": "Map of Mermaid node ID -> layout hints",
      "additionalProperties": {
        "type": "object",
        "required": ["x", "y"],
        "additionalProperties": false,
        "properties": {
          "x": {
            "type": "number",
            "description": "X position in diagram coordinates (px from origin)"
          },
          "y": {
            "type": "number",
            "description": "Y position in diagram coordinates (px from origin)"
          }
        }
      }
    }
  }
}
```

**Annotated example** (`architecture.mmd.layout.json`):

```json
{
  "version": 1,
  "nodes": {
    "A": { "x": 100, "y": 50 },
    "B": { "x": 300, "y": 50 },
    "userService": { "x": 100, "y": 200 },
    "db": { "x": 400, "y": 200 }
  }
}
```

Notes:
- Node IDs correspond directly to Mermaid source IDs (e.g., `A` in `A[Label]`).
- Orphaned entries (IDs not in the current `.mmd`) are silently ignored per FR-005.
- Nodes present in `.mmd` but absent from the sidecar use ELK auto-layout.
- Coordinates use the same coordinate space as the SVG viewBox.

### ELKInputGraph

The intermediate format passed to elkjs:

```
ELKInputGraph
  id: "root"                              — required root identifier
  layoutOptions: ELKLayoutOptions         — algorithm configuration
  children: ELKNode[]                     — nodes to position
  edges: ELKEdge[]                        — edges to route
```

### ELKNode

```
ELKNode
  id: string                              — matches ParsedNode.id
  width: number                           — from ParsedNode.width
  height: number                          — from ParsedNode.height
  x: number | undefined                   — set from sidecar if available (fixed position)
  y: number | undefined                   — set from sidecar if available (fixed position)
  layoutOptions: { "elk.position"?: string } — "(x,y)" string if position is fixed
```

### ELKEdge

```
ELKEdge
  id: string                              — matches ParsedEdge.id
  sources: [string]                       — [sourceId]
  targets: [string]                       — [targetId]
  labels: ELKLabel[]                      — edge label if present
```

### ELKLayoutResult

```
ELKLayoutResult
  children: PositionedNode[]              — nodes with computed x, y
  edges: RoutedEdge[]                     — edges with bend point sections
```

### PositionedNode

```
PositionedNode
  id: string
  x: number                               — final x position
  y: number                               — final y position
  width: number
  height: number
```

### RoutedEdge

```
RoutedEdge
  id: string
  sections: EdgeSection[]                  — one or more polyline sections
```

### EdgeSection

```
EdgeSection
  startPoint: { x: number, y: number }
  endPoint: { x: number, y: number }
  bendPoints: { x: number, y: number }[]  — intermediate orthogonal bend points
```

### EdgeCrossing

```
EdgeCrossing
  point: { x: number, y: number }          — intersection coordinate
  edge1Id: string                           — first edge involved
  edge2Id: string                           — second edge involved
```

### WindowState (Rust)

```
WindowState
  window_id: String                        — Tauri window label (e.g., "doc-0", "doc-1")
  file_path: PathBuf                       — absolute path to the .mmd file
  sidecar_path: PathBuf                    — computed as file_path + ".layout.json"
  watcher_active: bool                     — whether FSEvents watcher is running
```

---

## 4. Interface Contracts

### Tauri Commands (Rust -> WebView)

```
read_file(path: String): String
  Purpose: Read file contents from disk as UTF-8 text
  Returns: file contents as string
  Errors: FileNotFound — path does not exist
          ReadError — permission denied or I/O failure

write_sidecar(path: String, content: String): void
  Purpose: Write sidecar JSON to disk (atomic write via temp file + rename)
  Errors: WriteError — permission denied, disk full, or I/O failure

get_sidecar_path(mmd_path: String): String
  Purpose: Compute sidecar path from .mmd path (<filename>.mmd.layout.json)
  Returns: absolute path string
  Errors: none (pure computation)
```

### Tauri Events (Rust -> WebView)

```
file-changed
  Payload: { path: String, kind: "mmd" | "sidecar" }
  Emitted by: FileWatcher (Rust)
  Consumed by: WebView event listener
  Timing: Async, debounced with 100ms window. Multiple rapid FS events
          within the window collapse into a single emission.

window-file-opened
  Payload: { path: String }
  Emitted by: WindowManager (Rust)
  Consumed by: WebView initialization logic
  Timing: Async, emitted once when a window is created and ready
```

### MermaidParser

```
parse(mmdText: string): ParseResult
  Purpose: Parse .mmd text and render node SVG fragments
  Returns: ParseResult (see below)
  Throws: MermaidParseError — when syntax is invalid

interface ParseResult {
  graph: ParsedGraph;
  nodeSvgFragments: Map<string, string>;  // nodeId -> SVG markup
}
```

**Implementation detail:** Mermaid.js does not expose a clean "parse only" API that returns graph structure directly. The extraction strategy:

1. Call `mermaid.parse(mmdText)` to validate syntax. This throws on invalid input.
2. Call `mermaid.render(id, mmdText)` with a hidden/off-screen container to produce full SVG output.
3. Query the rendered SVG DOM to extract:
   - Nodes: select `.node` elements. Extract `id` attribute (Mermaid assigns its node IDs), bounding box (`getBBox()`), and the inner SVG markup.
   - Edges: select `.edgePath` and `.edgeLabel` elements. Extract `data-source`, `data-target` (or parse from the element's class/id which encodes the relationship), and label text.
4. Build `ParsedGraph` from the extracted data.

This approach is necessary because Mermaid's internal parser AST is not a stable public API. Rendering to SVG and extracting structure from the DOM is the most reliable integration path.

### SidecarManager

```
loadSidecar(sidecarJson: string | null): SidecarData | null
  Purpose: Parse and validate sidecar JSON
  Returns: validated SidecarData or null if input is null/invalid
  Throws: never (invalid sidecar logs warning and returns null)

mergeSidecarIntoGraph(graph: ParsedGraph, sidecar: SidecarData | null): MergedGraph
  Purpose: Attach sidecar positions to matching nodes
  Returns: MergedGraph (ParsedGraph with optional x,y on each node)
  Throws: never (orphaned hints are silently dropped)

buildSidecarFromPositions(nodes: PositionedNode[]): SidecarData
  Purpose: Create sidecar data from current node positions (for saving after drag)
  Returns: SidecarData ready for JSON serialization
  Throws: never

interface SidecarData {
  version: 1;
  nodes: Record<string, { x: number; y: number }>;
}

interface MergedNode extends ParsedNode {
  hintX?: number;   // from sidecar, if present
  hintY?: number;   // from sidecar, if present
}

interface MergedGraph {
  nodes: MergedNode[];
  edges: ParsedEdge[];
  diagramType: string;
}
```

### LayoutEngine

```
computeLayout(graph: MergedGraph): LayoutResult
  Purpose: Run ELK layout algorithm on the graph
  Returns: LayoutResult with positioned nodes and routed edges
  Throws: LayoutError — ELK internal failure (unlikely, defensive)

interface LayoutResult {
  positionedNodes: PositionedNode[];
  routedEdges: RoutedEdge[];
}
```

**ELK configuration:**

```typescript
const ELK_OPTIONS: Record<string, string> = {
  'elk.algorithm': 'layered',
  'elk.direction': 'DOWN',
  'elk.layered.spacing.nodeNodeBetweenLayers': '80',
  'elk.spacing.nodeNode': '40',
  'elk.edgeRouting': 'ORTHOGONAL',
  'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
  'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
  'elk.spacing.edgeEdge': '15',
  'elk.spacing.edgeNode': '20',
  'elk.layered.unnecessaryBendpoints': 'false',
};
```

For nodes with sidecar hints, set ELK's fixed position constraint:

```typescript
// For each node with hintX/hintY from sidecar:
elkNode.x = node.hintX;
elkNode.y = node.hintY;
elkNode.layoutOptions = {
  'elk.position': `(${node.hintX}, ${node.hintY})`,
  'org.eclipse.elk.noLayout': 'true',
};
```

### SvgCompositor

```
compose(layout: LayoutResult, svgFragments: Map<string, string>, edges: ParsedEdge[]): SVGElement
  Purpose: Build final composite SVG from positioned nodes and routed edges
  Returns: complete SVG DOM element ready for insertion
  Throws: never (defensive — missing fragments render as placeholder rectangles)

computeEdgeCrossings(routedEdges: RoutedEdge[]): EdgeCrossing[]
  Purpose: Detect all points where edge paths intersect
  Returns: array of crossing points with involved edge IDs
  Throws: never

renderEdgePath(edge: RoutedEdge, crossings: EdgeCrossing[], parsedEdge: ParsedEdge): SVGPathElement
  Purpose: Render a single edge as an SVG <path> with rounded corners and crossing gaps
  Returns: SVG <path> element
  Throws: never
```

**Edge rendering details:**

Rounded corners on bend points:
- At each bend point, replace the sharp 90-degree turn with a quadratic Bezier curve.
- Corner radius: 6px (configurable via CSS custom property `--edge-corner-radius`).
- SVG path construction: for a bend from point A through bend B to point C, use `L (B - radius toward A) Q B (B + radius toward C)`.

Crossing indicators:
- After ELK routes all edges, compute all pairwise segment intersections.
- At each crossing point, the edge drawn later (lower z-order) gets a gap: a 10px section of the path is replaced with a bridge arc or a gap (transparent break in the line).
- Bridge style: a small arc `A 5 5 0 0 1` that humps over the crossing.
- Gap size and bridge arc configurable via CSS custom properties `--edge-crossing-gap` and `--edge-bridge-radius`.

Parallel edge separation:
- ELK's `elk.spacing.edgeEdge: '15'` setting handles this at the routing level.
- No additional post-processing needed; ELK natively separates parallel edges when using orthogonal routing.

### EditController

```
enterEditMode(): void
  Purpose: Enable drag interactions on nodes, show editing UI chrome
  Throws: never

exitEditMode(): void
  Purpose: Disable drag interactions, hide editing UI chrome
  Throws: never

handleNodeDragStart(nodeId: string, event: PointerEvent): void
  Purpose: Begin tracking drag for a node
  Throws: never

handleNodeDrag(nodeId: string, event: PointerEvent): void
  Purpose: Update node position, trigger real-time edge re-routing
  Throws: never

handleNodeDragEnd(nodeId: string, event: PointerEvent): void
  Purpose: Finalize position, persist to sidecar
  Throws: never (write errors are surfaced via error banner)

isEditingEnabled(): boolean
  Purpose: Check if editing mode is available (false for non-graph diagram types)
  Returns: true for graph types (flowchart, stateDiagram, classDiagram, erDiagram)
```

**Real-time re-routing during drag:**
- On each `handleNodeDrag`, update the dragged node's position in the ELK input.
- Re-run ELK layout with ALL nodes fixed (current positions) except compute new edge routes.
- This is feasible because ELK's edge routing alone (with fixed node positions) is fast (<50ms for 50 nodes).
- The SvgCompositor re-renders only the affected edges, not the entire SVG.

### ViewportController

```
fitToContent(): void
  Purpose: Adjust viewBox so entire diagram is visible with padding

zoomTo(level: number, center?: { x: number, y: number }): void
  Purpose: Set zoom level (1.0 = 100%), optionally centered on a point
  Constraints: level clamped to [0.1, 5.0]

zoomBy(delta: number, center: { x: number, y: number }): void
  Purpose: Relative zoom (pinch-to-zoom). delta > 0 zooms in, < 0 zooms out.
  Center: the focal point of the pinch gesture in viewport coordinates

panBy(dx: number, dy: number): void
  Purpose: Shift viewport by pixel delta (two-finger scroll maps here)

getViewportRect(): { x: number, y: number, width: number, height: number }
  Purpose: Current visible area in diagram coordinates (for scroll indicators)
```

**Multi-touch support:**
- Pinch-to-zoom: listen for `wheel` events with `ctrlKey` (macOS trackpad/Magic Mouse sends pinch gestures as ctrl+wheel). Map `event.deltaY` to `zoomBy()` with `event.clientX/Y` as center.
- Two-finger pan: listen for `wheel` events without `ctrlKey`. Map `event.deltaX/deltaY` to `panBy()`.
- Keyboard: `Cmd+=` -> `zoomBy(+0.1, viewportCenter)`, `Cmd+-` -> `zoomBy(-0.1, viewportCenter)`, `Cmd+0` -> `fitToContent()`.
- Scroll indicators: use a container `<div>` with `overflow: auto` and a spacer element sized to the full diagram. The native macOS overlay scrollbars appear automatically. Update spacer size and scroll position when zoom/pan changes.

### ErrorBoundary

```
cacheRender(svgElement: SVGElement): void
  Purpose: Store the last successfully rendered SVG

getLastValidRender(): SVGElement | null
  Purpose: Retrieve cached SVG for error fallback

createSnapshot(): HTMLCanvasElement | null
  Purpose: Rasterize the current SVG to a canvas for display during re-render
  Returns: canvas element with rasterized diagram, or null if no current render
  Behavior: Called at the start of a re-render cycle. The canvas replaces the
            SVG in the viewport while the pipeline runs.

showRenderingIndicator(): void
  Purpose: Display a subtle spinner in the viewport corner during re-render

hideRenderingIndicator(): void
  Purpose: Remove the rendering spinner when re-render completes

showError(message: string): void
  Purpose: Display non-modal error banner at top of viewport
  Behavior: Banner auto-dismisses when next successful render occurs

clearError(): void
  Purpose: Remove error banner
```

Error banner specification:
- Position: fixed at top of the viewport, full width.
- Style: warm background color (amber/yellow), dark text, monospace for syntax error details.
- No dismiss button needed (auto-dismisses on fix per FR-007).
- Does not obscure the diagram (rendered below the banner, with the diagram pushed down or banner overlaid with transparency).

---

## 5. Directory Structure

```
mmv/
  src-tauri/                       -- Rust/Tauri native backend
    src/
      main.rs                      -- Tauri app entry point, plugin registration
      commands/
        file_io.rs                 -- read_file, write_sidecar Tauri commands
      watchers/
        file_watcher.rs            -- FSEvents-based file watcher, debounce logic
      windows/
        window_manager.rs          -- multi-window creation, sizing, Finder open-file handling
    tauri.conf.json                -- Tauri config (window defaults, file associations, permissions)
    Cargo.toml                     -- Rust dependencies
    icons/                         -- app icons for .mmd file type
  src/                             -- TypeScript/Web frontend
    main.ts                        -- WebView entry point, Tauri event listeners
    mermaid-parser/
      mermaid-parser.ts            -- Mermaid.js wrapper: parse + SVG extraction
      mermaid-parser.test.ts       -- unit tests
      graph-extractor.ts           -- DOM query logic to extract nodes/edges from rendered SVG
      graph-extractor.test.ts      -- unit tests
    layout-engine/
      layout-engine.ts             -- ELK wrapper: graph -> positioned layout
      layout-engine.test.ts        -- unit tests
      elk-config.ts                -- ELK layout options constants
      elk-adapter.ts               -- ParsedGraph -> ELK JSON format conversion
      elk-adapter.test.ts          -- unit tests
    svg-compositor/
      svg-compositor.ts            -- compose final SVG from layout + node fragments
      svg-compositor.test.ts       -- unit tests
      edge-renderer.ts             -- edge path construction, rounded corners, crossings
      edge-renderer.test.ts        -- unit tests
      crossing-detector.ts         -- segment intersection computation
      crossing-detector.test.ts    -- unit tests
    sidecar/
      sidecar-manager.ts           -- load, merge, build sidecar data
      sidecar-manager.test.ts      -- unit tests
      sidecar-schema.ts            -- TypeScript types + runtime validation
    edit/
      edit-controller.ts           -- drag handling, mode toggle, grid visibility
      edit-controller.test.ts      -- unit tests
    viewport/
      viewport-controller.ts       -- pan, zoom, fit-to-content
      viewport-controller.test.ts  -- unit tests
    error/
      error-boundary.ts            -- render caching, error banner
      error-boundary.test.ts       -- unit tests
    shared/
      types.ts                     -- shared TypeScript interfaces (ParsedGraph, etc.)
      constants.ts                 -- app-wide constants
    styles/
      main.css                     -- global styles, CSS custom properties
      error-banner.css             -- error banner styles
      edit-mode.css                -- editing mode visual indicators, background grid
  docs/                            -- PRDs, TDDs, standards
  process/                         -- meta-process templates
  tests/
    integration/
      render-pipeline.test.ts      -- end-to-end: .mmd text -> final SVG
      sidecar-merge.test.ts        -- sidecar + graph merge scenarios
  index.html                       -- Vite entry HTML
  vite.config.ts                   -- Vite configuration
  tsconfig.json                    -- TypeScript configuration (strict: true)
  package.json                     -- dependencies, scripts
  pnpm-lock.yaml                   -- lockfile (committed)
  .eslintrc.cjs                    -- ESLint configuration
  .prettierrc                      -- Prettier configuration
```

---

## 6. Key Implementation Decisions

**Mermaid as Parser + Node Renderer Only**
- **Decision:** Mermaid.js is used exclusively for parsing `.mmd` syntax and rendering individual node shapes to SVG. Its default layout engine (dagre) is completely bypassed. ELK handles all layout.
- **Rationale:** Mermaid's dagre-based layout produces cluttered diagrams with diagonal edges and no crossing indicators -- the exact problems this app exists to solve. Separating parsing from layout gives full control over positioning and edge routing.
- **Guidance:** Render Mermaid into a hidden/off-screen `<div>`. Extract node SVG fragments by querying the rendered DOM. Never display Mermaid's rendered output directly to the user. The `graph-extractor.ts` module encapsulates all DOM queries against Mermaid's output; if Mermaid changes its CSS class names in a future version, only this module needs updating. Pin Mermaid.js version and test extraction on upgrade.

**ELK Fixed-Position Constraint for Sidecar Hints**
- **Decision:** When a node has a sidecar position hint, it is passed to ELK with `org.eclipse.elk.noLayout: true` and explicit `x`/`y` coordinates. ELK treats these as fixed and positions only the unhinted nodes.
- **Rationale:** This gives a clean hybrid layout: user-positioned nodes stay put, auto-layout fills in the rest, and ELK routes edges around all nodes regardless of how they were positioned.
- **Guidance:** Test the edge case where ALL nodes have sidecar hints (ELK only routes edges) and where NO nodes have hints (pure auto-layout). Both must work correctly.

**Orthogonal Edge Rendering Pipeline**
- **Decision:** Edge rendering is a three-stage pipeline: (1) ELK produces orthogonal bend points, (2) `crossing-detector.ts` finds all segment intersections, (3) `edge-renderer.ts` builds SVG `<path>` elements with rounded corners and crossing indicators.
- **Rationale:** Separating crossing detection from path rendering keeps each stage testable and under the line limit. Crossing detection is pure geometry (line-segment intersection); rendering is pure SVG construction.
- **Guidance:** The crossing detector uses the standard line-segment intersection formula. For N edges with M total segments, worst case is O(M^2) pairwise checks. For the target of 50 nodes this is well within budget. If future diagrams exceed 200 edges, consider a sweep-line algorithm -- but do not prematurely optimize.

**Atomic Sidecar Writes**
- **Decision:** Sidecar files are written atomically: write to a temp file in the same directory, then rename over the target. This prevents the file watcher from seeing a partially-written file.
- **Rationale:** The file watcher triggers on any modification. A non-atomic write could cause the app to read a truncated JSON file, triggering a parse error and briefly losing layout.
- **Guidance:** Implement in Rust (`file_io.rs`). Use `std::fs::write` to a temp file, then `std::fs::rename`. The rename is atomic on macOS (same filesystem). The file watcher's own writes must be filtered out to prevent feedback loops -- use a write-lock flag or compare the written content hash.

**File Watcher Feedback Loop Prevention**
- **Decision:** When the app writes a sidecar file (from EditController drag-end), the FileWatcher must not re-trigger a re-render for that write.
- **Rationale:** Without this, dragging a node would cause: drag-end -> write sidecar -> watcher fires -> re-read sidecar -> re-render. This wastes work and could cause visible flicker.
- **Guidance:** Maintain a `Set<string>` of paths currently being written. Before emitting a file-changed event, check this set. If the path is in the set, remove it and skip the event. The write command adds to the set before writing and the watcher checks/clears it.

**Multi-Window Architecture**
- **Decision:** Each `.mmd` file opens in its own native Tauri window. The Rust WindowManager maintains a `HashMap<PathBuf, String>` mapping file paths to window labels.
- **Rationale:** macOS convention for document-based apps. Users expect Cmd+W to close one diagram, not the whole app. Tauri 2.0 natively supports multi-window.
- **Guidance:** When a file is opened and a window already exists for that path, bring the existing window to the foreground using `window.set_focus()` rather than creating a duplicate. Window size: compute 80% of the primary display's work area (excluding menu bar/dock) and center the window. Use `tauri::Window::builder` with the calculated size.

**Window Sizing at 80% of Screen**
- **Decision:** New windows open at 80% of the primary screen's available work area, centered.
- **Rationale:** Explicit user requirement. Large enough to see diagram detail, small enough to see surrounding context.
- **Guidance:** In Rust, use `window.current_monitor()` to get the monitor's size and position. Compute `width = monitor.size.width * 0.8` and `height = monitor.size.height * 0.8`. Center with `x = monitor.position.x + monitor.size.width * 0.1` and `y = monitor.position.y + monitor.size.height * 0.1`. Account for the menu bar height on macOS.

**Error Banner (Non-Modal)**
- **Decision:** Syntax errors display as a non-modal banner fixed to the top of the viewport. The banner shows the error message in monospace text on an amber background. It auto-dismisses when the file is corrected and re-renders successfully.
- **Rationale:** The PRD specifies "error indicator (design TBD)". A banner is non-blocking (diagram remains visible beneath), clearly visible, and follows macOS conventions for transient notifications.
- **Guidance:** The banner is a simple DOM element, not a toast/notification framework. It sits in the document flow above the SVG viewport. Z-index ensures it floats above the diagram. No dismiss button -- it disappears automatically on successful re-render per FR-007 acceptance criteria.

**Debounce Strategy**
- **Decision:** File system events are debounced at 100ms in the Rust layer. Multiple events within the window collapse into a single `file-changed` event.
- **Rationale:** Editors and AI tools often trigger multiple FS events for a single save (write + rename, or multiple partial writes). 100ms is long enough to collapse these but short enough to feel instant.
- **Guidance:** Use a simple timer-based debounce in the watcher thread. On first event, start a 100ms timer. On subsequent events for the same path within the window, reset the timer. When the timer fires, emit the event. Implementation: Rust `tokio::time::sleep` or `std::thread::sleep` in a dedicated watcher thread.

**Diagram Type Handling**
- **Decision:** All Mermaid diagram types are supported from day one per PRD. The MermaidParser extracts whatever Mermaid renders. However, ELK layout and interactive editing are only meaningful for graph-based diagrams (flowcharts, state diagrams, class diagrams, ER diagrams). Non-graph types (sequence diagrams, Gantt charts, pie charts, git graphs) render using Mermaid's native layout as-is (no ELK pass) and editing mode is disabled.
- **Rationale:** ELK operates on graphs (nodes + edges). Sequence diagrams are not graphs; they are ordered message flows. Gantt charts are timelines. Forcing these through ELK would produce nonsensical output.
- **Guidance:** The `MermaidParser` returns a `diagramType` field. The rendering pipeline checks this field. For graph types (`flowchart`, `stateDiagram`, `classDiagram`, `erDiagram`), run the full pipeline (Mermaid parse -> ELK layout -> SvgCompositor). For non-graph types, display Mermaid's rendered SVG directly. The EditController checks `diagramType` and disables editing mode for non-graph types (the toggle is hidden or greyed out). The sidecar file is only relevant for graph types.

**Snapshot-Based Re-Rendering**
- **Decision:** When a file change triggers a re-render, the app immediately rasterizes the current SVG to a `<canvas>` snapshot image. The snapshot remains visible and interactive (pan/zoom) while the re-render pipeline runs in the background. A subtle spinner/indicator shows that a re-render is in progress. When the new SVG is ready, it replaces the snapshot with a crossfade.
- **Rationale:** Large diagrams may take noticeable time to re-parse, re-layout, and re-composite. Showing a blank screen or frozen UI during re-render degrades the experience, especially when an AI tool is writing rapid updates. The snapshot keeps the user productive.
- **Guidance:** Use `SVGElement.outerHTML` -> `new Blob()` -> `createImageBitmap()` -> `canvas.drawImage()` for fast rasterization. The re-render pipeline runs asynchronously. On completion, swap the canvas for the new SVG. The spinner is a small CSS-animated indicator in the corner of the viewport (not the error banner). If the re-render fails (syntax error), the snapshot stays visible and the error banner appears per the error handling flow.

**Background Grid Instead of Alignment Guides**
- **Decision:** In editing mode, display a faint background grid behind the diagram. No snap-to-grid behavior. No dynamic alignment guides.
- **Rationale:** A background grid provides enough visual reference for manual node positioning without the complexity of computing alignment relationships. This keeps the editing experience simple. If more precise alignment is needed later, snap-to-grid or alignment guides can be added incrementally.
- **Guidance:** The grid is a CSS background pattern on the SVG container (`background-image: repeating-linear-gradient` or an SVG `<pattern>`). Grid spacing: 20px. Grid color: very faint gray (`rgba(0,0,0,0.05)` on light background). The grid scales with zoom (grid lines stay fixed in diagram coordinate space, not screen space). The grid is only visible in editing mode.

**Multi-Touch Viewport Navigation**
- **Decision:** Pinch-to-zoom and two-finger pan are the primary navigation methods. Keyboard shortcuts are secondary.
- **Rationale:** macOS users with trackpads or Magic Mouse expect gesture-based navigation. This is the natural interaction model for a visual tool.
- **Guidance:** macOS sends trackpad/Magic Mouse gestures as `wheel` events. Pinch-to-zoom arrives as `wheel` with `ctrlKey: true` and `deltaY` as the zoom delta. Two-finger scroll arrives as plain `wheel` with `deltaX`/`deltaY`. Prevent the browser's default zoom behavior with `event.preventDefault()` on ctrl+wheel. See ViewportController interface for the mapping.

**State Management**
- **Decision:** No state management library. Application state is minimal and scoped per window: current file path, current ParsedGraph, current LayoutResult, current SVG, editing mode flag, error state.
- **Rationale:** Each window is an independent document viewer. There is no shared state between windows. The state is small and changes in response to a linear pipeline (file change -> parse -> layout -> render). A reactive framework or store would add complexity without benefit.
- **Guidance:** State lives in a plain TypeScript object in `main.ts` per window. Pipeline stages are pure functions that take input and return output. Side effects (file reads, DOM updates) happen only in the orchestration layer (`main.ts`).

---

## 7. Open Questions & PRD Gaps

All questions have been resolved with the tech lead.

| # | Question | Resolution |
| :--- | :--- | :--- |
| 1 | PRD says "error indicator (design TBD)" for FR-007. | **Resolved.** Non-modal amber banner at top of viewport, auto-dismisses on fix. Monospace text for error details. |
| 2 | PRD does not specify behavior when a `.mmd` file is deleted while the app has it open. | **Resolved.** Show error banner "File has been deleted" and stop watching. Last valid render remains visible. Window stays open. |
| 3 | PRD does not specify keyboard shortcuts or viewport navigation. | **Resolved.** `Cmd+E` for edit mode toggle, `Cmd+0` for fit-to-window, `Cmd++`/`Cmd+-` for zoom. Primary navigation is multi-touch: pinch-to-zoom, two-finger pan. Added as PRD FR-008. |
| 4 | PRD does not specify whether non-graph diagrams support editing mode. | **Resolved.** Editing mode disabled for non-graph diagram types (sequence, Gantt, pie, git graph). ELK layout only applies to graph-based diagrams. |
| 5 | PRD specifies "up to 50 nodes" for 1-second render but no maximum diagram size. | **Resolved.** No hard limit. Target: 50 nodes < 1s, 200 nodes < 3s. Beyond that, best-effort. During re-render, show a rasterized snapshot of the previous diagram (interactive for pan/zoom) with a progress indicator. User is never blocked by a slow render. |
| 6 | PRD does not specify what happens when a file is not valid UTF-8. | **Resolved.** Show error banner "File is not valid UTF-8 text" with no cached render. |
| 7 | PRD FR-006 specifies "alignment guides" but does not define behavior. | **Resolved.** Replaced with a faint background grid (20px spacing, very low opacity) visible only in editing mode. No snap-to-grid, no dynamic alignment guides. Keeps it simple; can revisit if needed. |

---

## 8. Risk Register

| Risk | Likelihood | Impact | Mitigation |
| :--- | :--- | :--- | :--- |
| Mermaid.js DOM structure changes between versions, breaking graph extraction | Medium | High | Pin Mermaid.js version. Isolate all DOM queries in `graph-extractor.ts`. Add integration tests that parse known `.mmd` files and assert extracted node/edge counts. Run tests before upgrading. Additionally, add a weekly CI job that installs `mermaid@latest`, runs the extraction tests against it, and opens a warning issue if any fail. This provides early detection of breaking changes even when we are not actively upgrading. |
| ELK's fixed-position constraint does not work as expected for mixed fixed/auto layouts | Low | High | Prototype this integration first (spike task). ELK documentation confirms `org.eclipse.elk.noLayout` is supported. Build a minimal test with 3 fixed + 3 auto nodes before committing to the architecture. |
| Edge crossing detection is O(M^2) and becomes slow for large diagrams | Low | Medium | For 50 nodes, M is typically < 100 segments, so < 10K comparisons (sub-millisecond). Monitor performance. If needed, implement sweep-line algorithm (O(M log M)) as an optimization task. |
| Real-time edge re-routing during drag is too slow for responsive feel | Medium | Medium | Pre-compute: when drag starts, fix all nodes and only ask ELK to re-route edges. ELK edge-only routing is significantly faster than full layout. If still too slow, fall back to simplified straight-line edges during drag with full re-route on drop. |
| Tauri 2.0 multi-window API has rough edges or platform-specific bugs on macOS | Medium | Medium | Tauri 2.0 is stable release. Test multi-window early (spike task). If issues arise, fall back to tab-based model within a single window (architectural change is contained to WindowManager). |
| Mermaid.js bundle size pushes app beyond the 15MB PRD constraint | Low | Low | Mermaid.js is ~2MB minified. Tauri app shell is ~3-5MB. ELK is ~500KB. Total should be well under 15MB. Monitor bundle size in CI with a size-limit check. |
| File watcher feedback loop causes infinite re-render cycle | Medium | High | Write-lock mechanism (see Key Implementation Decisions). Integration test: write sidecar, assert no re-render triggered. |
| Mermaid.render() requires a visible DOM container; hidden rendering may fail in some diagram types | Medium | Medium | Test all diagram types with off-screen rendering during spike. If some types require visibility, use a 1x1px off-screen positioned container rather than `display:none`. |
