// Feature: admin-collections-management
// Property-based tests for saveCollections and saveCollectionsHeading server actions

/**
 * Property tests covering:
 *   Property 1: Serialization round-trip preserves all card data
 *   Property 2: Invalid card data is always rejected without persistence
 *   Property 3: Array bounds are enforced
 *   Property 7: Non-admin callers are always rejected
 *   Property 8: Successful save always triggers homepage cache revalidation
 *   Property 10: Heading validation rejects strings exceeding 60 characters
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// ─── Module mock setup ────────────────────────────────────────────────────────
// Use vi.hoisted so mock variables are available inside the vi.mock factories,
// which are hoisted to the top of the file by vitest.

const { mockGetServerSession, mockRevalidatePath, mockUpsert, mockFindUnique } = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
  mockRevalidatePath: vi.fn(),
  mockUpsert: vi.fn(),
  mockFindUnique: vi.fn(),
}));

vi.mock('next-auth', () => ({
  getServerSession: mockGetServerSession,
}));

vi.mock('next/cache', () => ({
  revalidatePath: mockRevalidatePath,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    contentBlock: {
      upsert: mockUpsert,
      findUnique: mockFindUnique,
    },
  },
}));

// Import AFTER setting up the mocks so the action resolves our mocks.
import { saveCollections, saveCollectionsHeading } from '@/actions/admin/collections';
import type { CollectionCard } from '@/actions/admin/collections';
import { getAdminCollections } from '@/lib/collections';

// ─── Shared admin session ────────────────────────────────────────────────────
const adminSession = {
  user: { role: 'ADMIN', email: 'admin@lusso.co.za' },
  expires: '2099-01-01',
};

// ─── Generators ──────────────────────────────────────────────────────────────

/**
 * Generates a valid CollectionCard with all fields satisfying validation rules.
 */
function validCollectionCard(displayOrder: number = 0): fc.Arbitrary<CollectionCard> {
  return fc.record({
    title: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
    description: fc.string({ minLength: 0, maxLength: 150 }),
    imageUrl: fc.string({ minLength: 0, maxLength: 200 }),
    filterParam: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
    displayOrder: fc.constant(displayOrder),
  });
}

/**
 * Generates a valid array of CollectionCards with sequential displayOrder.
 */
function validCardArray(min: number = 1, max: number = 6): fc.Arbitrary<CollectionCard[]> {
  return fc.integer({ min, max }).chain((length) =>
    fc.tuple(...Array.from({ length }, (_, i) => validCollectionCard(i))),
  );
}

/**
 * Generates a CollectionCard with at least one validation violation.
 */
function invalidCollectionCard(): fc.Arbitrary<CollectionCard> {
  return fc.oneof(
    // Empty title
    fc.record({
      title: fc.constant(''),
      description: fc.string({ minLength: 0, maxLength: 150 }),
      imageUrl: fc.string({ minLength: 0, maxLength: 200 }),
      filterParam: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
      displayOrder: fc.constant(0),
    }),
    // Whitespace-only title
    fc.record({
      title: fc.array(fc.constantFrom(' ', '\t', '\n'), { minLength: 1, maxLength: 10 }).map((chars) => chars.join('')),
      description: fc.string({ minLength: 0, maxLength: 150 }),
      imageUrl: fc.string({ minLength: 0, maxLength: 200 }),
      filterParam: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
      displayOrder: fc.constant(0),
    }),
    // Title > 50 chars
    fc.record({
      title: fc.string({ minLength: 51, maxLength: 100 }).filter((s) => s.trim().length > 0),
      description: fc.string({ minLength: 0, maxLength: 150 }),
      imageUrl: fc.string({ minLength: 0, maxLength: 200 }),
      filterParam: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
      displayOrder: fc.constant(0),
    }),
    // Description > 150 chars
    fc.record({
      title: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
      description: fc.string({ minLength: 151, maxLength: 300 }),
      imageUrl: fc.string({ minLength: 0, maxLength: 200 }),
      filterParam: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
      displayOrder: fc.constant(0),
    }),
    // Empty filterParam
    fc.record({
      title: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
      description: fc.string({ minLength: 0, maxLength: 150 }),
      imageUrl: fc.string({ minLength: 0, maxLength: 200 }),
      filterParam: fc.constant(''),
      displayOrder: fc.constant(0),
    }),
    // Whitespace-only filterParam
    fc.record({
      title: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
      description: fc.string({ minLength: 0, maxLength: 150 }),
      imageUrl: fc.string({ minLength: 0, maxLength: 200 }),
      filterParam: fc.array(fc.constantFrom(' ', '\t', '\n'), { minLength: 1, maxLength: 10 }).map((chars) => chars.join('')),
      displayOrder: fc.constant(0),
    }),
  );
}

