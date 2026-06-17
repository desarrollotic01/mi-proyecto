const _cache = new Map();

/**
 * Fetch with module-level TTL cache.
 * Same key returns cached data within ttlMs (default 5 min).
 */
export function cachedGet(key, fetchFn, ttlMs = 5 * 60 * 1000) {
  const hit = _cache.get(key);
  if (hit && Date.now() - hit.ts < ttlMs) {
    return Promise.resolve(hit.data);
  }
  return fetchFn().then((data) => {
    _cache.set(key, { data, ts: Date.now() });
    return data;
  });
}

/** Force-invalidate a cache entry (e.g. after create/update). */
export function invalidateCache(key) {
  _cache.delete(key);
}
