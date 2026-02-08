import type { PositionedNode, ParsedEdge, RoutedEdge } from '@shared/types';
import { computeEdgeOnlyLayout } from '@layout-engine/edge-rerouter';
import { patchEdgePaths } from '@svg-compositor/edge-patcher';

type GetNodesFn = () => PositionedNode[];
type GetEdgesFn = () => ParsedEdge[];
type GetSvgFn = () => SVGElement | null;

let rafId: number | null = null;
let getNodes: GetNodesFn | null = null;
let getEdges: GetEdgesFn | null = null;
let getSvg: GetSvgFn | null = null;

export function setRerouteDeps(nodesFn: GetNodesFn, edgesFn: GetEdgesFn, svgFn: GetSvgFn): void {
  getNodes = nodesFn;
  getEdges = edgesFn;
  getSvg = svgFn;
}

export function clearRerouteDeps(): void {
  cancelPending();
  getNodes = null;
  getEdges = null;
  getSvg = null;
}

export function scheduleEdgeReroute(): void {
  if (rafId !== null) return;
  rafId = requestAnimationFrame(executeReroute);
}

export function cancelPending(): void {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

async function executeReroute(): Promise<void> {
  rafId = null;
  if (!getNodes || !getEdges || !getSvg) return;

  const svg = getSvg();
  if (!svg) return;

  try {
    const edges: RoutedEdge[] = await computeEdgeOnlyLayout(getNodes(), getEdges());
    patchEdgePaths(svg, edges);
  } catch {
    // Silently skip failed re-routes during drag
  }
}