/**
 * Generates sessions that are NOT valid ADMIN sessions.
 */
function nonAdminSession(): fc.Arbitrary<unknown> {
  return fc.oneof(
    fc.constant(null),
    fc.constant(undefined),
    fc.constant({}),
    fc.constant({ user: null }),
    fc.constant({ user: { role: 'CUSTOMER', email: 'user@test.com' } }),
    fc.constant({ user: { email: 'norole@test.com' } }),
    fc.constant({ user: { role: 'customer', email: 'lowercase@test.com' } }),
    fc.constant({ user: { role: '', email: 'empty@test.com' } }),
  );
}

// ─── Property 1: Serialization round-trip preserves all card data ─────────────

describe('Property 1: Serialization round-trip preserves all card data', () => {
  // **Validates: Requirements 1.1, 1.2, 1.5, 7.1**

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue(adminSession);
    mockUpsert.mockResolvedValue({ id: 'test-id', key: 'collections.cards', value: '[]' });
  });

  it('saves cards sorted by displayOrder and preserves all fields in the persisted JSON', async () => {
    await fc.assert(
      fc.asyncProperty(validCardArray(1, 6), async (cards) => {
        mockUpsert.mockClear();
        mockRevalidatePath.mockClear();

        const result = await saveCollections(cards);

        expect(result).toEqual({ success: true });
        expect(mockUpsert).toHaveBeenCalledTimes(1);

        // Extract the JSON string that was passed to upsert
        const upsertCall = mockUpsert.mock.calls[0][0];
        const persistedJson = upsertCall.create.value;
        const parsedCards: CollectionCard[] = JSON.parse(persistedJson);

        // Verify same number of cards
        expect(parsedCards).toHaveLength(cards.length);

        // Verify sorted by displayOrder ascending
        for (let i = 0; i < parsedCards.length - 1; i++) {
          expect(parsedCards[i].displayOrder).toBeLessThanOrEqual(parsedCards[i + 1].displayOrder);
        }

        // Verify all original cards are present with fields preserved
        const sortedOriginal = [...cards].sort((a, b) => a.displayOrder - b.displayOrder);
        for (let i = 0; i < parsedCards.length; i++) {
          expect(parsedCards[i].title).toBe(sortedOriginal[i].title);
          expect(parsedCards[i].description).toBe(sortedOriginal[i].description);
          expect(parsedCards[i].imageUrl).toBe(sortedOriginal[i].imageUrl);
          expect(parsedCards[i].filterParam).toBe(sortedOriginal[i].filterParam);
          expect(parsedCards[i].displayOrder).toBe(sortedOriginal[i].displayOrder);
        }
      }),
      { numRuns: 100 },
    );
  });
});

// ─── Property 2: Invalid card data is always rejected without persistence ─────

