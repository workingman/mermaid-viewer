import ELK from 'elkjs/lib/elk.bundled.js';
import type { PositionedNode, ParsedEdge, RoutedEdge, ELKNode, ELKEdge } from '@shared/types';
import { LayoutError } from '@shared/types';
import { ELK_OPTIONS } from './elk-config';

const elk = new ELK();

export async function computeEdgeOnlyLayout(
  nodes: PositionedNode[],
  edges: ParsedEdge[],
): Promise<RoutedEdge[]> {
  const elkInput = {
    id: 'root' as const,
    layoutOptions: { ...ELK_OPTIONS },
    children: nodes.map(toFixedElkNode),
    edges: edges.map(toElkEdge),
  };

  try {
    const result = await elk.layout(elkInput);
    return mapEdges(result.edges ?? []);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new LayoutError(`Edge-only layout failed: ${msg}`);
  }
}

function toFixedElkNode(node: PositionedNode): ELKNode {
  return {
    id: node.id,
    width: node.width,
    height: node.height,
    x: node.x,
    y: node.y,
    layoutOptions: { 'org.eclipse.elk.noLayout': 'true' },
  };
}

function toElkEdge(edge: ParsedEdge): ELKEdge {
  const elkEdge: ELKEdge = {
    id: edge.id,
    sources: [edge.sourceId],
    targets: [edge.targetId],
  };
  if (edge.label) {
    elkEdge.labels = [{ text: edge.label }];
  }
  return elkEdge;
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
