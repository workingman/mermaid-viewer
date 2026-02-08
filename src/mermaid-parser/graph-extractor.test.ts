// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { extract } from './graph-extractor';

function makeSvg(inner: string): Element {
  const parser = new DOMParser();
  const doc = parser.parseFromString(
    `<svg xmlns="http://www.w3.org/2000/svg">${inner}</svg>`,
    'image/svg+xml',
  );
  return doc.documentElement;
}

describe('extract - node extraction', () => {
  it('extracts node id and label from .node elements', () => {
    const svg = makeSvg(`
      <g class="node" id="flowchart-A-0">
        <rect/><text>Hello</text>
      </g>
    `);
    const { graph } = extract(svg, 'flowchart');
    expect(graph.nodes).toHaveLength(1);
    expect(graph.nodes[0].id).toBe('A');
    expect(graph.nodes[0].label).toBe('Hello');
  });

  it('detects shape from child element type', () => {
    const svg = makeSvg(`
      <g class="node" id="flowchart-B-0">
        <polygon/><text>Decision</text>
      </g>
      <g class="node" id="flowchart-C-0">
        <circle/><text>Start</text>
      </g>
    `);
    const { graph } = extract(svg, 'flowchart');
    expect(graph.nodes[0].shape).toBe('diamond');
    expect(graph.nodes[1].shape).toBe('circle');
  });

  it('defaults to rect for unknown shapes', () => {
    const svg = makeSvg(`
      <g class="node" id="flowchart-D-0">
        <foreignObject/><text>Custom</text>
      </g>
    `);
    const { graph } = extract(svg, 'flowchart');
    expect(graph.nodes[0].shape).toBe('rect');
  });
});

describe('extract - edge extraction', () => {
  it('extracts edges from .edgePath elements', () => {
    const svg = makeSvg(`
      <g class="edgePath" id="L-A-B-0">
        <path marker-end="url(#arrow_point)"/>
      </g>
    `);
    const { graph } = extract(svg, 'flowchart');
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0].sourceId).toBe('A');
    expect(graph.edges[0].targetId).toBe('B');
  });

  it('generates correct edge IDs for multiple edges', () => {
    const svg = makeSvg(`
      <g class="edgePath" id="L-A-B-0">
        <path marker-end="url(#arrow_point)"/>
      </g>
      <g class="edgePath" id="L-A-B-1">
        <path marker-end="url(#arrow_point)"/>
      </g>
    `);
    const { graph } = extract(svg, 'flowchart');
    expect(graph.edges[0].id).toBe('A->B:0');
    expect(graph.edges[1].id).toBe('A->B:1');
  });

  it('detects dotted line style from stroke-dasharray', () => {
    const svg = makeSvg(`
      <g class="edgePath" id="L-X-Y-0">
        <path stroke-dasharray="3,3" marker-end="url(#arrow_point)"/>
      </g>
    `);
    const { graph } = extract(svg, 'flowchart');
    expect(graph.edges[0].lineStyle).toBe('dotted');
  });
});

describe('extract - edge cases', () => {
  it('returns empty arrays when no nodes or edges', () => {
    const svg = makeSvg('');
    const { graph, nodeSvgFragments } = extract(svg, 'flowchart');
    expect(graph.nodes).toHaveLength(0);
    expect(graph.edges).toHaveLength(0);
    expect(nodeSvgFragments.size).toBe(0);
  });

  it('builds nodeSvgFragments map from extracted nodes', () => {
    const svg = makeSvg(`
      <g class="node" id="flowchart-Z-0">
        <rect/><text>Z</text>
      </g>
    `);
    const { nodeSvgFragments } = extract(svg, 'flowchart');
    expect(nodeSvgFragments.has('Z')).toBe(true);
    expect(nodeSvgFragments.get('Z')).toContain('class="node"');
  });

  it('preserves diagramType in output graph', () => {
    const svg = makeSvg('');
    const { graph } = extract(svg, 'stateDiagram');
    expect(graph.diagramType).toBe('stateDiagram');
  });
});
