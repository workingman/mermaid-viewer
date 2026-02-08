import mermaid from 'mermaid';
import type { ParseResult } from '@shared/types';
import { MermaidParseError } from '@shared/types';

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

export async function parse(mmdText: string): Promise<ParseResult> {
  initMermaid();
  await validateSyntax(mmdText);
  const svg = await renderSvg(mmdText);

  // Stub: return empty graph until GraphExtractor (#118) is wired in
  return {
    graph: { nodes: [], edges: [], diagramType: 'flowchart' },
    nodeSvgFragments: new Map(),
    passthroughSvg: svg,
  };
}
