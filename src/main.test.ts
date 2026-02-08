/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ParsedGraph, SidecarData } from '@shared/types';
import { MermaidParseError } from '@shared/types';

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(),
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@mermaid-parser/mermaid-parser', () => ({
  parse: vi.fn(),
}));

vi.mock('@sidecar/sidecar-manager', () => ({
  loadSidecar: vi.fn((json: string | null) => {
    if (json === null) return null;
    return JSON.parse(json) as SidecarData;
  }),
  mergeSidecarIntoGraph: vi.fn((graph: ParsedGraph) => ({
    nodes: graph.nodes,
    edges: graph.edges,
    diagramType: graph.diagramType,
  })),
}));

vi.mock('@layout-engine/layout-engine', () => ({
  computeLayout: vi.fn(async () => ({
    positionedNodes: [{ id: 'A', x: 0, y: 0, width: 100, height: 50 }],
    routedEdges: [],
  })),
}));

vi.mock('@svg-compositor/svg-compositor', () => ({
  compose: vi.fn(() => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    return svg;
  }),
}));

vi.mock('@edit/write-lock', () => ({
  isWriteLocked: vi.fn(() => false),
}));

vi.mock('@error/error-boundary', () => {
  return {
    ErrorBoundary: class MockErrorBoundary {
      handleRenderSuccess = vi.fn();
      showError = vi.fn();
      clearError = vi.fn();
      cacheRender = vi.fn();
      getLastValidRender = vi.fn(() => null);
    },
  };
});

function makeGraph(diagramType = 'flowchart'): ParsedGraph {
  return {
    nodes: [
      { id: 'A', label: 'A', shape: 'rect', width: 100, height: 50, svgFragment: '' },
    ],
    edges: [],
    diagramType,
  };
}

const { invoke } = await import('@tauri-apps/api/core');
const { parse } = await import('@mermaid-parser/mermaid-parser');
const {
  windowState,
  renderDeps,
  createWindowState,
  handleMmdChange,
  renderPipeline,
  onFileChanged,
} = await import('./main');

beforeEach(() => {
  Object.assign(windowState, createWindowState());
  renderDeps.cachedFragments = new Map();
  renderDeps.cachedEdges = [];
  renderDeps.sidecar = null;
  vi.clearAllMocks();
  document.body.innerHTML = '<div id="app"></div>';
});

describe('WindowState', () => {
  it('initializes with all null/false defaults', () => {
    const ws = createWindowState();
    expect(ws.filePath).toBeNull();
    expect(ws.lastGraph).toBeNull();
    expect(ws.lastLayout).toBeNull();
    expect(ws.lastSvg).toBeNull();
    expect(ws.isEditing).toBe(false);
    expect(ws.isEditingAllowed).toBe(false);
    expect(ws.renderInProgress).toBe(false);
    expect(ws.error).toBeNull();
  });
});

describe('renderPipeline', () => {
  it('produces SVG and updates state on success', async () => {
    windowState.lastGraph = makeGraph();
    await renderPipeline();
    expect(windowState.lastSvg).not.toBeNull();
    expect(windowState.lastLayout).not.toBeNull();
    expect(windowState.error).toBeNull();
  });

  it('skips render when lastGraph is null', async () => {
    windowState.lastGraph = null;
    await renderPipeline();
    expect(windowState.lastSvg).toBeNull();
  });
});

describe('handleMmdChange', () => {
  it('parses file and updates window state', async () => {
    const graph = makeGraph();
    vi.mocked(invoke).mockResolvedValueOnce('flowchart TD\n  A-->B');
    vi.mocked(invoke).mockResolvedValueOnce('/tmp/test.mmd.layout.json');
    vi.mocked(invoke).mockRejectedValueOnce(new Error('no sidecar'));
    vi.mocked(parse).mockResolvedValueOnce({
      graph,
      nodeSvgFragments: new Map([['A', '<rect/>']]),
    });
    await handleMmdChange('/tmp/test.mmd');
    expect(windowState.filePath).toBe('/tmp/test.mmd');
    expect(windowState.lastGraph).toEqual(graph);
    expect(windowState.isEditingAllowed).toBe(true);
  });

  it('sets error on parse failure and preserves last valid render', async () => {
    windowState.lastSvg = document.createElementNS(
      'http://www.w3.org/2000/svg', 'svg',
    ) as SVGElement;
    const prevSvg = windowState.lastSvg;
    vi.mocked(invoke).mockResolvedValueOnce('bad content');
    vi.mocked(parse).mockRejectedValueOnce(
      new MermaidParseError('Syntax error'),
    );
    await handleMmdChange('/tmp/bad.mmd');
    expect(windowState.error).toBe('Syntax error');
    expect(windowState.lastSvg).toBe(prevSvg);
  });

  it('clears error after successful recovery', async () => {
    windowState.error = 'old error';
    const graph = makeGraph();
    vi.mocked(invoke).mockResolvedValueOnce('flowchart TD\n  A');
    vi.mocked(invoke).mockResolvedValueOnce('/tmp/x.mmd.layout.json');
    vi.mocked(invoke).mockRejectedValueOnce(new Error('no sidecar'));
    vi.mocked(parse).mockResolvedValueOnce({
      graph,
      nodeSvgFragments: new Map(),
    });
    await handleMmdChange('/tmp/x.mmd');
    expect(windowState.error).toBeNull();
  });
});

describe('onFileChanged', () => {
  it('dispatches mmd kind to handleMmdChange', async () => {
    const graph = makeGraph();
    vi.mocked(invoke).mockResolvedValueOnce('content');
    vi.mocked(invoke).mockResolvedValueOnce('/sidecar');
    vi.mocked(invoke).mockRejectedValueOnce(new Error('no'));
    vi.mocked(parse).mockResolvedValueOnce({
      graph,
      nodeSvgFragments: new Map(),
    });
    await onFileChanged({ path: '/test.mmd', kind: 'mmd' });
    expect(windowState.filePath).toBe('/test.mmd');
  });
});
