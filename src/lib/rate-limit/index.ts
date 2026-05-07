import { RATE_LIMIT_CONFIG } from './config';
import { MemoryRateLimitStore } from './memory-store';
import { RateLimitStore } from './store';

export { RATE_LIMIT_CONFIG } from './config';
export type { RateLimitConfig } from './config';
export type { RateLimitStore, RateLimitResult } from './store';
export { MemoryRateLimitStore } from './memory-store';

export interface RateLimitCheckResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

let storeInstance: RateLimitStore | null = null;

/**
 * Get the rate limit store instance (memory or Redis based on env).
 * Returns a singleton MemoryRateLimitStore by default.
 */
export function getRateLimitStore(): RateLimitStore {
  if (!storeInstance) {
    // Check for Redis URL but only use memory store for now
    const redisUrl = process.env.RATE_LIMIT_REDIS_URL;
    if (redisUrl) {
      // Redis store would be instantiated here in the future
      // For now, fall back to memory store
      console.warn('[RateLimit] Redis URL configured but Redis store not yet implemented. Using memory store.');
    }
    storeInstance = new MemoryRateLimitStore();
  }
  return storeInstance;
}

/**
 * Check rate limit for a given endpoint and identifier.
 * Returns whether the request is allowed and metadata for headers.
 */
export async function checkRateLimit(
  endpointKey: string,
  identifier: string
): Promise<RateLimitCheckResult> {
  const config = RATE_LIMIT_CONFIG[endpointKey];
  if (!config) {
    // No config for this endpoint — allow through
    return { allowed: true, limit: 0, remaining: 0, resetAt: 0 };
  }

  const key = `${endpointKey}:${identifier}`;
  const store = getRateLimitStore();

  try {
    const result = await store.increment(key, config.windowSeconds);
    const allowed = result.count <= config.limit;
    const remaining = Math.max(0, config.limit - result.count);

    const checkResult: RateLimitCheckResult = {
      allowed,
      limit: config.limit,
      remaining,
      resetAt: result.resetAt,
    };

    if (!allowed) {
      const now = Math.ceil(Date.now() / 1000);
      checkResult.retryAfter = Math.max(1, result.resetAt - now);
    }

    return checkResult;
  } catch (error) {
    // If store throws, allow request through and log warning
    console.warn('[RateLimit] Store error, allowing request through:', error);
    return { allowed: true, limit: config.limit, remaining: config.limit, resetAt: 0 };
  }
}

/**
 * Extract client IP from request headers.
 * Checks x-forwarded-for first, falls back to "unknown".
 */
export function extractClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP (before comma), trim whitespace
    const firstIp = forwardedFor.split(',')[0].trim();
    if (firstIp) {
      return firstIp;
    }
  }
  return 'unknown';
}

/**
 * Create a 429 Too Many Requests response with appropriate headers.
 */
export function createRateLimitResponse(result: RateLimitCheckResult): Response {
  return new Response(
    JSON.stringify({ error: 'Too Many Requests' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(result.retryAfter ?? 1),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(result.resetAt),
      },
    }
  );
}
