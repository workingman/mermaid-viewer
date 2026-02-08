import { describe, it, expect } from 'vitest';
import type {
  ParsedNode,
  ParsedEdge,
  ParsedGraph,
  SidecarData,
  MergedNode,
  MergedGraph,
} from './types';

describe('ParsedNode', () => {
  it('accepts a valid node', () => {
    const node: ParsedNode = {
      id: 'A',
      label: 'Node A',
      shape: 'rect',
      width: 100,
      height: 50,
      svgFragment: '<rect/>',
    };
    expect(node.id).toBe('A');
  });
});

describe('ParsedEdge', () => {
  it('accepts valid line styles', () => {
    const edge: ParsedEdge = {
      id: 'A->B:0',
      sourceId: 'A',
      targetId: 'B',
      label: null,
      arrowType: 'arrow_point',
      lineStyle: 'solid',
    };
    expect(edge.lineStyle).toBe('solid');
  });
});

describe('ParsedGraph', () => {
  it('holds nodes and edges together', () => {
    const graph: ParsedGraph = {
      nodes: [],
      edges: [],
      diagramType: 'flowchart',
    };
    expect(graph.diagramType).toBe('flowchart');
  });
});

describe('SidecarData', () => {
  it('version is literal 1', () => {
    const sidecar: SidecarData = { version: 1, nodes: {} };
    expect(sidecar.version).toBe(1);
  });
});

describe('MergedNode', () => {
  it('extends ParsedNode with optional hints', () => {
    const node: MergedNode = {
      id: 'A',
      label: 'Node A',
      shape: 'rect',
      width: 100,
      height: 50,
      svgFragment: '<rect/>',
      hintX: 10,
      hintY: 20,
    };
    expect(node.hintX).toBe(10);
  });

  it('works without hints', () => {
    const node: MergedNode = {
      id: 'B',
      label: 'Node B',
      shape: 'circle',
      width: 80,
      height: 80,
      svgFragment: '<circle/>',
    };
    expect(node.hintX).toBeUndefined();
  });
});

describe('MergedGraph', () => {
  it('uses MergedNode and ParsedEdge', () => {
    const graph: MergedGraph = {
      nodes: [
        {
          id: 'X',
          label: 'X',
          shape: 'rect',
          width: 60,
          height: 40,
          svgFragment: '<rect/>',
          hintX: 5,
        },
      ],
      edges: [],
      diagramType: 'flowchart',
    };
    expect(graph.nodes[0].hintX).toBe(5);
  });
});
