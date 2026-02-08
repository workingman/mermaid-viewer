import type { LayoutResult, ParsedEdge, PositionedNode } from '@shared/types';
import { computeEdgeCrossings } from './crossing-detector';
import { renderEdgePath, createArrowMarker } from './edge-renderer';

const SVG_NS = 'http://www.w3.org/2000/svg';
const VIEWBOX_PADDING = 40;
const ARROW_TYPES = ['arrow_point', 'arrow_open', 'arrow_circle', 'arrow_cross'];

export function compose(
  layout: LayoutResult,
  svgFragments: Map<string, string>,
  edges: ParsedEdge[],
): SVGSVGElement {
  const svg = createRootSvg(layout.positionedNodes);
  svg.appendChild(buildDefs());
  svg.appendChild(buildEdgeLayer(layout, edges));
  svg.appendChild(buildNodeLayer(layout, svgFragments));
  return svg;
}

function createRootSvg(nodes: PositionedNode[]): SVGSVGElement {
  const svg = createSvgElement('svg') as SVGSVGElement;
  const viewBox = computeViewBox(nodes);
  svg.setAttribute('viewBox', viewBox);
  return svg;
}

function computeViewBox(nodes: PositionedNode[]): string {
  if (nodes.length === 0) {
    return '0 0 100 100';
  }
  const bounds = computeBounds(nodes);
  return [
    bounds.minX - VIEWBOX_PADDING,
    bounds.minY - VIEWBOX_PADDING,
    bounds.maxX - bounds.minX + VIEWBOX_PADDING * 2,
    bounds.maxY - bounds.minY + VIEWBOX_PADDING * 2,
  ].join(' ');
}

function computeBounds(nodes: PositionedNode[]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const node of nodes) {
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x + node.width);
    maxY = Math.max(maxY, node.y + node.height);
  }
  return { minX, minY, maxX, maxY };
}

function buildDefs(): SVGDefsElement {
  const defs = createSvgElement('defs') as SVGDefsElement;
  for (const type of ARROW_TYPES) {
    defs.appendChild(createArrowMarker(type));
  }
  return defs;
}

function buildEdgeLayer(layout: LayoutResult, edges: ParsedEdge[]): SVGGElement {
  const group = createSvgElement('g') as SVGGElement;
  group.setAttribute('class', 'edge-layer');
  const crossings = computeEdgeCrossings(layout.routedEdges);
  const edgeMap = buildEdgeMap(edges);
  for (const routedEdge of layout.routedEdges) {
    const parsedEdge = edgeMap.get(routedEdge.id);
    if (!parsedEdge) continue;
    group.appendChild(renderEdgePath(routedEdge, crossings, parsedEdge));
  }
  return group;
}

function buildEdgeMap(edges: ParsedEdge[]): Map<string, ParsedEdge> {
  const map = new Map<string, ParsedEdge>();
  for (const edge of edges) {
    map.set(edge.id, edge);
  }
  return map;
}

function buildNodeLayer(layout: LayoutResult, svgFragments: Map<string, string>): SVGGElement {
  const group = createSvgElement('g') as SVGGElement;
  group.setAttribute('class', 'node-layer');
  for (const node of layout.positionedNodes) {
    const fragment = svgFragments.get(node.id);
    const nodeGroup = fragment ? wrapFragment(node, fragment) : buildPlaceholder(node);
    group.appendChild(nodeGroup);
  }
  return group;
}

function wrapFragment(node: PositionedNode, fragment: string): SVGGElement {
  const group = createSvgElement('g') as SVGGElement;
  group.setAttribute('transform', `translate(${node.x},${node.y})`);
  group.innerHTML = fragment;
  return group;
}

function buildPlaceholder(node: PositionedNode): SVGGElement {
  const group = createSvgElement('g') as SVGGElement;
  group.setAttribute('transform', `translate(${node.x},${node.y})`);
  const rect = createSvgElement('rect');
  rect.setAttribute('width', String(node.width));
  rect.setAttribute('height', String(node.height));
  rect.setAttribute('fill', 'none');
  rect.setAttribute('stroke', '#999');
  rect.setAttribute('stroke-dasharray', '4,4');
  group.appendChild(rect);
  const text = createSvgElement('text');
  text.setAttribute('x', String(node.width / 2));
  text.setAttribute('y', String(node.height / 2));
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('dominant-baseline', 'central');
  text.setAttribute('fill', '#999');
  text.textContent = node.id;
  group.appendChild(text);
  return group;
}

function createSvgElement(tag: string): SVGElement {
  return document.createElementNS(SVG_NS, tag);
}
