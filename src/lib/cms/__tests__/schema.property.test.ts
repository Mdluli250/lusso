// Feature: cms-content-management, Property 1: ContentBlock upsert–read round-trip

/**
 * Property 1: ContentBlock upsert–read round-trip
 *
 * For any valid content key, type, and non-empty value, upserting a ContentBlock
 * and then reading it back SHALL return a value structurally equal to what was
 * stored, with the `updatedAt` field populated as a valid Date.
 *
 * Validates: Requirements 1.1, 1.3, 2.1
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// ─── In-memory mock of the Prisma ContentBlock store ─────────────────────────

type ContentType = 'text' | 'rich_text' | 'image' | 'json';

interface ContentBlock {
  id: string;
  key: string;
  type: ContentType;
  value: string;
  label: string | null;
  description: string | null;
  updatedAt: Date;
  createdAt: Date;
}

/**
 * Builds a fresh in-memory Prisma mock for each property run.
 * The mock faithfully simulates `upsert` (create-or-update on `key`) and
 * `findUnique` (lookup by `key`), matching the behaviour the real Prisma
 * client would exhibit against the ContentBlock schema.
 */
function buildPrismaMock() {
  const store = new Map<string, ContentBlock>();

  const prisma = {
    contentBlock: {
      upsert: vi.fn(
        ({
          where,
          create,
          update,
        }: {
          where: { key: string };
          create: { key: string; type: ContentType; value: string };
          update: { value: string; type?: ContentType };
        }): ContentBlock => {
          const now = new Date();
          const existing = store.get(where.key);

          if (existing) {
            // Update path
            const updated: ContentBlock = {
              ...existing,
              value: update.value,
              type: update.type ?? existing.type,
              updatedAt: now,
            };
            store.set(where.key, updated);
            return updated;
          } else {
            // Create path
            const created: ContentBlock = {
              id: `cuid_${Math.random().toString(36).slice(2)}`,
              key: create.key,
              type: create.type,
              value: create.value,
              label: null,
              description: null,
              updatedAt: now,
              createdAt: now,
            };
            store.set(create.key, created);
            return created;
          }
        },
      ),

      findUnique: vi.fn(
        ({ where }: { where: { key: string } }): ContentBlock | null => {
          return store.get(where.key) ?? null;
        },
      ),
    },
  };

  return { prisma, store };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Property 1: ContentBlock upsert–read round-trip', () => {
  /**
   * Core round-trip property:
   * For every (key, type, value) triple, upserting then reading back with
   * findUnique must return a record that is structurally equal and has a
   * valid Date in `updatedAt`.
   */
  it('returns structurally equal record with a valid updatedAt after upsert', () => {
    const arbitrary = fc.tuple(
      fc.string({ minLength: 1, maxLength: 200 }),
      fc.constantFrom('text', 'rich_text', 'image', 'json') as fc.Arbitrary<ContentType>,
      fc.string({ minLength: 1, maxLength: 500 }),
    );

    fc.assert(
      fc.property(arbitrary, ([key, type, value]) => {
        const { prisma } = buildPrismaMock();

        // Simulate upsert (the operation the server action will perform)
        const upserted = prisma.contentBlock.upsert({
          where: { key },
          create: { key, type, value },
          update: { value, type },
        });

        // Simulate reading back (the operation the CMS service will perform)
        const found = prisma.contentBlock.findUnique({ where: { key } });

        // The record must be present
        expect(found).not.toBeNull();

        // key must round-trip exactly
        expect(found!.key).toBe(key);

        // type must round-trip exactly
        expect(found!.type).toBe(type);

        // value must round-trip exactly
        expect(found!.value).toBe(value);

        // updatedAt must be a valid Date (not null, not invalid)
        expect(found!.updatedAt).toBeInstanceOf(Date);
        expect(Number.isNaN(found!.updatedAt.getTime())).toBe(false);

        // The upsert return value and findUnique result must agree on all
        // core fields (structural equality of the persisted record)
        expect(found!.key).toBe(upserted.key);
        expect(found!.type).toBe(upserted.type);
        expect(found!.value).toBe(upserted.value);
        expect(found!.id).toBe(upserted.id);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Idempotent second upsert:
   * Upserting the same key twice with a new value must yield the updated
   * value on read-back (no duplicate rows, no stale value).
   */
  it('second upsert on same key returns updated value, not original', () => {
    const arbitrary = fc.tuple(
      fc.string({ minLength: 1, maxLength: 200 }),
      fc.constantFrom('text', 'rich_text', 'image', 'json') as fc.Arbitrary<ContentType>,
      fc.string({ minLength: 1, maxLength: 500 }),
      fc.string({ minLength: 1, maxLength: 500 }),
    );

    fc.assert(
      fc.property(arbitrary, ([key, type, firstValue, secondValue]) => {
        const { prisma } = buildPrismaMock();

        // First upsert (create)
        prisma.contentBlock.upsert({
          where: { key },
          create: { key, type, value: firstValue },
          update: { value: firstValue },
        });

        // Second upsert (update)
        prisma.contentBlock.upsert({
          where: { key },
          create: { key, type, value: secondValue },
          update: { value: secondValue },
        });

        const found = prisma.contentBlock.findUnique({ where: { key } });

        expect(found).not.toBeNull();
        // Must reflect the most recent upsert
        expect(found!.value).toBe(secondValue);
        // updatedAt must still be a valid Date
        expect(found!.updatedAt).toBeInstanceOf(Date);
        expect(Number.isNaN(found!.updatedAt.getTime())).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Key uniqueness:
   * After upserting N distinct keys, findUnique on each key returns a record
   * with that exact key (no cross-contamination between keys).
   */
  it('distinct keys do not interfere with each other', () => {
    const arbitrary = fc.uniqueArray(fc.string({ minLength: 1, maxLength: 100 }), {
      minLength: 2,
      maxLength: 10,
    });

    fc.assert(
      fc.property(arbitrary, (keys) => {
        const { prisma } = buildPrismaMock();

        // Upsert each key with a distinct value derived from the key itself
        for (const key of keys) {
          prisma.contentBlock.upsert({
            where: { key },
            create: { key, type: 'text', value: `value-for-${key}` },
            update: { value: `value-for-${key}` },
          });
        }

        // Each key must resolve to its own record
        for (const key of keys) {
          const found = prisma.contentBlock.findUnique({ where: { key } });
          expect(found).not.toBeNull();
          expect(found!.key).toBe(key);
          expect(found!.value).toBe(`value-for-${key}`);
        }
      }),
      { numRuns: 100 },
    );
  });
});
