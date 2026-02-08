import type { RoutedEdge, EdgeCrossing, ParsedEdge, Point } from '@shared/types';
import { buildEdgeSvgPath } from './path-builder';

export { buildEdgeSvgPath } from './path-builder';
export { createArrowMarker } from './arrow-markers';

const SVG_NS = 'http://www.w3.org/2000/svg';

export function renderEdgePath(
  edge: RoutedEdge,
  crossings: EdgeCrossing[],
  parsedEdge: ParsedEdge,
): SVGGElement {
  const group = createSvgElement('g') as SVGGElement;
  const edgeCrossings = filterCrossingsForEdge(crossings, edge.id);
  const path = buildEdgeSvgPath(edge.sections, edgeCrossings);
  const pathEl = createPathElement(path, parsedEdge);
  group.appendChild(pathEl);
  return group;
}

function filterCrossingsForEdge(crossings: EdgeCrossing[], edgeId: string): Point[] {
  return crossings.filter((c) => c.edge1Id === edgeId || c.edge2Id === edgeId).map((c) => c.point);
}

function createPathElement(d: string, parsedEdge: ParsedEdge): SVGPathElement {
  const pathEl = createSvgElement('path') as SVGPathElement;
  pathEl.setAttribute('d', d);
  pathEl.setAttribute('fill', 'none');
  pathEl.setAttribute('stroke', 'currentColor');
  applyLineStyle(pathEl, parsedEdge.lineStyle);
  applyArrowMarker(pathEl, parsedEdge.arrowType);
  return pathEl;
}

function applyLineStyle(pathEl: SVGPathElement, lineStyle: string): void {
  if (lineStyle === 'dotted') {
    pathEl.setAttribute('stroke-dasharray', '5,5');
  } else if (lineStyle === 'thick') {
    pathEl.setAttribute('stroke-width', '3');
  }
}

function applyArrowMarker(pathEl: SVGPathElement, arrowType: string): void {
  pathEl.setAttribute('marker-end', `url(#${arrowType})`);
}

function createSvgElement(tag: string): SVGElement {
  return document.createElementNS(SVG_NS, tag);
}
