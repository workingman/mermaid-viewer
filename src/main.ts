import './styles/main.css';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { parse } from '@mermaid-parser/mermaid-parser';
import { loadSidecar, mergeSidecarIntoGraph } from '@sidecar/sidecar-manager';
import { computeLayout } from '@layout-engine/layout-engine';
import { compose } from '@svg-compositor/svg-compositor';
import { isWriteLocked } from '@edit/write-lock';
import { ErrorBoundary } from '@error/error-boundary';
import { isGraphDiagram } from '@shared/constants';
import { MermaidParseError } from '@shared/types';
import type { ParsedGraph, ParsedEdge, SidecarData, LayoutResult } from '@shared/types';

export interface WindowState {
  filePath: string | null;
  sidecarPath: string | null;
  lastGraph: ParsedGraph | null;
  lastLayout: LayoutResult | null;
  lastSvg: SVGElement | null;
  isEditing: boolean;
  isEditingAllowed: boolean;
  renderInProgress: boolean;
  renderQueued: boolean;
  error: string | null;
}

export interface FileChangedPayload {
  path: string;
  kind: 'mmd' | 'sidecar';
}

export function createWindowState(): WindowState {
  return {
    filePath: null,
    sidecarPath: null,
    lastGraph: null,
    lastLayout: null,
    lastSvg: null,
    isEditing: false,
    isEditingAllowed: false,
    renderInProgress: false,
    renderQueued: false,
    error: null,
  };
}

export const windowState: WindowState = createWindowState();
export const renderDeps = {
  cachedFragments: new Map<string, string>(),
  cachedEdges: [] as ParsedEdge[],
  sidecar: null as SidecarData | null,
  passthroughSvg: null as string | null,
};

let errorBoundary: ErrorBoundary | null = null;

function getErrorBoundary(): ErrorBoundary {
  if (!errorBoundary) {
    errorBoundary = new ErrorBoundary(document.getElementById('app')!);
  }
  return errorBoundary;
}

export async function renderPipeline(): Promise<void> {
  if (!windowState.lastGraph) return;
  if (windowState.renderInProgress) {
    windowState.renderQueued = true;
    return;
  }
  windowState.renderInProgress = true;
  try {
    await executeRender();
  } finally {
    windowState.renderInProgress = false;
    if (windowState.renderQueued) {
      windowState.renderQueued = false;
      await renderPipeline();
    }
  }
}

async function executeRender(): Promise<void> {
  const graph = windowState.lastGraph!;
  if (!isGraphDiagram(graph.diagramType)) {
    displayPassthrough();
    return;
  }
  const merged = mergeSidecarIntoGraph(graph, renderDeps.sidecar);
  const layout = await computeLayout(merged);
  windowState.lastLayout = layout;
  const svg = compose(layout, renderDeps.cachedFragments, renderDeps.cachedEdges);
  displaySvg(svg);
  windowState.lastSvg = svg;
  windowState.error = null;
  getErrorBoundary().handleRenderSuccess(svg);
}

function displayPassthrough(): void {
  if (!renderDeps.passthroughSvg) return;
  const container = document.getElementById('app');
  if (!container) return;
  container.innerHTML = renderDeps.passthroughSvg;
  const svg = container.querySelector('svg') as SVGElement | null;
  windowState.lastSvg = svg;
}

function displaySvg(svg: SVGSVGElement): void {
  const container = document.getElementById('app');
  if (!container) return;
  container.innerHTML = '';
  container.appendChild(svg);
}

async function readSidecar(mmdPath: string): Promise<SidecarData | null> {
  const sidecarPath = await invoke<string>('get_sidecar_path', { mmdPath });
  windowState.sidecarPath = sidecarPath;
  try {
    const content = await invoke<string>('read_file', { path: sidecarPath });
    return loadSidecar(content);
  } catch {
    return loadSidecar(null);
  }
}

export async function handleMmdChange(path: string): Promise<void> {
  windowState.filePath = path;
  try {
    const content = await invoke<string>('read_file', { path });
    const result = await parse(content);
    windowState.lastGraph = result.graph;
    windowState.isEditingAllowed = isGraphDiagram(result.graph.diagramType);
    renderDeps.cachedFragments = result.nodeSvgFragments;
    renderDeps.cachedEdges = result.graph.edges;
    renderDeps.passthroughSvg = result.passthroughSvg ?? null;
    renderDeps.sidecar = windowState.isEditingAllowed ? await readSidecar(path) : null;
    await renderPipeline();
  } catch (err) {
    handlePipelineError(err);
  }
}

export async function handleSidecarChange(path: string): Promise<void> {
  if (isWriteLocked(path)) return;
  try {
    const content = await invoke<string>('read_file', { path });
    renderDeps.sidecar = loadSidecar(content);
  } catch {
    renderDeps.sidecar = null;
  }
  await renderPipeline();
}

function handlePipelineError(err: unknown): void {
  const message = err instanceof Error ? err.message : String(err);
  windowState.error = message;
  if (err instanceof MermaidParseError) {
    getErrorBoundary().showError(message);
  }
}

export async function onFileChanged(payload: FileChangedPayload): Promise<void> {
  if (payload.kind === 'mmd') {
    await handleMmdChange(payload.path);
  } else if (payload.kind === 'sidecar') {
    await handleSidecarChange(payload.path);
  }
}

export async function onWindowFileOpened(path: string): Promise<void> {
  await handleMmdChange(path);
}

listen<FileChangedPayload>('file-changed', (event) => {
  onFileChanged(event.payload).catch(console.error);
});

listen<{ path: string }>('window-file-opened', (event) => {
  onWindowFileOpened(event.payload.path).catch(console.error);
});
