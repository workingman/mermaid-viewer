import { describe, it, expect } from 'vitest';
import { computeEdgeCrossings } from './crossing-detector';
import type { RoutedEdge } from '@shared/types';

function makeEdge(id: string, sections: RoutedEdge['sections']): RoutedEdge {
  return { id, sections };
}

describe('computeEdgeCrossings', () => {
  it('detects crossing between two intersecting edges', () => {
    const edges: RoutedEdge[] = [
      makeEdge('e1', [{ startPoint: { x: 0, y: 0 }, endPoint: { x: 10, y: 10 } }]),
      makeEdge('e2', [{ startPoint: { x: 10, y: 0 }, endPoint: { x: 0, y: 10 } }]),
    ];
    const crossings = computeEdgeCrossings(edges);
    expect(crossings).toHaveLength(1);
    expect(crossings[0].point.x).toBeCloseTo(5);
    expect(crossings[0].point.y).toBeCloseTo(5);
  });

  it('returns empty for parallel edges', () => {
    const edges: RoutedEdge[] = [
      makeEdge('e1', [{ startPoint: { x: 0, y: 0 }, endPoint: { x: 10, y: 0 } }]),
      makeEdge('e2', [{ startPoint: { x: 0, y: 5 }, endPoint: { x: 10, y: 5 } }]),
    ];
    expect(computeEdgeCrossings(edges)).toHaveLength(0);
  });

  it('filters out shared-endpoint touches', () => {
    const edges: RoutedEdge[] = [
      makeEdge('e1', [{ startPoint: { x: 0, y: 0 }, endPoint: { x: 5, y: 5 } }]),
      makeEdge('e2', [{ startPoint: { x: 5, y: 5 }, endPoint: { x: 10, y: 0 } }]),
    ];
    expect(computeEdgeCrossings(edges)).toHaveLength(0);
  });

  it('detects multiple crossings from multi-segment edges', () => {
    const edges: RoutedEdge[] = [
      makeEdge('e1', [{
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 20, y: 0 },
        bendPoints: [{ x: 10, y: 10 }],
      }]),
      makeEdge('e2', [{ startPoint: { x: 2, y: 5 }, endPoint: { x: 18, y: 5 } }]),
    ];
    const crossings = computeEdgeCrossings(edges);
    expect(crossings).toHaveLength(2);
  });

  it('returns empty for no edges', () => {
    expect(computeEdgeCrossings([])).toHaveLength(0);
  });
});
