/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { loadSidecar, mergeSidecarIntoGraph } from '@sidecar/sidecar-manager';
import { computeLayout } from '@layout-engine/layout-engine';
import { compose } from '@svg-compositor/svg-compositor';
import { isGraphDiagram } from '@shared/constants';
import type { ParsedGraph, ParsedEdge } from '@shared/types';

function makeFlowchart(): { graph: ParsedGraph; fragments: Map<string, string> } {
  const nodes = [
    { id: 'A', label: 'Start', shape: 'rect', width: 100, height: 50, svgFragment: '<rect width="100" height="50"/>' },
    { id: 'B', label: 'Process', shape: 'rect', width: 100, height: 50, svgFragment: '<rect width="100" height="50"/>' },
    { id: 'C', label: 'End', shape: 'rect', width: 100, height: 50, svgFragment: '<rect width="100" height="50"/>' },
  ];
  const edges: ParsedEdge[] = [
    { id: 'A->B:0', sourceId: 'A', targetId: 'B', label: null, arrowType: 'arrow_point', lineStyle: 'solid' },
    { id: 'B->C:0', sourceId: 'B', targetId: 'C', label: null, arrowType: 'arrow_point', lineStyle: 'solid' },
  ];
  const graph: ParsedGraph = { nodes, edges, diagramType: 'flowchart' };
  const fragments = new Map(nodes.map((n) => [n.id, n.svgFragment]));
  return { graph, fragments };
}

describe('render pipeline integration', () => {
  it('produces SVG with 3 nodes and 2 edges for simple flowchart', async () => {
    const { graph, fragments } = makeFlowchart();
    const merged = mergeSidecarIntoGraph(graph, null);
    const layout = await computeLayout(merged);
    const svg = compose(layout, fragments, graph.edges);
    const nodeLayer = svg.querySelector('.node-layer');
    const edgeLayer = svg.querySelector('.edge-layer');
    expect(nodeLayer!.children).toHaveLength(3);
    expect(edgeLayer!.querySelectorAll('g')).toHaveLength(2);
  });

  it('positions nodes without overlap', async () => {
    const { graph, fragments } = makeFlowchart();
    const merged = mergeSidecarIntoGraph(graph, null);
    const layout = await computeLayout(merged);
    compose(layout, fragments, graph.edges);
    for (let i = 0; i < layout.positionedNodes.length; i++) {
      for (let j = i + 1; j < layout.positionedNodes.length; j++) {
        const a = layout.positionedNodes[i];
        const b = layout.positionedNodes[j];
        const noOverlap =
          a.x + a.width <= b.x ||
          b.x + b.width <= a.x ||
          a.y + a.height <= b.y ||
          b.y + b.height <= a.y;
        expect(noOverlap).toBe(true);
      }
    }
  });

  it('generates orthogonal edge segments', async () => {
    const { graph, fragments } = makeFlowchart();
    const merged = mergeSidecarIntoGraph(graph, null);
    const layout = await computeLayout(merged);
    compose(layout, fragments, graph.edges);
    for (const edge of layout.routedEdges) {
      for (const section of edge.sections) {
        const points = [section.startPoint, ...(section.bendPoints ?? []), section.endPoint];
        for (let i = 0; i < points.length - 1; i++) {
          const dx = Math.abs(points[i + 1].x - points[i].x);
          const dy = Math.abs(points[i + 1].y - points[i].y);
          const isOrthogonal = dx < 0.01 || dy < 0.01;
          expect(isOrthogonal).toBe(true);
        }
      }
    }
  });

  it('sets valid viewBox on output SVG', async () => {
    const { graph, fragments } = makeFlowchart();
    const merged = mergeSidecarIntoGraph(graph, null);
    const layout = await computeLayout(merged);
    const svg = compose(layout, fragments, graph.edges);
    const viewBox = svg.getAttribute('viewBox');
    expect(viewBox).toBeTruthy();
    const parts = viewBox!.split(' ').map(Number);
    expect(parts).toHaveLength(4);
    expect(parts[2]).toBeGreaterThan(0);
    expect(parts[3]).toBeGreaterThan(0);
  });

  it('handles class diagram with correct node and edge counts', async () => {
    const nodes = [
      { id: 'Animal', label: 'Animal', shape: 'rect', width: 120, height: 60, svgFragment: '<rect width="120" height="60"/>' },
      { id: 'Dog', label: 'Dog', shape: 'rect', width: 120, height: 60, svgFragment: '<rect width="120" height="60"/>' },
      { id: 'Cat', label: 'Cat', shape: 'rect', width: 120, height: 60, svgFragment: '<rect width="120" height="60"/>' },
    ];
    const edges: ParsedEdge[] = [
      { id: 'Animal->Dog:0', sourceId: 'Animal', targetId: 'Dog', label: 'extends', arrowType: 'arrow_point', lineStyle: 'solid' },
      { id: 'Animal->Cat:0', sourceId: 'Animal', targetId: 'Cat', label: 'extends', arrowType: 'arrow_point', lineStyle: 'solid' },
    ];
    const graph: ParsedGraph = { nodes, edges, diagramType: 'classDiagram' };
    const fragments = new Map(nodes.map((n) => [n.id, n.svgFragment]));
    const merged = mergeSidecarIntoGraph(graph, null);
    const layout = await computeLayout(merged);
    const svg = compose(layout, fragments, graph.edges);
    expect(layout.positionedNodes).toHaveLength(3);
    expect(layout.routedEdges).toHaveLength(2);
    expect(svg.querySelector('.node-layer')!.children).toHaveLength(3);
  });

  it('passes sidecar hints through merge into layout', async () => {
    const { graph } = makeFlowchart();
    const sidecar = loadSidecar(
      JSON.stringify({ version: 1, nodes: { A: { x: 50, y: 10 } } }),
    );
    const merged = mergeSidecarIntoGraph(graph, sidecar);
    const hintedNode = merged.nodes.find((n) => n.id === 'A');
    expect(hintedNode!.hintX).toBe(50);
    expect(hintedNode!.hintY).toBe(10);
    const unhintedNode = merged.nodes.find((n) => n.id === 'B');
    expect(unhintedNode!.hintX).toBeUndefined();
  });
});

describe('non-graph passthrough', () => {
  it('identifies sequenceDiagram as non-graph type', () => {
    expect(isGraphDiagram('sequenceDiagram')).toBe(false);
  });

  it('identifies pie as non-graph type', () => {
    expect(isGraphDiagram('pie')).toBe(false);
  });

  it('identifies flowchart as graph type', () => {
    expect(isGraphDiagram('flowchart')).toBe(true);
  });
});
