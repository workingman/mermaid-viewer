import mermaid from 'mermaid';
import type { ParseResult } from '@shared/types';
import { MermaidParseError } from '@shared/types';
import { extract } from './graph-extractor';

let renderCounter = 0;

function nextRenderId(): string {
  renderCounter += 1;
  return `mermaid-render-${renderCounter}`;
}

function initMermaid(): void {
  mermaid.initialize({
    startOnLoad: false,
    suppressErrors: true,
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

export async function parse(mmdText: string, diagramType = 'flowchart'): Promise<ParseResult> {
  initMermaid();
  await validateSyntax(mmdText);
  const svg = await renderSvg(mmdText);

  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, 'image/svg+xml');
  const svgEl = doc.documentElement;
  const { graph, nodeSvgFragments } = extract(svgEl, diagramType);

  return { graph, nodeSvgFragments, passthroughSvg: svg };
}
