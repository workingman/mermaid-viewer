const LOCK_TIMEOUT_MS = 2000;
const lockedPaths = new Set<string>();

export function acquireWriteLock(path: string): void {
  lockedPaths.add(path);
  setTimeout(() => lockedPaths.delete(path), LOCK_TIMEOUT_MS);
}

export function isWriteLocked(path: string): boolean {
  return lockedPaths.has(path);
}

export function releaseWriteLock(path: string): void {
  lockedPaths.delete(path);
}

export function clearAllLocks(): void {
  lockedPaths.clear();
}
