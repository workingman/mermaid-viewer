import type {
  SidecarData,
  ParsedGraph,
  MergedGraph,
  MergedNode,
  PositionedNode,
} from '@shared/types';
import { validateSidecar } from './sidecar-schema';

export function loadSidecar(sidecarJson: string | null): SidecarData | null {
  if (sidecarJson === null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(sidecarJson);
  } catch {
    console.warn('Sidecar: malformed JSON');
    return null;
  }

  const validated = validateSidecar(parsed);
  if (validated === null) {
    console.warn('Sidecar: schema validation failed');
    return null;
  }

  return validated;
}

export function mergeSidecarIntoGraph(
  graph: ParsedGraph,
  sidecar: SidecarData | null,
): MergedGraph {
  const nodes: MergedNode[] = graph.nodes.map((node) => {
    const hint = sidecar?.nodes[node.id];
    if (hint === undefined) return { ...node };
    return { ...node, hintX: hint.x, hintY: hint.y };
  });
  return { nodes, edges: graph.edges, diagramType: graph.diagramType };
}

export function buildSidecarFromPositions(
  nodes: PositionedNode[],
): SidecarData {
  const entries: Record<string, { x: number; y: number }> = {};
  for (const node of nodes) {
    entries[node.id] = { x: node.x, y: node.y };
  }
  return { version: 1, nodes: entries };
}
