// Feature: cms-content-management, Property 2: Missing key returns the supplied fallback
// Feature: cms-content-management, Property 3: JSON round-trip preserves structure
// Feature: cms-content-management, Property 7: Database unavailability yields fallback without exception

/**
 * Property-based tests for the CMS service module (src/lib/cms/service.ts).
 *
 * Three properties are verified here:
 *
 * Property 2 – Missing key returns the supplied fallback
 *   For any key absent from the database and any non-empty fallback string,
 *   getContent(key, fallback) SHALL return exactly `fallback` — never null,
 *   undefined, or ''.
 *   Validates: Requirements 2.2, 7.2
 *
 * Property 3 – JSON round-trip preserves structure
 *   For any JSON-serialisable value, storing it via findUnique mock that returns
 *   { value: JSON.stringify(generated) } and retrieving via getContentJson SHALL
 *   produce a value deeply equal to the original.
 *   Validates: Requirements 2.3
 *
 * Property 7 – Database unavailability yields fallback without exception
 *   For any key, fallback value, and simulated DB error, calling getContent or
 *   getContentJson SHALL return `fallback` and SHALL NOT throw or cause an
 *   unhandled promise rejection.
 *   Validates: Requirements 7.1
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

// ─── Module mock setup ────────────────────────────────────────────────────────
// We mock '@/lib/prisma' before importing the service so that every prisma
// call in service.ts goes through our controlled mock.
// Use vi.hoisted so mock variables are available inside the vi.mock factories,
// which are hoisted to the top of the file by vitest.

const { mockFindUnique, mockFindMany } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockFindMany: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    contentBlock: {
      findUnique: mockFindUnique,
      findMany: mockFindMany,
    },
  },
}));

// Import AFTER setting up the mock so the module resolves our mock.
import { getContent, getContentJson, getContentSection } from '@/lib/cms/service';

// ─── Property 2: Missing key returns the supplied fallback ───────────────────

describe('Property 2: Missing key returns the supplied fallback', () => {
  // Feature: cms-content-management, Property 2: Missing key returns the supplied fallback
  // **Validates: Requirements 2.2, 7.2**

  beforeEach(() => {
    vi.clearAllMocks();
    // Simulate DB row absent for every key
    mockFindUnique.mockResolvedValue(null);
  });

  it('getContent returns exactly the fallback when the key is absent', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
        ),
        async ([key, fallback]) => {
          const result = await getContent(key, fallback);

          // Must be exactly the fallback value
          expect(result).toBe(fallback);

          // Must never be null, undefined, or empty string
          expect(result).not.toBeNull();
          expect(result).not.toBeUndefined();
          expect(result).not.toBe('');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('getContent returns fallback when DB row has empty string value', async () => {
    mockFindUnique.mockResolvedValue({ key: 'some.key', value: '' });

    await fc.assert(
      fc.asyncProperty(
        fc.tuple(
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
        ),
        async ([key, fallback]) => {
          // Reset to return a row with empty value for this key
          mockFindUnique.mockResolvedValue({ key, value: '' });

          const result = await getContent(key, fallback);

          // Empty string in DB → fallback
          expect(result).toBe(fallback);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── Property 3: JSON round-trip preserves structure ─────────────────────────

describe('Property 3: JSON round-trip preserves structure', () => {
  // Feature: cms-content-management, Property 3: JSON round-trip preserves structure
  // **Validates: Requirements 2.3**

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getContentJson returns a deeply equal value to the original JSON-serialisable input', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(
          fc.string({ minLength: 1 }),
          fc.jsonValue(),
        ),
        async ([key, generated]) => {
          // Mock DB to return the JSON-stringified generated value
          mockFindUnique.mockResolvedValue({
            key,
            value: JSON.stringify(generated),
          });

          const fallback = null;
          const result = await getContentJson(key, fallback);

          // Must be deeply equal to the original generated value
          expect(result).toEqual(generated);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── Property 7: Database unavailability yields fallback without exception ────

describe('Property 7: Database unavailability yields fallback without exception', () => {
  // Feature: cms-content-management, Property 7: Database unavailability yields fallback without exception
  // **Validates: Requirements 7.1**

  beforeEach(() => {
    vi.clearAllMocks();
    // Simulate DB unavailability: both findUnique and findMany throw
    const dbError = new Error('ECONNREFUSED: database unavailable');
    mockFindUnique.mockRejectedValue(dbError);
    mockFindMany.mockRejectedValue(dbError);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('getContent returns fallback and does NOT throw when DB is unavailable', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(
          fc.string({ minLength: 1 }),
          fc.anything(),
        ),
        async ([key, fallback]) => {
          // Must not throw — await must resolve
          let result: unknown;
          let threw = false;
          try {
            result = await getContent(key, fallback as string);
          } catch {
            threw = true;
          }

          expect(threw).toBe(false);
          expect(result).toBe(fallback);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('getContentJson returns fallback and does NOT throw when DB is unavailable', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(
          fc.string({ minLength: 1 }),
          fc.anything(),
        ),
        async ([key, fallback]) => {
          // Must not throw — await must resolve
          let result: unknown;
          let threw = false;
          try {
            result = await getContentJson(key, fallback);
          } catch {
            threw = true;
          }

          expect(threw).toBe(false);
          expect(result).toBe(fallback);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('getContentSection returns a fully-fallback map and does NOT throw when DB is unavailable', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          section: fc.string({ minLength: 1 }),
          fallbacks: fc.dictionary(
            fc.string({ minLength: 1 }),
            fc.string({ minLength: 1 }),
            { minKeys: 1, maxKeys: 5 },
          ),
        }),
        async ({ section, fallbacks }) => {
          // Must not throw — await must resolve
          let result: unknown;
          let threw = false;
          try {
            result = await getContentSection(section, fallbacks);
          } catch {
            threw = true;
          }

          expect(threw).toBe(false);

          // Result must be a Map
          expect(result).toBeInstanceOf(Map);

          const map = result as Map<string, string>;

          // Every fallback key must appear in the returned map with its fallback value
          for (const [fbKey, fbValue] of Object.entries(fallbacks)) {
            expect(map.get(fbKey)).toBe(fbValue);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
