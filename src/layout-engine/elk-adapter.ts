import type {
  MergedGraph,
  MergedNode,
  ELKInputGraph,
  ELKNode,
  ELKEdge,
  ParsedEdge,
} from '@shared/types';
import { ELK_OPTIONS } from './elk-config';

export function toElkGraph(graph: MergedGraph): ELKInputGraph {
  return {
    id: 'root',
    layoutOptions: { ...ELK_OPTIONS },
    children: graph.nodes.map(toElkNode),
    edges: graph.edges.map(toElkEdge),
  };
}

function toElkNode(node: MergedNode): ELKNode {
  const elkNode: ELKNode = {
    id: node.id,
    width: node.width,
    height: node.height,
  };
  if (node.hintX !== undefined && node.hintY !== undefined) {
    return applyHints(elkNode, node.hintX, node.hintY);
  }
  return elkNode;
}

function applyHints(
  elkNode: ELKNode,
  hintX: number,
  hintY: number,
): ELKNode {
  return {
    ...elkNode,
    x: hintX,
    y: hintY,
    layoutOptions: {
      'elk.position': `(${hintX},${hintY})`,
      'org.eclipse.elk.noLayout': 'true',
    },
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
