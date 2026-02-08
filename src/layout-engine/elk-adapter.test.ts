import { describe, it, expect } from 'vitest';
import { toElkGraph } from './elk-adapter';
import type { MergedGraph } from '@shared/types';

function makeGraph(overrides: Partial<MergedGraph> = {}): MergedGraph {
  return {
    nodes: [],
    edges: [],
    diagramType: 'flowchart',
    ...overrides,
  };
}

describe('toElkGraph', () => {
  it('maps basic nodes to ELK children', () => {
    const graph = makeGraph({
      nodes: [
        { id: 'A', label: 'A', shape: 'rect', width: 100, height: 50, svgFragment: '' },
        { id: 'B', label: 'B', shape: 'rect', width: 80, height: 40, svgFragment: '' },
      ],
    });
    const elk = toElkGraph(graph);
    expect(elk.children).toHaveLength(2);
    expect(elk.children[0].id).toBe('A');
    expect(elk.children[0].width).toBe(100);
  });

  it('applies position hints to hinted nodes', () => {
    const graph = makeGraph({
      nodes: [
        {
          id: 'A',
          label: 'A',
          shape: 'rect',
          width: 100,
          height: 50,
          svgFragment: '',
          hintX: 10,
          hintY: 20,
        },
      ],
    });
    const elk = toElkGraph(graph);
    const node = elk.children[0];
    expect(node.x).toBe(10);
    expect(node.y).toBe(20);
    expect(node.layoutOptions?.['elk.position']).toBe('(10,20)');
  });

  it('does not set hints on unhinted nodes', () => {
    const graph = makeGraph({
      nodes: [{ id: 'A', label: 'A', shape: 'rect', width: 60, height: 40, svgFragment: '' }],
    });
    const elk = toElkGraph(graph);
    expect(elk.children[0].x).toBeUndefined();
    expect(elk.children[0].layoutOptions).toBeUndefined();
  });

  it('maps edges with labels', () => {
    const graph = makeGraph({
      edges: [
        {
          id: 'e1',
          sourceId: 'A',
          targetId: 'B',
          label: 'yes',
          arrowType: 'arrow_point',
          lineStyle: 'solid',
        },
      ],
    });
    const elk = toElkGraph(graph);
    expect(elk.edges).toHaveLength(1);
    expect(elk.edges[0].sources).toEqual(['A']);
    expect(elk.edges[0].labels?.[0].text).toBe('yes');
  });

  it('omits labels when edge label is null', () => {
    const graph = makeGraph({
      edges: [
        {
          id: 'e1',
          sourceId: 'A',
          targetId: 'B',
          label: null,
          arrowType: 'arrow_point',
          lineStyle: 'solid',
        },
      ],
    });
    const elk = toElkGraph(graph);
    expect(elk.edges[0].labels).toBeUndefined();
  });

  it('sets root id and layout options', () => {
    const elk = toElkGraph(makeGraph());
    expect(elk.id).toBe('root');
    expect(elk.layoutOptions['elk.algorithm']).toBe('layered');
  });
});
