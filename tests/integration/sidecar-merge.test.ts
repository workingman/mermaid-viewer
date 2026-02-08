import { describe, it, expect } from 'vitest';
import { loadSidecar, mergeSidecarIntoGraph } from '@sidecar/sidecar-manager';
import type { ParsedGraph } from '@shared/types';

function makeGraph(): ParsedGraph {
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
        lineStyle: 'solid',
      },
    ],
    diagramType: 'flowchart',
  };
}

describe('sidecar merge integration', () => {
  it('loads valid sidecar JSON and merges hints into graph', () => {
    const json = JSON.stringify({ version: 1, nodes: { A: { x: 50, y: 100 } } });
    const sidecar = loadSidecar(json);
    const merged = mergeSidecarIntoGraph(makeGraph(), sidecar);
    expect(merged.nodes[0].hintX).toBe(50);
    expect(merged.nodes[0].hintY).toBe(100);
    expect(merged.nodes[1].hintX).toBeUndefined();
  });

  it('produces unhinted graph when sidecar JSON is null', () => {
    const sidecar = loadSidecar(null);
    const merged = mergeSidecarIntoGraph(makeGraph(), sidecar);
    expect(merged.nodes.every((n) => n.hintX === undefined)).toBe(true);
  });

  it('produces unhinted graph when sidecar JSON is invalid', () => {
    const sidecar = loadSidecar('{"version":2}');
    const merged = mergeSidecarIntoGraph(makeGraph(), sidecar);
    expect(merged.nodes.every((n) => n.hintX === undefined)).toBe(true);
  });

  it('preserves edges through the merge pipeline', () => {
    const graph = makeGraph();
    const json = JSON.stringify({ version: 1, nodes: { A: { x: 10, y: 20 } } });
    const merged = mergeSidecarIntoGraph(graph, loadSidecar(json));
    expect(merged.edges).toHaveLength(1);
    expect(merged.edges[0].sourceId).toBe('A');
  });

  it('handles sidecar with all nodes hinted', () => {
    const json = JSON.stringify({
      version: 1,
      nodes: { A: { x: 10, y: 20 }, B: { x: 30, y: 40 } },
    });
    const merged = mergeSidecarIntoGraph(makeGraph(), loadSidecar(json));
    expect(merged.nodes[0].hintX).toBe(10);
    expect(merged.nodes[1].hintX).toBe(30);
  });
});
