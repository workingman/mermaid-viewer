import type { ParsedGraph, ParsedNode, ParsedEdge } from '@shared/types';

interface ExtractionResult {
  graph: ParsedGraph;
  nodeSvgFragments: Map<string, string>;
}

function parseNodeId(rawId: string): string {
  const parts = rawId.split('-');
  if (parts.length >= 2) {
    return parts.slice(1, -1).join('-') || parts[1];
  }
  return rawId;
}

function detectShape(nodeEl: Element): string {
  if (nodeEl.querySelector('polygon')) return 'diamond';
  if (nodeEl.querySelector('circle')) return 'circle';
  if (nodeEl.querySelector('ellipse')) return 'ellipse';
  return 'rect';
}

function extractLabel(nodeEl: Element): string {
  const textEl = nodeEl.querySelector('text');
  return textEl?.textContent?.trim() ?? '';
}

function extractNode(nodeEl: Element): ParsedNode {
  const rawId = nodeEl.getAttribute('id') ?? '';
  const id = parseNodeId(rawId);
  const label = extractLabel(nodeEl);
  const shape = detectShape(nodeEl);
  const bbox = getBounds(nodeEl);

  return {
    id,
    label,
    shape,
    width: bbox.width,
    height: bbox.height,
    svgFragment: nodeEl.outerHTML,
  };
}

function getBounds(el: Element): { width: number; height: number } {
  if (typeof (el as SVGGraphicsElement).getBBox === 'function') {
    const box = (el as SVGGraphicsElement).getBBox();
    return { width: box.width, height: box.height };
  }
  return { width: 0, height: 0 };
}

function buildEdgeId(sourceId: string, targetId: string, counts: Map<string, number>): string {
  const key = `${sourceId}->${targetId}`;
  const idx = counts.get(key) ?? 0;
  counts.set(key, idx + 1);
  return `${key}:${idx}`;
}

function extractEdgeLabel(edgePathEl: Element): string | null {
  const parent = edgePathEl.parentElement;
  if (!parent) return null;
  const labelEl = parent.querySelector('.edgeLabel');
  const text = labelEl?.textContent?.trim();
  return text || null;
}

function detectArrowType(edgePathEl: Element): string {
  const path = edgePathEl.querySelector('path');
  const marker = path?.getAttribute('marker-end') ?? '';
  if (marker.includes('point')) return 'arrow_point';
  if (marker.includes('cross')) return 'arrow_cross';
  if (marker.includes('circle')) return 'arrow_circle';
  return 'arrow_point';
}

function detectLineStyle(edgePathEl: Element): 'solid' | 'dotted' | 'thick' {
  const path = edgePathEl.querySelector('path');
  const dasharray = path?.getAttribute('stroke-dasharray') ?? '';
  if (dasharray && dasharray !== 'none') return 'dotted';
  const strokeWidth = path?.getAttribute('stroke-width') ?? '';
  if (parseFloat(strokeWidth) > 2) return 'thick';
  return 'solid';
}

function parseEdgeIds(edgePathEl: Element): {
  sourceId: string;
  targetId: string;
} {
  const id = edgePathEl.getAttribute('id') ?? '';
  const match = id.match(/L-(.+?)-(.+?)(?:-\d+)?$/);
  if (match) return { sourceId: match[1], targetId: match[2] };
  const classes = edgePathEl.getAttribute('class') ?? '';
  const classMatch = classes.match(/LS-(.+?)\s+LE-(.+?)(?:\s|$)/);
  if (classMatch) return { sourceId: classMatch[1], targetId: classMatch[2] };
  return { sourceId: 'unknown', targetId: 'unknown' };
}

export function extract(svgElement: Element, diagramType: string): ExtractionResult {
  const nodes = extractNodes(svgElement);
  const fragments = buildFragmentMap(nodes);
  const edges = extractEdges(svgElement);

  return {
    graph: { nodes, edges, diagramType },
    nodeSvgFragments: fragments,
  };
}

function extractNodes(svgElement: Element): ParsedNode[] {
  const nodeEls = svgElement.querySelectorAll('.node');
  return Array.from(nodeEls).map(extractNode);
}

function buildFragmentMap(nodes: ParsedNode[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const node of nodes) {
    map.set(node.id, node.svgFragment);
  }
  return map;
}

function extractEdges(svgElement: Element): ParsedEdge[] {
  const edgePathEls = svgElement.querySelectorAll('.edgePath');
  const counts = new Map<string, number>();

  return Array.from(edgePathEls).map((el) => {
    const { sourceId, targetId } = parseEdgeIds(el);
    const id = buildEdgeId(sourceId, targetId, counts);
    const label = extractEdgeLabel(el);
    const arrowType = detectArrowType(el);
    const lineStyle = detectLineStyle(el);
    return { id, sourceId, targetId, label, arrowType, lineStyle };
  });
}
