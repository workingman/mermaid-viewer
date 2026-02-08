import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { PositionedNode } from '@shared/types';
import { setSidecarPersistDeps, setMmdPath, persistNodePositions } from './sidecar-persistence';

describe('persistNodePositions', () => {
  const mockInvoke = vi.fn();
  const mockShowError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockInvoke.mockReset();
    setSidecarPersistDeps(mockInvoke, mockShowError);
    setMmdPath('/project/diagram.mmd');
  });

  it('calls buildSidecarFromPositions and write_sidecar', async () => {
    mockInvoke.mockResolvedValueOnce('/project/diagram.sidecar.json');
    mockInvoke.mockResolvedValueOnce(undefined);

    const nodes: PositionedNode[] = [{ id: 'A', x: 10, y: 20, width: 100, height: 50 }];
    await persistNodePositions(nodes);

    expect(mockInvoke).toHaveBeenCalledWith('get_sidecar_path', {
      mmdPath: '/project/diagram.mmd',
    });
    expect(mockInvoke).toHaveBeenCalledWith('write_sidecar', {
      path: '/project/diagram.sidecar.json',
      content: expect.stringContaining('"A"'),
    });
  });

  it('shows error banner on write failure', async () => {
    mockInvoke.mockResolvedValueOnce('/project/diagram.sidecar.json');
    mockInvoke.mockRejectedValueOnce(new Error('Disk full'));

    await persistNodePositions([{ id: 'A', x: 10, y: 20, width: 100, height: 50 }]);

    expect(mockShowError).toHaveBeenCalledWith(expect.stringContaining('Disk full'));
  });

  it('does nothing when no mmd path is set', async () => {
    setMmdPath(null);
    await persistNodePositions([{ id: 'A', x: 10, y: 20, width: 100, height: 50 }]);
    expect(mockInvoke).not.toHaveBeenCalled();
  });
});
