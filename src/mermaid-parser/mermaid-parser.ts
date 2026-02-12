import mermaid from 'mermaid';
import type { ParseResult } from '@shared/types';
import { MermaidParseError } from '@shared/types';
import { extract } from './graph-extractor';
import { detectDiagramType, isPassthrough } from './diagram-detector';

let renderCounter = 0;

function nextRenderId(): string {
  renderCounter += 1;
  return `mermaid-render-${renderCounter}`;
}

function initMermaid(): void {
  mermaid.initialize({
    startOnLoad: false,
  });
}

async function validateSyntax(mmdText: string): Promise<void> {
  try {
    await mermaid.parse(mmdText);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new MermaidParseError(msg);
  }
}

async function renderSvg(mmdText: string): Promise<string> {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  document.body.appendChild(container);

  try {
    const id = nextRenderId();
    const { svg } = await mermaid.render(id, mmdText, container);
    return svg;
  } finally {
    container.remove();
  }
}

function emptyResult(diagramType: string, svg: string): ParseResult {
  return {
    graph: { nodes: [], edges: [], diagramType },
    nodeSvgFragments: new Map(),
    passthroughSvg: svg,
  };
}

function extractGraph(svg: string, diagramType: string): ParseResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, 'text/html');
  const svgEl = doc.querySelector('svg');
  if (!svgEl) {
    return emptyResult(diagramType, svg);
  }
  const { graph, nodeSvgFragments } = extract(svgEl, diagramType);
  return { graph, nodeSvgFragments, passthroughSvg: svg };
}

export async function parse(mmdText: string): Promise<ParseResult> {
  initMermaid();
  await validateSyntax(mmdText);
  const svg = await renderSvg(mmdText);
  const diagramType = detectDiagramType(mmdText);

  if (isPassthrough(diagramType)) {
    return emptyResult(diagramType, svg);
  }
  return extractGraph(svg, diagramType);
}
