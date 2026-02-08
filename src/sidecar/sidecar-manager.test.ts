import { describe, it, expect, vi } from 'vitest';
import { loadSidecar, mergeSidecarIntoGraph, buildSidecarFromPositions } from './sidecar-manager';
import type { ParsedGraph, PositionedNode, SidecarData } from '@shared/types';

describe('loadSidecar', () => {
  it('returns null for null input', () => {
    expect(loadSidecar(null)).toBeNull();
  });

  it('returns validated SidecarData for valid JSON', () => {
    const json = JSON.stringify({ version: 1, nodes: { A: { x: 10, y: 20 } } });
    const result = loadSidecar(json);
    expect(result).toEqual({ version: 1, nodes: { A: { x: 10, y: 20 } } });
  });

  it('returns null and warns on malformed JSON', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(loadSidecar('not-json')).toBeNull();
    expect(warn).toHaveBeenCalledWith('Sidecar: malformed JSON');
    warn.mockRestore();
  });

  it('returns null when version is missing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(loadSidecar(JSON.stringify({ nodes: {} }))).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('returns null when version is wrong', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const json = JSON.stringify({ version: 2, nodes: {} });
    expect(loadSidecar(json)).toBeNull();
    warn.mockRestore();
  });

  it('returns null when node has non-numeric coordinates', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const json = JSON.stringify({ version: 1, nodes: { A: { x: 'foo', y: 10 } } });
    expect(loadSidecar(json)).toBeNull();
    warn.mockRestore();
  });

  it('returns null when node has extra properties', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const json = JSON.stringify({
      version: 1,
      nodes: { A: { x: 10, y: 20, z: 30 } },
    });
    expect(loadSidecar(json)).toBeNull();
    warn.mockRestore();
  });
});

function makeNode(id: string) {
  return { id, label: id, shape: 'rect', width: 100, height: 50, svgFragment: '' };
}

function makeGraph(nodeIds: string[]): ParsedGraph {
  return { nodes: nodeIds.map(makeNode), edges: [], diagramType: 'flowchart' };
}

describe('mergeSidecarIntoGraph', () => {
  it('returns all nodes unhinted when sidecar is null', () => {
    const result = mergeSidecarIntoGraph(makeGraph(['A', 'B']), null);
    expect(result.nodes).toHaveLength(2);
    expect(result.nodes[0].hintX).toBeUndefined();
    expect(result.nodes[1].hintX).toBeUndefined();
  });

  it('attaches hintX/hintY to matching nodes', () => {
    const sidecar: SidecarData = { version: 1, nodes: { A: { x: 10, y: 20 } } };
    const result = mergeSidecarIntoGraph(makeGraph(['A', 'B']), sidecar);
    expect(result.nodes[0].hintX).toBe(10);
    expect(result.nodes[0].hintY).toBe(20);
    expect(result.nodes[1].hintX).toBeUndefined();
  });

  it('silently drops orphan sidecar entries', () => {
    const sidecar: SidecarData = { version: 1, nodes: { Z: { x: 5, y: 5 } } };
    const result = mergeSidecarIntoGraph(makeGraph(['A']), sidecar);
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].hintX).toBeUndefined();
  });

  it('preserves edges and diagramType', () => {
    const graph: ParsedGraph = {
      nodes: [makeNode('A')],
      edges: [{ id: 'e1', sourceId: 'A', targetId: 'B', label: null, arrowType: 'arrow_point', lineStyle: 'solid' }],
      diagramType: 'sequence',
    };
    const result = mergeSidecarIntoGraph(graph, null);
    expect(result.edges).toEqual(graph.edges);
    expect(result.diagramType).toBe('sequence');
  });
});

describe('buildSidecarFromPositions', () => {
  it('maps positioned nodes to SidecarData format', () => {
    const nodes: PositionedNode[] = [
      { id: 'A', x: 10, y: 20, width: 100, height: 50 },
      { id: 'B', x: 30, y: 40, width: 80, height: 40 },
    ];
    const result = buildSidecarFromPositions(nodes);
    expect(result.version).toBe(1);
    expect(result.nodes).toEqual({ A: { x: 10, y: 20 }, B: { x: 30, y: 40 } });
  });

  it('returns empty nodes for empty input', () => {
    const result = buildSidecarFromPositions([]);
    expect(result).toEqual({ version: 1, nodes: {} });
  });
});
