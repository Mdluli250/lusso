import { RateLimitStore, RateLimitResult } from './store';

export class MemoryRateLimitStore implements RateLimitStore {
  private windows: Map<string, { timestamps: number[] }> = new Map();

  async increment(key: string, windowSeconds: number): Promise<RateLimitResult> {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const cutoff = now - windowMs;

    let entry = this.windows.get(key);
    if (!entry) {
      entry = { timestamps: [] };
      this.windows.set(key, entry);
    }

    // Filter out timestamps older than the window
    entry.timestamps = entry.timestamps.filter((ts) => ts > cutoff);

    // Add current timestamp
    entry.timestamps.push(now);

    // resetAt is the time when the oldest timestamp in the window expires
    const oldestTimestamp = entry.timestamps[0];
    const resetAt = Math.ceil((oldestTimestamp + windowMs) / 1000);

    return {
      count: entry.timestamps.length,
      resetAt,
    };
  }

  async get(key: string): Promise<RateLimitResult | null> {
    const entry = this.windows.get(key);
    if (!entry || entry.timestamps.length === 0) {
      return null;
    }

    // We don't know the window size here, so return current state
    // The caller should filter based on their own window
    const now = Date.now();
    // Return count of all stored timestamps (caller is responsible for context)
    return {
      count: entry.timestamps.length,
      resetAt: Math.ceil(entry.timestamps[0] / 1000),
    };
  }
}
