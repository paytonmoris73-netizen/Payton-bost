// Module-level cache — persists across component mounts for zero-lag rendering.
const store = new Map<string, { data: unknown; ts: number }>();

export function cacheGet<T>(key: string): T | undefined {
  return store.get(key)?.data as T | undefined;
}

export function cacheSet(key: string, data: unknown): void {
  store.set(key, { data, ts: Date.now() });
}

export function cacheInvalidate(prefix: string): void {
  for (const k of [...store.keys()]) {
    if (k.startsWith(prefix)) store.delete(k);
  }
}