describe('Property 2: Invalid card data is always rejected without persistence', () => {
  // **Validates: Requirements 1.3, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue(adminSession);
    mockUpsert.mockResolvedValue({ id: 'test-id', key: 'collections.cards', value: '[]' });
  });

  it('returns an error and does NOT call prisma.upsert when any card has a validation violation', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate 1-5 valid cards and insert one invalid card at a random position
        fc.integer({ min: 0, max: 5 }).chain((validCount) =>
          fc.tuple(
            validCount > 0
              ? fc.tuple(...Array.from({ length: validCount }, (_, i) => validCollectionCard(i)))
              : fc.constant([] as CollectionCard[]),
            invalidCollectionCard(),
            fc.integer({ min: 0, max: validCount }),
          ),
        ),
        async ([validCards, invalidCard, insertIdx]) => {
          mockUpsert.mockClear();

          // Insert the invalid card into the array
          const cards = [...validCards];
          cards.splice(insertIdx, 0, { ...invalidCard, displayOrder: insertIdx });

          const result = await saveCollections(cards);

          expect(result).toHaveProperty('error');
          expect((result as { error: string }).error).toBeTruthy();
          expect(mockUpsert).not.toHaveBeenCalled();
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── Property 3: Array bounds are enforced ────────────────────────────────────

describe('Property 3: Array bounds are enforced', () => {
  // **Validates: Requirements 1.4, 7.6, 7.7**

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue(adminSession);
    mockUpsert.mockResolvedValue({ id: 'test-id', key: 'collections.cards', value: '[]' });
  });

  it('rejects empty arrays (length 0)', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant([]), async (cards) => {
        mockUpsert.mockClear();

        const result = await saveCollections(cards);

        expect(result).toHaveProperty('error');
        expect((result as { error: string }).error).toContain('At least one collection is required');
        expect(mockUpsert).not.toHaveBeenCalled();
      }),
      { numRuns: 100 },
    );
  });

  it('rejects arrays with length > 6', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 7, max: 20 }).chain((length) =>
          fc.tuple(...Array.from({ length }, (_, i) => validCollectionCard(i))),
        ),
        async (cards) => {
          mockUpsert.mockClear();

          const result = await saveCollections(cards);

          expect(result).toHaveProperty('error');
          expect((result as { error: string }).error).toContain('Maximum of 6 collections allowed');
          expect(mockUpsert).not.toHaveBeenCalled();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('accepts arrays with length 1–6 (no count-based rejection)', async () => {
    await fc.assert(
      fc.asyncProperty(validCardArray(1, 6), async (cards) => {
        mockUpsert.mockClear();
        mockRevalidatePath.mockClear();

        const result = await saveCollections(cards);

        // Should succeed (not rejected due to count)
        expect(result).toEqual({ success: true });
      }),
      { numRuns: 100 },
    );
  });
});

// ─── Property 7: Non-admin callers are always rejected ────────────────────────

describe('Property 7: Non-admin callers are always rejected', () => {
  // **Validates: Requirements 7.2, 7.3**

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpsert.mockResolvedValue({ id: 'test-id', key: 'collections.cards', value: '[]' });
  });

  it('returns { error: "Unauthorized" } and does not call DB write for non-admin sessions', async () => {
    await fc.assert(
      fc.asyncProperty(
        nonAdminSession(),
        validCardArray(1, 6),
        async (session, cards) => {
          mockGetServerSession.mockResolvedValue(session);
          mockUpsert.mockClear();

          const result = await saveCollections(cards);

          expect(result).toEqual({ error: 'Unauthorized' });
          expect(mockUpsert).not.toHaveBeenCalled();
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── Property 8: Successful save always triggers homepage cache revalidation ──

describe('Property 8: Successful save always triggers homepage cache revalidation', () => {
  // **Validates: Requirements 7.4**

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue(adminSession);
    mockUpsert.mockResolvedValue({ id: 'test-id', key: 'collections.cards', value: '[]' });
  });

  it('calls revalidatePath("/") exactly once after a successful save', async () => {
    await fc.assert(
      fc.asyncProperty(validCardArray(1, 6), async (cards) => {
        mockRevalidatePath.mockClear();
        mockUpsert.mockClear();

        const result = await saveCollections(cards);

        expect(result).toEqual({ success: true });
        expect(mockRevalidatePath).toHaveBeenCalledTimes(1);
        expect(mockRevalidatePath).toHaveBeenCalledWith('/');
      }),
      { numRuns: 100 },
    );
  });
});

// ─── Property 10: Heading validation rejects strings exceeding 60 characters ──

describe('Property 10: Heading validation rejects strings exceeding 60 characters', () => {
  // **Validates: Requirements 9.4**

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue(adminSession);
    mockUpsert.mockResolvedValue({ id: 'test-id', key: 'collections.heading', value: '' });
  });

  it('returns an error for headings exceeding 60 characters', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 61, maxLength: 200 }),
        async (heading) => {
          mockUpsert.mockClear();

          const result = await saveCollectionsHeading(heading);

          expect(result).toHaveProperty('error');
          expect((result as { error: string }).error).toContain('60 characters');
          expect(mockUpsert).not.toHaveBeenCalled();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('does NOT reject headings of 1–60 characters based on length', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 60 }),
        async (heading) => {
          mockUpsert.mockClear();
          mockRevalidatePath.mockClear();

          const result = await saveCollectionsHeading(heading);

          // Should succeed (not rejected for length)
          expect(result).toEqual({ success: true });
        },
      ),
      { numRuns: 100 },
    );
  });
});


