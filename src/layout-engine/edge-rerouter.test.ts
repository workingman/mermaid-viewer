import { describe, it, expect, vi } from 'vitest';
import type { PositionedNode, ParsedEdge } from '@shared/types';

vi.mock('elkjs/lib/elk.bundled.js', () => {
  return {
    default: class MockELK {
      async layout(graph: {
        children: Array<{ id: string; layoutOptions?: Record<string, string> }>;
        edges: Array<{ id: string }>;
      }) {
        const allFixed = graph.children.every(
          (c) => c.layoutOptions?.['org.eclipse.elk.noLayout'] === 'true',
        );
        if (!allFixed) throw new Error('Expected all nodes noLayout');

        if (graph.edges.length === 0) {
          return { children: graph.children, edges: [] };
        }

        return {
          children: graph.children,
          edges: [
            {
              id: 'e1',
              sections: [
                {
                  startPoint: { x: 50, y: 25 },
                  endPoint: { x: 200, y: 25 },
                },
              ],
            },
          ],
        };
      }
    },
  };
});

const { computeEdgeOnlyLayout } = await import('./edge-rerouter');

function makeNodes(): PositionedNode[] {
  return [
    { id: 'A', x: 0, y: 0, width: 100, height: 50 },
    { id: 'B', x: 200, y: 0, width: 100, height: 50 },
  ];
}

function makeEdges(): ParsedEdge[] {
  return [
    {
      id: 'e1',
      sourceId: 'A',
      targetId: 'B',
      label: null,
      arrowType: 'arrow_point',
      lineStyle: 'solid' as const,
    },
  ];
}

describe('computeEdgeOnlyLayout', () => {
  it('returns re-routed edges with valid paths', async () => {
    const result = await computeEdgeOnlyLayout(makeNodes(), makeEdges());
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('e1');
    expect(result[0].sections[0].startPoint).toEqual({ x: 50, y: 25 });
  });

  it('sets all nodes to noLayout in ELK input', async () => {
    // The mock throws if any node lacks noLayout
    const result = await computeEdgeOnlyLayout(makeNodes(), makeEdges());
    expect(result).toHaveLength(1);
  });

  it('returns empty array for no edges', async () => {
    const nodes = makeNodes();
    const result = await computeEdgeOnlyLayout(nodes, []);
    expect(result).toHaveLength(0);
  });
});
