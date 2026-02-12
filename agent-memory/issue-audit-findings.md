# Issue Audit Findings (2026-02-08)

Audit of parents #1-#8 sub-issue coverage against PRD/TDD. Parents #1-#2
are kept (solid). Parents #3-#8 closed for regeneration.

## Parents #1-#2: Kept (minor gaps, acceptable)

### Parent #1 — Scaffolding & Shared Types (#9-#12)
- Minor: `.mmd` file association config not in #9 AC (covered by #17 under parent #2)
- Minor: Rust `WindowState` struct not covered (can live in WindowManager issue)
- Minor: ELK config constants arguably belong with LayoutEngine, not here

### Parent #2 — Rust Backend (#13-#17)
- Minor: File deletion detection (TDD Open Q#2) not in any sub-issue AC
- Minor: Watcher teardown on window close split between #14 and #16 ambiguously
- Note: #17 covers `.mmd` file association that #1 was missing

## Parents #3-#8: Closed — Key Gaps to Fix on Regeneration

### Parent #3 — Mermaid Parsing & Graph Extraction
- Shared type ownership (`src/shared/types.ts`) not explicitly assigned
- MermaidParser + GraphExtractor integration wiring unowned after both complete
- ER diagram missing from #19 test coverage
- Overall: 3 sub-issues is probably right count, just needs tighter ACs

### Parent #4 — ELK Layout & SVG Composition
- **SvgCompositor entirely missing** — no sub-issue for the core rendering component
  (edge-renderer, crossing-detector, SVG composition)
- **SidecarManager merge logic missing** (only schema/validation was covered)
- #22 (ViewportController) and #23 (ErrorBoundary) were misassigned here — belong under #6
- Shared TypeScript types not covered
- This parent likely needs 6+ sub-issues (will require 2 invocations)

### Parent #5 — Sidecar File Support
- #26 (error banner CSS) misassigned here — belongs under error handling parent
- ELK fixed-position constraint integration for sidecar hints not covered
- Cross-parent dependencies on #13 (write_sidecar) and #15 (feedback loop) undocumented
- Frontend sidecar path computation not specified in #29

### Parent #6 — Viewport Navigation & Error Handling
- **ALL 6 sub-issues (#30-#35) belonged to other parents** (editing mode + SVG composition)
- Actual sub-issues (#22, #23, #26) existed but were unlinked
- Missing: scroll indicators, file deletion error, non-UTF-8 error, first-open-with-error
- Missing: snapshot interactivity (pan/zoom on canvas during re-render)

### Parent #7 — Layout Editing Mode
- **Zero editing-mode sub-issues existed** — #36/#37 were orchestration layer duplicates
- Needs: EditController, background grid, sidecar persistence on drag-end,
  real-time edge re-routing, edit-mode CSS
- Likely needs 4-5 sub-issues

### Parent #8 — E2E Wiring & Integration Tests
- Orchestration layer (#37) not linked as sub-issue
- Missing: file-change re-render integration test, error handling integration test,
  non-graph diagram type e2e test, race condition / pipeline sequencing test
- #40 overlaps with #20 (diagram type detection boundary unclear)

## Parent Scope Assignments (for regeneration)

When regenerating, assign these PRD/TDD scopes to each parent:

| Parent | PRD FRs | TDD Sections |
|--------|---------|-------------|
| #3 Parsing | FR-002 (all types), FR-007 (parse errors) | S2: MermaidParser, GraphExtractor; S3: ParsedGraph/Node/Edge; S4: parse interfaces |
| #4 ELK/SVG | FR-003 (edge quality) | S2: LayoutEngine, SvgCompositor; S3: PositionedNode, RoutedEdge, LayoutResult; S4: layout+compose interfaces; S6: edge rendering pipeline |
| #5 Sidecar | FR-005 (sidecar support) | S2: SidecarManager; S3: SidecarData, MergedGraph; S4: sidecar interfaces; S6: ELK fixed-position, feedback loop |
| #6 Viewport/Errors | FR-007 (errors), FR-008 (viewport) | S2: ViewportController, ErrorBoundary; S4: viewport+error interfaces; S6: snapshot re-rendering, multi-touch; S7: Q2 (file deleted), Q6 (non-UTF-8) |
| #7 Editing | FR-006 (editing mode) | S2: EditController; S4: edit interfaces; S6: background grid, real-time re-routing; S7: Q7 (grid vs guides) |
| #8 Wiring/Tests | FR-001 thru FR-008 (integration) | S2: data flow (steps 1-13); S4: main.ts orchestration; S6: state management, diagram type handling, pipeline sequencing |
