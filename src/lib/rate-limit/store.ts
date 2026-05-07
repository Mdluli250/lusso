export interface RateLimitResult {
  /** Number of requests in the current window */
  count: number;
  /** Unix timestamp (seconds) when the window resets */
  resetAt: number;
}

export interface RateLimitStore {
  /** Increment counter for key, return current count and window reset time */
  increment(key: string, windowSeconds: number): Promise<RateLimitResult>;
  /** Check current count without incrementing */
  get(key: string): Promise<RateLimitResult | null>;
}
