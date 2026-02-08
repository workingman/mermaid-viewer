import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@layout-engine/edge-rerouter', () => ({
  computeEdgeOnlyLayout: vi.fn().mockResolvedValue([]),
}));

vi.mock('@svg-compositor/edge-patcher', () => ({
  patchEdgePaths: vi.fn(),
}));

// Stub rAF/cAF for Node environment
globalThis.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
  return setTimeout(() => cb(0), 0) as unknown as number;
});
globalThis.cancelAnimationFrame = vi.fn((id: number) => {
  clearTimeout(id);
});

const { setRerouteDeps, clearRerouteDeps, scheduleEdgeReroute, cancelPending } =
  await import('./edge-reroute-bridge');

describe('scheduleEdgeReroute', () => {
  beforeEach(() => {
    clearRerouteDeps();
    vi.mocked(globalThis.requestAnimationFrame).mockClear();
    vi.mocked(globalThis.cancelAnimationFrame).mockClear();
  });

  it('calls requestAnimationFrame once per schedule', () => {
    setRerouteDeps(
      () => [],
      () => [],
      () => null,
    );

    scheduleEdgeReroute();
    scheduleEdgeReroute();

    expect(globalThis.requestAnimationFrame).toHaveBeenCalledTimes(1);
  });
});

describe('cancelPending', () => {
  beforeEach(() => {
    clearRerouteDeps();
    vi.mocked(globalThis.requestAnimationFrame).mockClear();
    vi.mocked(globalThis.cancelAnimationFrame).mockClear();
  });

  it('cancels a pending animation frame', () => {
    const mockId = 42;
    vi.mocked(globalThis.requestAnimationFrame).mockReturnValue(mockId);
    setRerouteDeps(
      () => [],
      () => [],
      () => null,
    );

    scheduleEdgeReroute();
    cancelPending();

    expect(globalThis.cancelAnimationFrame).toHaveBeenCalledWith(mockId);
  });
});
