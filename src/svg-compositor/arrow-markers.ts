const SVG_NS = 'http://www.w3.org/2000/svg';

export function createArrowMarker(arrowType: string): SVGMarkerElement {
  const marker = createSvgElement('marker') as SVGMarkerElement;
  marker.setAttribute('id', arrowType);
  marker.setAttribute('markerWidth', '10');
  marker.setAttribute('markerHeight', '10');
  marker.setAttribute('refX', '9');
  marker.setAttribute('refY', '5');
  marker.setAttribute('orient', 'auto');
  const shape = buildArrowShape(arrowType);
  marker.appendChild(shape);
  return marker;
}

function buildArrowShape(arrowType: string): SVGElement {
  if (arrowType === 'arrow_circle') {
    return buildCircleShape();
  }
  if (arrowType === 'arrow_cross') {
    return buildCrossShape();
  }
  return buildTriangleShape(arrowType);
}

function buildTriangleShape(arrowType: string): SVGElement {
  const polygon = createSvgElement('polygon');
  polygon.setAttribute('points', '0,0 10,5 0,10');
  const fill = arrowType === 'arrow_open' ? 'none' : 'currentColor';
  polygon.setAttribute('fill', fill);
  polygon.setAttribute('stroke', 'currentColor');
  return polygon;
}

function buildCircleShape(): SVGElement {
  const circle = createSvgElement('circle');
  circle.setAttribute('cx', '5');
  circle.setAttribute('cy', '5');
  circle.setAttribute('r', '4');
  circle.setAttribute('fill', 'currentColor');
  return circle;
}

function buildCrossShape(): SVGElement {
  const path = createSvgElement('path');
  path.setAttribute('d', 'M 2,2 L 8,8 M 8,2 L 2,8');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '2');
  return path;
}

function createSvgElement(tag: string): SVGElement {
  return document.createElementNS(SVG_NS, tag);
}
