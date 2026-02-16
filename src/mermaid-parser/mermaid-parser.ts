import mermaid from 'mermaid';
import type { ParseResult, ParsedGraph } from '@shared/types';
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

async function renderAndExtract(mmdText: string, diagramType: string): Promise<{ svg: string; extractResult: { graph: ParsedGraph; nodeSvgFragments: Map<string, string> } }> {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '10000px';
  container.style.height = '10000px';
  document.body.appendChild(container);

  try {
    const id = nextRenderId();
    const { svg } = await mermaid.render(id, mmdText, container);
    // Parse SVG with proper namespace handling
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, 'text/html');
    const svgEl = doc.querySelector('svg');
    if (!svgEl) {
      throw new MermaidParseError('Mermaid did not produce an SVG element');
    }
    // Import into live DOM
    const imported = document.importNode(svgEl, true) as SVGElement;
    container.appendChild(imported);
    // Force reflow
    void container.offsetHeight;
    // Extract while still connected!
    const extractResult = extract(imported, diagramType);
    return { svg, extractResult };
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

function extractGraph(svg: string, diagramType: string, extractResult: { graph: ParsedGraph; nodeSvgFragments: Map<string, string> }): ParseResult {
  return { graph: extractResult.graph, nodeSvgFragments: extractResult.nodeSvgFragments, passthroughSvg: svg };
}

export async function parse(mmdText: string): Promise<ParseResult> {
  initMermaid();
  await validateSyntax(mmdText);
  const diagramType = detectDiagramType(mmdText);

  const { svg, extractResult } = await renderAndExtract(mmdText, diagramType);

  if (isPassthrough(diagramType)) {
    return emptyResult(diagramType, svg);
  }
  return extractGraph(svg, diagramType, extractResult);
}
