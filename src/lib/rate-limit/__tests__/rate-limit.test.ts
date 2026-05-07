import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRateLimitStore } from '../memory-store';
import { checkRateLimit, extractClientIp } from '../index';

describe('MemoryRateLimitStore', () => {
  let store: MemoryRateLimitStore;

  beforeEach(() => {
    store = new MemoryRateLimitStore();
  });

  it('should allow requests within the limit', async () => {
    const result = await store.increment('test:key', 60);
    expect(result.count).toBe(1);
  });

  it('should count multiple requests', async () => {
    await store.increment('test:key', 60);
    await store.increment('test:key', 60);
    const result = await store.increment('test:key', 60);
    expect(result.count).toBe(3);
  });

  it('should return null for unknown keys', async () => {
    const result = await store.get('unknown:key');
    expect(result).toBeNull();
  });
});

describe('extractClientIp', () => {
  it('should extract IP from x-forwarded-for header', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
    });
    expect(extractClientIp(request)).toBe('192.168.1.1');
  });

  it('should return first IP when multiple are present', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8, 9.10.11.12' },
    });
    expect(extractClientIp(request)).toBe('1.2.3.4');
  });

  it('should return "unknown" when no header is present', () => {
    const request = new Request('http://localhost');
    expect(extractClientIp(request)).toBe('unknown');
  });
});

describe('checkRateLimit', () => {
  it('should allow first request', async () => {
    const result = await checkRateLimit('webhook', '192.168.1.1');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(29); // 30 limit - 1 request
  });

  it('should return correct limit for checkout', async () => {
    const result = await checkRateLimit('checkout', 'user123');
    expect(result.limit).toBe(5);
    expect(result.allowed).toBe(true);
  });

  it('should allow through for unknown endpoint', async () => {
    const result = await checkRateLimit('nonexistent', 'key');
    expect(result.allowed).toBe(true);
  });
});
