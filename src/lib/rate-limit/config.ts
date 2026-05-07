export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Window size in seconds */
  windowSeconds: number;
  /** Key type: 'ip' or 'user' */
  keyType: 'ip' | 'user';
  /** Fallback limit for unauthenticated requests (when keyType is 'user') */
  unauthenticatedLimit?: number;
}

export const RATE_LIMIT_CONFIG: Record<string, RateLimitConfig> = {
  webhook: { limit: 30, windowSeconds: 60, keyType: 'ip' },
  auth: { limit: 20, windowSeconds: 60, keyType: 'ip' },
  orders: { limit: 30, windowSeconds: 60, keyType: 'user', unauthenticatedLimit: 10 },
  checkout: { limit: 5, windowSeconds: 60, keyType: 'user' },
};
