/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { compose } from './svg-compositor';
import type { LayoutResult, ParsedEdge } from '@shared/types';

function makeLayout(overrides: Partial<LayoutResult> = {}): LayoutResult {
  return {
    positionedNodes: [
      { id: 'A', x: 0, y: 0, width: 100, height: 50 },
      { id: 'B', x: 0, y: 150, width: 100, height: 50 },
    ],
    routedEdges: [
      {
        id: 'e1',
        sections: [{ startPoint: { x: 50, y: 50 }, endPoint: { x: 50, y: 150 } }],
      },
    ],
    ...overrides,
  };
}

function makeEdges(): ParsedEdge[] {
  return [
    {
      id: 'e1',
      sourceId: 'A',
      targetId: 'B',
      label: null,
      arrowType: 'arrow_point',
      lineStyle: 'solid',
    },
  ];
}

function makeFragments(): Map<string, string> {
  return new Map([
    ['A', '<rect width="100" height="50"/>'],
    ['B', '<rect width="100" height="50"/>'],
  ]);
}

describe('compose', () => {
  it('creates SVG with correct node count', () => {
    const svg = compose(makeLayout(), makeFragments(), makeEdges());
    const nodeLayer = svg.querySelector('.node-layer');
    expect(nodeLayer).not.toBeNull();
    expect(nodeLayer!.children).toHaveLength(2);
  });

  it('sets viewBox with padding', () => {
    const svg = compose(makeLayout(), makeFragments(), makeEdges());
    const viewBox = svg.getAttribute('viewBox');
    expect(viewBox).toBe('-40 -40 180 280');
  });

  it('renders placeholder for missing fragments', () => {
    const fragments = new Map([['A', '<rect/>']]);
    const svg = compose(makeLayout(), fragments, makeEdges());
    const nodeLayer = svg.querySelector('.node-layer')!;
    const placeholderRect = nodeLayer.children[1].querySelector('rect');
    expect(placeholderRect!.getAttribute('stroke-dasharray')).toBe('4,4');
    const placeholderText = nodeLayer.children[1].querySelector('text');
    expect(placeholderText!.textContent).toBe('B');
  });

  it('renders edge paths in edge layer', () => {
    const svg = compose(makeLayout(), makeFragments(), makeEdges());
    const edgeLayer = svg.querySelector('.edge-layer');
    expect(edgeLayer).not.toBeNull();
    expect(edgeLayer!.querySelectorAll('path')).toHaveLength(1);
  });

  it('places edge layer before node layer', () => {
    const svg = compose(makeLayout(), makeFragments(), makeEdges());
    const layers = svg.querySelectorAll('g[class]');
    expect(layers[0].getAttribute('class')).toBe('edge-layer');
    expect(layers[1].getAttribute('class')).toBe('node-layer');
  });

  it('includes arrowhead defs', () => {
    const svg = compose(makeLayout(), makeFragments(), makeEdges());
    const defs = svg.querySelector('defs');
    expect(defs).not.toBeNull();
    const markers = defs!.querySelectorAll('marker');
    expect(markers.length).toBeGreaterThanOrEqual(4);
  });

  it('handles empty layout', () => {
    const empty: LayoutResult = { positionedNodes: [], routedEdges: [] };
    const svg = compose(empty, new Map(), []);
    expect(svg.getAttribute('viewBox')).toBe('0 0 100 100');
  });
});
