import './styles/main.css';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { parse } from '@mermaid-parser/mermaid-parser';
import { loadSidecar, mergeSidecarIntoGraph } from '@sidecar/sidecar-manager';
import { computeLayout } from '@layout-engine/layout-engine';
import { compose } from '@svg-compositor/svg-compositor';
import type { ParsedGraph, ParsedEdge, SidecarData } from '@shared/types';

document.title = 'Mermaid Viewer';

interface FileChangedPayload {
  path: string;
  kind: 'mmd' | 'sidecar';
}

interface AppState {
  mmdPath: string | null;
  cachedGraph: ParsedGraph | null;
  cachedFragments: Map<string, string>;
  cachedEdges: ParsedEdge[];
  sidecar: SidecarData | null;
}

const state: AppState = {
  mmdPath: null,
  cachedGraph: null,
  cachedFragments: new Map(),
  cachedEdges: [],
  sidecar: null,
};

async function readSidecarForMmd(mmdPath: string): Promise<SidecarData | null> {
  const sidecarPath = await invoke<string>('get_sidecar_path', { mmdPath });
  try {
    const content = await invoke<string>('read_file', { path: sidecarPath });
    return loadSidecar(content);
  } catch {
    return loadSidecar(null);
  }
}

async function renderPipeline(): Promise<void> {
  if (!state.cachedGraph) return;
  const merged = mergeSidecarIntoGraph(state.cachedGraph, state.sidecar);
  const layout = await computeLayout(merged);
  const svg = compose(layout, state.cachedFragments, state.cachedEdges);
  displaySvg(svg);
}

function displaySvg(svg: SVGSVGElement): void {
  const container = document.getElementById('app');
  if (!container) return;
  container.innerHTML = '';
  container.appendChild(svg);
}

async function handleMmdChange(path: string): Promise<void> {
  state.mmdPath = path;
  const content = await invoke<string>('read_file', { path });
  const result = await parse(content);
  state.cachedGraph = result.graph;
  state.cachedFragments = result.nodeSvgFragments;
  state.cachedEdges = result.graph.edges;
  state.sidecar = await readSidecarForMmd(path);
  await renderPipeline();
}

async function handleSidecarChange(path: string): Promise<void> {
  try {
    const content = await invoke<string>('read_file', { path });
    state.sidecar = loadSidecar(content);
  } catch {
    state.sidecar = null;
  }
  await renderPipeline();
}

async function onFileChanged(payload: FileChangedPayload): Promise<void> {
  if (payload.kind === 'mmd') {
    await handleMmdChange(payload.path);
  } else if (payload.kind === 'sidecar') {
    await handleSidecarChange(payload.path);
  }
}

listen<FileChangedPayload>('file-changed', (event) => {
  onFileChanged(event.payload).catch(console.error);
});

export { state, onFileChanged, renderPipeline, handleMmdChange, handleSidecarChange };
