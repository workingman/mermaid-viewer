import { describe, it, expect, beforeEach, vi } from 'vitest';
import { acquireWriteLock, isWriteLocked, releaseWriteLock, clearAllLocks } from './write-lock';

describe('write-lock', () => {
  beforeEach(() => {
    clearAllLocks();
    vi.useRealTimers();
  });

  it('marks a path as locked after acquire', () => {
    acquireWriteLock('/tmp/test.sidecar.json');
    expect(isWriteLocked('/tmp/test.sidecar.json')).toBe(true);
  });

  it('returns false for unlocked path', () => {
    expect(isWriteLocked('/tmp/other.sidecar.json')).toBe(false);
  });

  it('releases lock on explicit release', () => {
    acquireWriteLock('/tmp/test.sidecar.json');
    releaseWriteLock('/tmp/test.sidecar.json');
    expect(isWriteLocked('/tmp/test.sidecar.json')).toBe(false);
  });

  it('auto-clears lock after timeout', () => {
    vi.useFakeTimers();
    acquireWriteLock('/tmp/test.sidecar.json');
    vi.advanceTimersByTime(2001);
    expect(isWriteLocked('/tmp/test.sidecar.json')).toBe(false);
  });
});
