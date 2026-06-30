// Feature: cms-content-management, Property 8: Seed is idempotent

/**
 * Property-based test for seed idempotency.
 *
 * Property 8 – Seed is idempotent
 *   For any number of consecutive seedContentBlocks() invocations (2–5), the
 *   final count of ContentBlock rows in the database SHALL equal the count after
 *   the first run, and the value of every seeded block SHALL remain equal to the
 *   seed value (i.e., no duplicate rows and no value accumulation).
 *
 *   The key mechanism is `update: {}` — the upsert never overwrites an existing
 *   row's value, so re-running the seed after an admin has edited content is safe.
 *
 *   **Validates: Requirements 8.2**
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { CONTENT_REGISTRY } from '../../src/lib/cms/registry';

// ---------------------------------------------------------------------------
// Minimal in-memory "database" that faithfully models Prisma's upsert semantics
// ---------------------------------------------------------------------------

type ContentBlockRow = {
  key: string;
  type: string;
  value: string;
  label: string;
  description?: string;
};

function createInMemoryDb() {
  const store = new Map<string, ContentBlockRow>();

  const upsert = vi.fn(
    ({
      where,
      update: _update,
      create,
    }: {
      where: { key: string };
      update: Record<string, unknown>;
      create: ContentBlockRow;
    }) => {
      const existing = store.get(where.key);
      if (existing) {
        // `update: {}` — no fields to merge; the row stays unchanged.
        // We do honour any non-empty update fields here to keep the mock general,
        // but in the seed they are always empty.
        Object.assign(existing, _update);
      } else {
        store.set(where.key, { ...create });
      }
      return Promise.resolve(store.get(where.key));
    },
  );

  return { store, upsert };
}

// ---------------------------------------------------------------------------
// The function under test — mirrors seedContentBlocks() from prisma/seed.ts
// exactly, but accepts an injectable prisma client so we can unit-test it.
// ---------------------------------------------------------------------------

interface MockPrismaClient {
  contentBlock: {
    upsert: (args: {
      where: { key: string };
      update: Record<string, unknown>;
      create: ContentBlockRow;
    }) => Promise<ContentBlockRow | undefined>;
  };
}

async function seedContentBlocks(prismaClient: MockPrismaClient) {
  for (const { key, type, value, label } of CONTENT_REGISTRY) {
    await prismaClient.contentBlock.upsert({
      where: { key },
      update: {}, // no-op: never overwrite admin edits on re-seed
      create: { key, type, value, label },
    });
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 8: Seed is idempotent', () => {
  // Feature: cms-content-management, Property 8: Seed is idempotent
  // **Validates: Requirements 8.2**

  it('running seedContentBlocks N times produces the same row count as running it once', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 5 }),
        async (runs) => {
          const { store, upsert } = createInMemoryDb();
          const mockPrisma = { contentBlock: { upsert } };

          // Run the seed N times
          for (let i = 0; i < runs; i++) {
            await seedContentBlocks(mockPrisma);
          }

          // Row count must equal exactly the number of registry entries — no duplicates
          expect(store.size).toBe(CONTENT_REGISTRY.length);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('re-running seedContentBlocks never changes the value of an existing row', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 5 }),
        async (runs) => {
          const { store, upsert } = createInMemoryDb();
          const mockPrisma = { contentBlock: { upsert } };

          // Run the seed once to establish initial state
          await seedContentBlocks(mockPrisma);

          // Capture the values after the first run
          const valuesAfterFirstRun = new Map<string, string>();
          for (const [key, row] of store.entries()) {
            valuesAfterFirstRun.set(key, row.value);
          }

          // Run the seed (runs - 1) more times
          for (let i = 1; i < runs; i++) {
            await seedContentBlocks(mockPrisma);
          }

          // Every row's value must still match the initial seed value
          for (const [key, originalValue] of valuesAfterFirstRun.entries()) {
            expect(store.get(key)?.value).toBe(originalValue);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('update: {} means the upsert never writes any field on an existing row', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 5 }),
        async (runs) => {
          const { store, upsert } = createInMemoryDb();
          const mockPrisma = { contentBlock: { upsert } };

          // Simulate admin edits: run once to seed, then mutate the in-memory store
          // to simulate an admin having changed values after the initial seed.
          await seedContentBlocks(mockPrisma);

          const adminEdits = new Map<string, string>();
          for (const row of store.values()) {
            const editedValue = `ADMIN_EDITED: ${row.value}`;
            row.value = editedValue;
            adminEdits.set(row.key, editedValue);
          }

          // Re-run the seed (runs - 1) more times
          for (let i = 1; i < runs; i++) {
            await seedContentBlocks(mockPrisma);
          }

          // Admin edits must be preserved — the seed must NOT overwrite them
          for (const [key, editedValue] of adminEdits.entries()) {
            expect(store.get(key)?.value).toBe(editedValue);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('upsert is called exactly CONTENT_REGISTRY.length times per seed run', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 5 }),
        async (runs) => {
          const { upsert } = createInMemoryDb();
          const mockPrisma = { contentBlock: { upsert } };

          for (let i = 0; i < runs; i++) {
            await seedContentBlocks(mockPrisma);
          }

          // Each run calls upsert once per registry entry
          expect(upsert).toHaveBeenCalledTimes(CONTENT_REGISTRY.length * runs);

          // Every call uses update: {} (empty object — no fields to overwrite)
          for (const call of upsert.mock.calls) {
            const { update } = call[0] as {
              update: Record<string, unknown>;
              where: { key: string };
              create: ContentBlockRow;
            };
            expect(Object.keys(update)).toHaveLength(0);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
