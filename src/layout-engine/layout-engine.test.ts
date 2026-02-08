import { describe, it, expect, vi } from 'vitest';
import type { MergedGraph } from '@shared/types';
import { LayoutError } from '@shared/types';

vi.mock('elkjs/lib/elk.bundled.js', () => {
  return {
    default: class MockELK {
      async layout(graph: { children: Array<{ id: string }>; edges: unknown[] }) {
        const hasFailNode = graph.children.some((c) => c.id === '__FAIL__');
        if (hasFailNode) {
          throw new Error('ELK internal failure');
        }
        if (graph.children.length === 0) {
          return { children: [], edges: [] };
        }
        return {
          children: [
            { id: 'A', x: 10, y: 20, width: 100, height: 50 },
            { id: 'B', x: 200, y: 300, width: 80, height: 40 },
          ],
          edges: [
            {
              id: 'e1',
              sections: [
                {
                  startPoint: { x: 110, y: 45 },
                  endPoint: { x: 200, y: 320 },
                  bendPoints: [{ x: 150, y: 200 }],
                },
              ],
            },
          ],
        };
      }
    },
  };
});

const { computeLayout } = await import('./layout-engine');

function makeGraph(overrides: Partial<MergedGraph> = {}): MergedGraph {
  return {
    nodes: [
      { id: 'A', label: 'A', shape: 'rect', width: 100, height: 50, svgFragment: '' },
      { id: 'B', label: 'B', shape: 'rect', width: 80, height: 40, svgFragment: '' },
    ],
    edges: [
      {
        id: 'e1',
        sourceId: 'A',
        targetId: 'B',
        label: null,
        arrowType: 'arrow_point',
        lineStyle: 'solid' as const,
      },
    ],
    diagramType: 'flowchart',
    ...overrides,
  };
}

describe('computeLayout', () => {
  it('returns positioned nodes from ELK output', async () => {
    const result = await computeLayout(makeGraph());
    expect(result.positionedNodes).toHaveLength(2);
    expect(result.positionedNodes[0]).toEqual({
      id: 'A',
      x: 10,
      y: 20,
      width: 100,
      height: 50,
    });
  });

  it('returns routed edges with sections', async () => {
    const result = await computeLayout(makeGraph());
    expect(result.routedEdges).toHaveLength(1);
    expect(result.routedEdges[0].sections[0].bendPoints).toEqual([{ x: 150, y: 200 }]);
  });

  it('handles empty graph', async () => {
    const result = await computeLayout(makeGraph({ nodes: [], edges: [] }));
    expect(result.positionedNodes).toHaveLength(0);
    expect(result.routedEdges).toHaveLength(0);
  });

  it('throws LayoutError when ELK fails', async () => {
    const failGraph = makeGraph({
      nodes: [
        { id: '__FAIL__', label: 'X', shape: 'rect', width: 10, height: 10, svgFragment: '' },
      ],
    });
    await expect(computeLayout(failGraph)).rejects.toThrow(LayoutError);
  });
});
