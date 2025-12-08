interface CacheEntry {
  value: boolean;
  timestamp: number;
}

class FeatureFlagCache {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  set(key: string, value: boolean) {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  get(key: string): boolean | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  clear() {
    this.cache.clear();
  }
}

export const featureFlagCache = new FeatureFlagCache();

