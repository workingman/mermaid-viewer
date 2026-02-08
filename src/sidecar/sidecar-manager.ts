import type { SidecarData } from '@shared/types';
import { validateSidecar } from './sidecar-schema';

export function loadSidecar(sidecarJson: string | null): SidecarData | null {
  if (sidecarJson === null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(sidecarJson);
  } catch {
    console.warn('Sidecar: malformed JSON');
    return null;
  }

  const validated = validateSidecar(parsed);
  if (validated === null) {
    console.warn('Sidecar: schema validation failed');
    return null;
  }

  return validated;
}
