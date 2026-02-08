import { describe, it, expect, vi } from 'vitest';
import { loadSidecar } from './sidecar-manager';

describe('loadSidecar', () => {
  it('returns null for null input', () => {
    expect(loadSidecar(null)).toBeNull();
  });

  it('returns validated SidecarData for valid JSON', () => {
    const json = JSON.stringify({ version: 1, nodes: { A: { x: 10, y: 20 } } });
    const result = loadSidecar(json);
    expect(result).toEqual({ version: 1, nodes: { A: { x: 10, y: 20 } } });
  });

  it('returns null and warns on malformed JSON', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(loadSidecar('not-json')).toBeNull();
    expect(warn).toHaveBeenCalledWith('Sidecar: malformed JSON');
    warn.mockRestore();
  });

  it('returns null when version is missing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(loadSidecar(JSON.stringify({ nodes: {} }))).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('returns null when version is wrong', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const json = JSON.stringify({ version: 2, nodes: {} });
    expect(loadSidecar(json)).toBeNull();
    warn.mockRestore();
  });

  it('returns null when node has non-numeric coordinates', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const json = JSON.stringify({ version: 1, nodes: { A: { x: 'foo', y: 10 } } });
    expect(loadSidecar(json)).toBeNull();
    warn.mockRestore();
  });

  it('returns null when node has extra properties', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const json = JSON.stringify({
      version: 1,
      nodes: { A: { x: 10, y: 20, z: 30 } },
    });
    expect(loadSidecar(json)).toBeNull();
    warn.mockRestore();
  });
});
