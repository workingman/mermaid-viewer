import { describe, it, expect } from 'vitest';
import type {
  ParsedNode,
  ParsedEdge,
  ParsedGraph,
  ParseResult,
  SidecarData,
  MergedNode,
  MergedGraph,
  ELKInputGraph,
  PositionedNode,
  EdgeSection,
  LayoutResult,
} from './types';
import { MermaidParseError } from './types';

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

describe('ELKInputGraph', () => {
  it('requires root id', () => {
    const graph: ELKInputGraph = {
      id: 'root',
      layoutOptions: { 'elk.algorithm': 'layered' },
      children: [],
      edges: [],
    };
    expect(graph.id).toBe('root');
  });
});

describe('PositionedNode', () => {
  it('has required position fields', () => {
    const node: PositionedNode = {
      id: 'A',
      x: 10,
      y: 20,
      width: 100,
      height: 50,
    };
    expect(node.x).toBe(10);
  });
});

describe('EdgeSection', () => {
  it('has optional bendPoints', () => {
    const section: EdgeSection = {
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 100, y: 100 },
    };
    expect(section.bendPoints).toBeUndefined();
  });
});

describe('LayoutResult', () => {
  it('contains positionedNodes and routedEdges', () => {
    const result: LayoutResult = {
      positionedNodes: [],
      routedEdges: [],
    };
    expect(result.positionedNodes).toHaveLength(0);
  });
});

describe('ParseResult', () => {
  it('holds graph and nodeSvgFragments with optional passthroughSvg', () => {
    const result: ParseResult = {
      graph: { nodes: [], edges: [], diagramType: 'flowchart' },
      nodeSvgFragments: new Map([['A', '<rect/>']]),
      passthroughSvg: '<svg>full</svg>',
    };
    expect(result.nodeSvgFragments.get('A')).toBe('<rect/>');
    expect(result.passthroughSvg).toBe('<svg>full</svg>');
  });
});

describe('MermaidParseError', () => {
  it('has name MermaidParseError and preserves message', () => {
    const err = new MermaidParseError('bad syntax');
    expect(err.name).toBe('MermaidParseError');
    expect(err.message).toBe('bad syntax');
    expect(err).toBeInstanceOf(Error);
  });
});
