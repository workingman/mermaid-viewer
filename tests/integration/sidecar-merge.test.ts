import { describe, it, expect } from 'vitest';
import { loadSidecar, mergeSidecarIntoGraph } from '@sidecar/sidecar-manager';
import type { ParsedGraph, ParsedNode } from '@shared/types';

function makeNode(id: string): ParsedNode {
  return { id, label: id, shape: 'rect', width: 100, height: 50, svgFragment: '' };
}

function makeGraph(): ParsedGraph {
  return {
    nodes: [makeNode('A'), makeNode('B')],
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

function makeFourNodeGraph(): ParsedGraph {
  return {
    nodes: [makeNode('A'), makeNode('B'), makeNode('C'), makeNode('D')],
    edges: [
      { id: 'A->B:0', sourceId: 'A', targetId: 'B', label: null, arrowType: 'arrow_point', lineStyle: 'solid' },
      { id: 'B->C:0', sourceId: 'B', targetId: 'C', label: null, arrowType: 'arrow_point', lineStyle: 'solid' },
      { id: 'C->D:0', sourceId: 'C', targetId: 'D', label: null, arrowType: 'arrow_point', lineStyle: 'solid' },
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

  it('applies partial sidecar hints to 2 of 4 nodes', () => {
    const json = JSON.stringify({
      version: 1,
      nodes: { A: { x: 10, y: 20 }, C: { x: 50, y: 60 } },
    });
    const merged = mergeSidecarIntoGraph(makeFourNodeGraph(), loadSidecar(json));
    expect(merged.nodes[0].hintX).toBe(10);
    expect(merged.nodes[1].hintX).toBeUndefined();
    expect(merged.nodes[2].hintX).toBe(50);
    expect(merged.nodes[3].hintX).toBeUndefined();
  });

  it('silently ignores orphaned sidecar entries', () => {
    const json = JSON.stringify({
      version: 1,
      nodes: { A: { x: 10, y: 20 }, Z: { x: 99, y: 99 } },
    });
    const merged = mergeSidecarIntoGraph(makeGraph(), loadSidecar(json));
    expect(merged.nodes[0].hintX).toBe(10);
    expect(merged.nodes).toHaveLength(2);
  });
});
