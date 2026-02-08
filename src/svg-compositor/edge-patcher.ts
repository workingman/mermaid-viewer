import type { RoutedEdge } from '@shared/types';
import { buildEdgeSvgPath } from './path-builder';

export function patchEdgePaths(svgRoot: SVGElement, routedEdges: RoutedEdge[]): void {
  const edgeLayer = svgRoot.querySelector('.edge-layer');
  if (!edgeLayer) return;

  const pathEls = edgeLayer.querySelectorAll('path');
  const pathMap = buildPathMap(pathEls);

  for (const edge of routedEdges) {
    const pathEl = pathMap.get(edge.id);
    if (!pathEl) continue;
    const d = buildEdgeSvgPath(edge.sections, []);
    pathEl.setAttribute('d', d);
  }
}

function buildPathMap(pathEls: NodeListOf<SVGPathElement>): Map<string, SVGPathElement> {
  const map = new Map<string, SVGPathElement>();
  pathEls.forEach((el, idx) => {
    const id = el.closest('g[data-edge-id]')?.getAttribute('data-edge-id');
    if (id) {
      map.set(id, el);
    } else {
      map.set(String(idx), el);
    }
  });
  return map;
}