// ─── Property 4: Adding a valid card to a non-full list grows the list by one ─

describe('Property 4: Adding a valid card to a non-full list grows the list by one', () => {
  // **Validates: Requirements 2.4**

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue(adminSession);
    mockUpsert.mockResolvedValue({ id: 'test-id', key: 'collections.cards', value: '[]' });
  });

  it('appending a valid card to a list of size 1–5 results in persisted length = original + 1 and contains the new card', async () => {
    await fc.assert(
      fc.asyncProperty(
        validCardArray(1, 5),
        validCollectionCard(99),
        async (existingCards, newCard) => {
          mockUpsert.mockClear();
          mockRevalidatePath.mockClear();

          // Assign the new card the next displayOrder
          const appendedCard = { ...newCard, displayOrder: existingCards.length };
          const updatedCards = [...existingCards, appendedCard];

          const result = await saveCollections(updatedCards);

          expect(result).toEqual({ success: true });
          expect(mockUpsert).toHaveBeenCalledTimes(1);

          // Extract persisted JSON
          const upsertCall = mockUpsert.mock.calls[0][0];
          const persistedJson = upsertCall.create.value;
          const parsedCards: CollectionCard[] = JSON.parse(persistedJson);

          // Verify length is exactly one greater than original
          expect(parsedCards).toHaveLength(existingCards.length + 1);

          // Verify the new card's data is present in persisted cards
          const found = parsedCards.find(
            (c) => c.title === appendedCard.title && c.filterParam === appendedCard.filterParam,
          );
          expect(found).toBeDefined();
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── Property 5: Deleting a card from a multi-card list shrinks the list by one ─

describe('Property 5: Deleting a card from a multi-card list shrinks the list by one', () => {
  // **Validates: Requirements 2.9**

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue(adminSession);
    mockUpsert.mockResolvedValue({ id: 'test-id', key: 'collections.cards', value: '[]' });
  });

  it('removing a card at a valid index from a list of size 2–6 results in persisted length = original - 1 and the deleted title is absent', async () => {
    await fc.assert(
      fc.asyncProperty(
        validCardArray(2, 6).chain((cards) =>
          fc.tuple(fc.constant(cards), fc.integer({ min: 0, max: cards.length - 1 })),
        ),
        async ([cards, removeIndex]) => {
          mockUpsert.mockClear();
          mockRevalidatePath.mockClear();

          const deletedCard = cards[removeIndex];

          // Remove card at index and renumber displayOrder sequentially
          const updatedCards = cards
            .filter((_, idx) => idx !== removeIndex)
            .map((card, idx) => ({ ...card, displayOrder: idx }));

          const result = await saveCollections(updatedCards);

          expect(result).toEqual({ success: true });
          expect(mockUpsert).toHaveBeenCalledTimes(1);

          // Extract persisted JSON
          const upsertCall = mockUpsert.mock.calls[0][0];
          const persistedJson = upsertCall.create.value;
          const parsedCards: CollectionCard[] = JSON.parse(persistedJson);

          // Verify length is exactly one less than original
          expect(parsedCards).toHaveLength(cards.length - 1);

          // Verify the deleted card's title is not present
          const titles = parsedCards.map((c) => c.title);
          expect(titles).not.toContain(deletedCard.title);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── Property 6: Swapping adjacent cards preserves all cards and only changes their order ─

describe('Property 6: Swapping adjacent cards preserves all cards and only changes their order', () => {
  // **Validates: Requirements 3.2, 3.3, 3.6**

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue(adminSession);
    mockUpsert.mockResolvedValue({ id: 'test-id', key: 'collections.cards', value: '[]' });
  });

  it('swapping two adjacent cards preserves all titles and exchanges only those two positions with sequential displayOrder', async () => {
    await fc.assert(
      fc.asyncProperty(
        validCardArray(2, 6).chain((cards) =>
          fc.tuple(fc.constant(cards), fc.integer({ min: 0, max: cards.length - 2 })),
        ),
        async ([cards, swapIndex]) => {
          mockUpsert.mockClear();
          mockRevalidatePath.mockClear();

          // Swap adjacent cards at swapIndex and swapIndex + 1
          const swappedCards = [...cards];
          const temp = swappedCards[swapIndex];
          swappedCards[swapIndex] = swappedCards[swapIndex + 1];
          swappedCards[swapIndex + 1] = temp;

          // Renumber displayOrder sequentially from 0
          const renumbered = swappedCards.map((card, idx) => ({
            ...card,
            displayOrder: idx,
          }));

          const result = await saveCollections(renumbered);

          expect(result).toEqual({ success: true });
          expect(mockUpsert).toHaveBeenCalledTimes(1);

          // Extract persisted JSON
          const upsertCall = mockUpsert.mock.calls[0][0];
          const persistedJson = upsertCall.create.value;
          const parsedCards: CollectionCard[] = JSON.parse(persistedJson);

          // Verify same set of titles exists (same length and same titles regardless of order)
          const originalTitles = cards.map((c) => c.title).sort();
          const persistedTitles = parsedCards.map((c) => c.title).sort();
          expect(persistedTitles).toEqual(originalTitles);

          // Verify the two swapped positions are exchanged
          expect(parsedCards[swapIndex].title).toBe(cards[swapIndex + 1].title);
          expect(parsedCards[swapIndex + 1].title).toBe(cards[swapIndex].title);

          // Verify displayOrder is sequential from 0
          for (let i = 0; i < parsedCards.length; i++) {
            expect(parsedCards[i].displayOrder).toBe(i);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── Property 9: Homepage renders stored card data faithfully ─────────────────

describe('Property 9: Homepage renders stored card data faithfully', () => {
  // **Validates: Requirements 6.1, 6.5**

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAdminCollections() returns cards in displayOrder sequence with all fields preserved', async () => {
    await fc.assert(
      fc.asyncProperty(validCardArray(1, 6), async (cards) => {
        mockFindUnique.mockClear();

        // Sort cards by displayOrder to get expected output
        const sorted = [...cards].sort((a, b) => a.displayOrder - b.displayOrder);

        // Mock prisma.contentBlock.findUnique to return a ContentBlock with serialized cards
        mockFindUnique.mockResolvedValue({
          id: 'block-id',
          key: 'collections.cards',
          type: 'json',
          value: JSON.stringify(cards),
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const result = await getAdminCollections();

        // Result should not be null
        expect(result).not.toBeNull();
        expect(result).toHaveLength(cards.length);

        // Verify returned in displayOrder sequence
        for (let i = 0; i < result!.length - 1; i++) {
          expect(result![i].displayOrder).toBeLessThanOrEqual(result![i + 1].displayOrder);
        }

        // Verify all fields preserved matching the sorted order
        for (let i = 0; i < result!.length; i++) {
          expect(result![i].title).toBe(sorted[i].title);
          expect(result![i].description).toBe(sorted[i].description);
          expect(result![i].imageUrl).toBe(sorted[i].imageUrl);
          expect(result![i].filterParam).toBe(sorted[i].filterParam);
          expect(result![i].displayOrder).toBe(sorted[i].displayOrder);
        }
      }),
      { numRuns: 100 },
    );
  });
});
