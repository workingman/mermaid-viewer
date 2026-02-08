import type { PositionedNode } from '@shared/types';
import { buildSidecarFromPositions } from '@sidecar/sidecar-manager';
import { acquireWriteLock, releaseWriteLock } from './write-lock';

export type InvokeFn = <T>(cmd: string, args: Record<string, unknown>) => Promise<T>;
export type ShowErrorFn = (message: string) => void;

let invokeFn: InvokeFn | null = null;
let showErrorFn: ShowErrorFn | null = null;
let mmdPath: string | null = null;

export function setSidecarPersistDeps(invoke: InvokeFn, showError: ShowErrorFn): void {
  invokeFn = invoke;
  showErrorFn = showError;
}

export function setMmdPath(path: string | null): void {
  mmdPath = path;
}

export async function persistNodePositions(nodes: PositionedNode[]): Promise<void> {
  if (!invokeFn || !mmdPath) return;

  const sidecar = buildSidecarFromPositions(nodes);
  const json = JSON.stringify(sidecar, null, 2);

  const sidecarPath = await invokeFn<string>('get_sidecar_path', {
    mmdPath,
  });

  acquireWriteLock(sidecarPath);
  try {
    await invokeFn('write_sidecar', { path: sidecarPath, content: json });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    showErrorFn?.(`Failed to save positions: ${msg}`);
  } finally {
    releaseWriteLock(sidecarPath);
  }
}
