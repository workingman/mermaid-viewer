import type { SidecarData } from '@shared/types';

export function validateSidecar(data: unknown): SidecarData | null {
  if (!isObject(data)) return null;
  if (data.version !== 1) return null;
  if (!isObject(data.nodes)) return null;
  if (!hasOnlyValidNodes(data.nodes as Record<string, unknown>)) return null;
  return data as unknown as SidecarData;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasOnlyValidNodes(nodes: Record<string, unknown>): boolean {
  return Object.values(nodes).every(isValidNodePosition);
}

function isValidNodePosition(entry: unknown): boolean {
  if (!isObject(entry)) return false;
  const keys = Object.keys(entry);
  if (keys.length !== 2) return false;
  return typeof entry.x === 'number' && typeof entry.y === 'number';
}
