import ELK from 'elkjs/lib/elk.bundled.js';
import type { MergedGraph, LayoutResult, PositionedNode, RoutedEdge } from '@shared/types';
import { LayoutError } from '@shared/types';
import { toElkGraph } from './elk-adapter';

const elk = new ELK();

export async function computeLayout(graph: MergedGraph): Promise<LayoutResult> {
  const elkInput = toElkGraph(graph);
  try {
    const result = await elk.layout(elkInput);
    return {
      positionedNodes: mapNodes(result.children ?? []),
      routedEdges: mapEdges(result.edges ?? []),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new LayoutError(`ELK layout failed: ${message}`);
  }
}

function mapNodes(
  children: Array<{ id: string; x?: number; y?: number; width?: number; height?: number }>,
): PositionedNode[] {
  return children.map((child) => ({
    id: child.id,
    x: child.x ?? 0,
    y: child.y ?? 0,
    width: child.width ?? 0,
    height: child.height ?? 0,
  }));
}

function mapEdges(
  edges: Array<{
    id: string;
    sections?: Array<{
      startPoint: { x: number; y: number };
      endPoint: { x: number; y: number };
      bendPoints?: Array<{ x: number; y: number }>;
    }>;
  }>,
): RoutedEdge[] {
  return edges.map((edge) => ({
    id: edge.id,
    sections: (edge.sections ?? []).map((s) => ({
      startPoint: s.startPoint,
      endPoint: s.endPoint,
      bendPoints: s.bendPoints,
    })),
  }));
}
