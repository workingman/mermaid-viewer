/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { renderEdgePath, buildEdgeSvgPath, createArrowMarker } from './edge-renderer';
import type { RoutedEdge, ParsedEdge, EdgeCrossing } from '@shared/types';

function makeParsedEdge(overrides: Partial<ParsedEdge> = {}): ParsedEdge {
  return {
    id: 'e1',
    sourceId: 'A',
    targetId: 'B',
    label: null,
    arrowType: 'arrow_point',
    lineStyle: 'solid',
    ...overrides,
  };
}

describe('buildEdgeSvgPath', () => {
  it('builds straight line path', () => {
    const sections = [{ startPoint: { x: 0, y: 0 }, endPoint: { x: 100, y: 0 } }];
    const path = buildEdgeSvgPath(sections, []);
    expect(path).toBe('M 0 0 L 100 0');
  });

  it('builds rounded corner at bend point', () => {
    const sections = [
      {
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 100, y: 100 },
        bendPoints: [{ x: 100, y: 0 }],
      },
    ];
    const path = buildEdgeSvgPath(sections, []);
    expect(path).toContain('M 0 0');
    expect(path).toContain('Q');
    expect(path).toContain('L 100 100');
  });

  it('inserts gap at crossing point', () => {
    const sections = [{ startPoint: { x: 0, y: 0 }, endPoint: { x: 100, y: 0 } }];
    const crossings = [{ x: 50, y: 0 }];
    const path = buildEdgeSvgPath(sections, crossings);
    expect(path).toContain('M');
    expect(path.match(/M/g)!.length).toBeGreaterThan(1);
  });
});

describe('renderEdgePath', () => {
  it('returns SVG group with path element', () => {
    const edge: RoutedEdge = {
      id: 'e1',
      sections: [{ startPoint: { x: 0, y: 0 }, endPoint: { x: 50, y: 50 } }],
    };
    const group = renderEdgePath(edge, [], makeParsedEdge());
    expect(group.tagName).toBe('g');
    const path = group.querySelector('path');
    expect(path).not.toBeNull();
    expect(path!.getAttribute('marker-end')).toBe('url(#arrow_point)');
  });

  it('applies dotted line style', () => {
    const edge: RoutedEdge = {
      id: 'e1',
      sections: [{ startPoint: { x: 0, y: 0 }, endPoint: { x: 50, y: 0 } }],
    };
    const parsed = makeParsedEdge({ lineStyle: 'dotted' });
    const group = renderEdgePath(edge, [], parsed);
    const path = group.querySelector('path')!;
    expect(path.getAttribute('stroke-dasharray')).toBe('5,5');
  });

  it('applies thick line style', () => {
    const edge: RoutedEdge = {
      id: 'e1',
      sections: [{ startPoint: { x: 0, y: 0 }, endPoint: { x: 50, y: 0 } }],
    };
    const parsed = makeParsedEdge({ lineStyle: 'thick' });
    const group = renderEdgePath(edge, [], parsed);
    const path = group.querySelector('path')!;
    expect(path.getAttribute('stroke-width')).toBe('3');
  });

  it('filters crossings to only this edge', () => {
    const edge: RoutedEdge = {
      id: 'e1',
      sections: [{ startPoint: { x: 0, y: 0 }, endPoint: { x: 100, y: 0 } }],
    };
    const crossings: EdgeCrossing[] = [
      { point: { x: 50, y: 0 }, edge1Id: 'e1', edge2Id: 'e2' },
      { point: { x: 75, y: 50 }, edge1Id: 'e3', edge2Id: 'e4' },
    ];
    const group = renderEdgePath(edge, crossings, makeParsedEdge());
    const d = group.querySelector('path')!.getAttribute('d')!;
    const moveCount = d.match(/M/g)!.length;
    expect(moveCount).toBe(2);
  });
});

describe('createArrowMarker', () => {
  it('creates marker for arrow_point with filled triangle', () => {
    const marker = createArrowMarker('arrow_point');
    expect(marker.tagName).toBe('marker');
    expect(marker.getAttribute('id')).toBe('arrow_point');
    const polygon = marker.querySelector('polygon');
    expect(polygon).not.toBeNull();
    expect(polygon!.getAttribute('fill')).toBe('currentColor');
  });

  it('creates open arrow with unfilled triangle', () => {
    const marker = createArrowMarker('arrow_open');
    const polygon = marker.querySelector('polygon');
    expect(polygon!.getAttribute('fill')).toBe('none');
  });

  it('creates circle marker', () => {
    const marker = createArrowMarker('arrow_circle');
    const circle = marker.querySelector('circle');
    expect(circle).not.toBeNull();
  });
});
