// Feature: cms-content-management, Property 5: Input validation rejects all invalid values

/**
 * Property-based tests for the upsertContentBlock server action input validation.
 *
 * Property 5 – Input validation rejects all invalid values
 *   For any content key, upsertContentBlock SHALL return a validation error when:
 *   - the value is an empty string, or
 *   - the value is a string composed entirely of whitespace, or
 *   - the value length exceeds 50,000 characters.
 *
 *   Conversely, for any non-empty, non-whitespace-only value of length ≤ 50,000
 *   characters, the action SHALL NOT return a validation error for the value field.
 *
 *   prisma.contentBlock.upsert must NOT be called for any invalid input.
 *
 *   **Validates: Requirements 5.5, 5.6**
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// ─── Module mock setup ────────────────────────────────────────────────────────
// Use vi.hoisted so mock variables are available inside the vi.mock factories,
// which are hoisted to the top of the file by vitest.

const { mockGetServerSession, mockRevalidatePath, mockUpsert } = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
  mockRevalidatePath: vi.fn(),
  mockUpsert: vi.fn(),
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
    },
  },
}));

// Import AFTER setting up the mocks so the action resolves our mocks.
import { upsertContentBlock } from '@/actions/admin/content';

// ─── Shared admin session ────────────────────────────────────────────────────
// A valid ADMIN session that satisfies the requireAdmin() guard.
const adminSession = {
  user: { role: 'ADMIN', email: 'admin@lusso.co.za' },
  expires: '2099-01-01',
};

// ─── Property 5: Input validation rejects all invalid values ─────────────────

describe('Property 5: Input validation rejects all invalid values', () => {
  // Feature: cms-content-management, Property 5: Input validation rejects all invalid values
  // **Validates: Requirements 5.5, 5.6**

  beforeEach(() => {
    vi.clearAllMocks();
    // Authenticated as ADMIN — auth guard must pass so validation is reached.
    mockGetServerSession.mockResolvedValue(adminSession);
    // Resolve upsert successfully in case it is (incorrectly) called.
    mockUpsert.mockResolvedValue({ id: 'test-id', key: 'test', value: 'test' });
  });

  // ── 5a: Empty string ──────────────────────────────────────────────────────
  it('returns { error } for an empty string value and does NOT call prisma.upsert', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }), // arbitrary valid key
        async (key) => {
          const result = await upsertContentBlock(key, '');

          expect(result).toHaveProperty('error');
          expect((result as { error: string }).error).toBeTruthy();
          expect(mockUpsert).not.toHaveBeenCalled();

          // Reset call count between iterations
          mockUpsert.mockClear();
        },
      ),
      { numRuns: 100 },
    );
  });

  // ── 5b: Whitespace-only strings ───────────────────────────────────────────
  it('returns { error } for whitespace-only values and does NOT call prisma.upsert', async () => {
    // Generates non-empty strings consisting only of space, tab, or newline characters
    const whitespaceArbitrary = fc
      .array(fc.constantFrom(' ', '\t', '\n'), { minLength: 1, maxLength: 500 })
      .map((chars) => chars.join(''));

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }), // arbitrary valid key
        whitespaceArbitrary,
        async (key, whitespaceValue) => {
          const result = await upsertContentBlock(key, whitespaceValue);

          expect(result).toHaveProperty('error');
          expect((result as { error: string }).error).toBeTruthy();
          expect(mockUpsert).not.toHaveBeenCalled();

          mockUpsert.mockClear();
        },
      ),
      { numRuns: 100 },
    );
  });

  // ── 5c: Values exceeding 50,000 characters ────────────────────────────────
  it('returns { error } for values exceeding 50,000 characters and does NOT call prisma.upsert', async () => {
    // Generates strings longer than 50,000 characters
    const tooLongArbitrary = fc.string({ minLength: 50_001, maxLength: 55_000 });

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }), // arbitrary valid key
        tooLongArbitrary,
        async (key, longValue) => {
          const result = await upsertContentBlock(key, longValue);

          expect(result).toHaveProperty('error');
          expect((result as { error: string }).error).toBeTruthy();
          expect(mockUpsert).not.toHaveBeenCalled();

          mockUpsert.mockClear();
        },
      ),
      { numRuns: 50 },
    );
  });

  // ── 5d: Valid values do NOT trigger a validation error ────────────────────
  it('does NOT return a validation error for valid (non-empty, non-whitespace, ≤50k char) values', async () => {
    // Valid value: at least 1 non-whitespace character, total length ≤ 50,000
    const validValueArbitrary = fc
      .string({ minLength: 1, maxLength: 50_000 })
      .filter((v) => v.trim().length > 0);

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }), // arbitrary valid key
        validValueArbitrary,
        async (key, validValue) => {
          const result = await upsertContentBlock(key, validValue);

          // Result must NOT be a validation error (it may be { success: true } or
          // a DB/revalidation-related error, but NOT a value validation error).
          if ('error' in result) {
            const errorMsg = (result as { error: string }).error.toLowerCase();
            expect(errorMsg).not.toContain('empty');
            expect(errorMsg).not.toContain('too long');
          }

          mockUpsert.mockClear();
          mockRevalidatePath.mockClear();
        },
      ),
      { numRuns: 100 },
    );
  });
});


// ─── Property 6: Revalidation routing is correct and complete ─────────────────

/**
 * Property 6 – Revalidation routing is correct and complete
 *
 * For any content key belonging to a known section, after a successful
 * upsertContentBlock call, revalidatePath SHALL have been called with exactly
 * the set of paths specified in the routing table — no more and no fewer.
 *
 * Routing table (mirrors SECTION_ROUTES in content.ts):
 *   hero.*            → ['/']
 *   about_preview.*   → ['/']
 *   testimonials      → ['/']
 *   services          → ['/']
 *   why_lusso.*       → ['/']
 *   gallery_images    → ['/']
 *   footer.*          → ['/']
 *   business_info.*   → ['/', '/contact']
 *   about_page.*      → ['/about']
 *   experiences.*     → ['/experiences']
 *
 * **Validates: Requirements 5.4, 9.1, 9.2, 9.3, 9.4, 9.5**
 */

// ─── Full key registry (matches design.md) ────────────────────────────────────

const ALL_KEYS = [
  // hero section
  'hero.heading',
  'hero.subtext',
  'hero.cta_label',
  'hero.bg_image',
  // about_preview section
  'about_preview.heading',
  'about_preview.body_1',
  'about_preview.body_2',
  'about_preview.cta_label',
  // about_page section
  'about_page.heading',
  'about_page.intro',
  'about_page.story_heading',
  'about_page.story_body_1',
  'about_page.story_body_2',
  'about_page.story_body_3',
  'about_page.story_tagline',
  'about_page.story_image',
  'about_page.philosophy_heading',
  'about_page.philosophy_body_1',
  'about_page.philosophy_body_2',
  'about_page.philosophy_body_3',
  'about_page.philosophy_image',
  // single-key sections (no dot prefix)
  'testimonials',
  'services',
  'gallery_images',
  // business_info section
  'business_info.address',
  'business_info.hours',
  'business_info.phone',
  'business_info.phone_href',
  'business_info.email',
  'business_info.email_href',
  'business_info.map_embed_url',
  // experiences section
  'experiences.intro_1',
  'experiences.intro_2',
  'experiences.intro_3',
  'experiences.intro_tagline',
  'experiences.picnics_heading',
  'experiences.picnics_body_1',
  'experiences.picnics_body_2',
  'experiences.picnics_image',
  'experiences.scent_heading',
  'experiences.scent_body_1',
  'experiences.scent_body_2',
  'experiences.scent_image',
  // footer section
  'footer.sustainability_text',
  'footer.newsletter_heading',
  'footer.newsletter_subtext',
  // why_lusso section
  'why_lusso.heading',
  'why_lusso.items',
] as const;

/**
 * The expected revalidation paths for each key, derived from SECTION_ROUTES.
 * This is a test-local copy of the routing table to assert against the real
 * implementation without importing internal helpers.
 */
const SECTION_ROUTES: Record<string, string[]> = {
  hero: ['/'],
  about_preview: ['/'],
  testimonials: ['/'],
  services: ['/'],
  why_lusso: ['/'],
  gallery_images: ['/'],
  footer: ['/'],
  business_info: ['/', '/contact'],
  about_page: ['/about'],
  experiences: ['/experiences'],
};

function getExpectedPaths(key: string): string[] {
  const section = key.includes('.') ? key.split('.')[0] : key;
  return SECTION_ROUTES[section] ?? ['/'];
}

describe('Property 6: Revalidation routing is correct and complete', () => {
  // Feature: cms-content-management, Property 6: Revalidation routing is correct and complete
  // **Validates: Requirements 5.4, 9.1, 9.2, 9.3, 9.4, 9.5**

  beforeEach(() => {
    vi.clearAllMocks();
    // Wire ADMIN session so the auth guard always passes
    mockGetServerSession.mockResolvedValue(adminSession);
    // Simulate a successful DB upsert for every call
    mockUpsert.mockResolvedValue({ id: 'test-id', key: 'test', value: 'test' });
  });

  it('calls revalidatePath with exactly the prescribed paths for every key in the registry', async () => {
    // Use fc.constantFrom to draw uniformly from the full key registry
    const keyArbitrary = fc.constantFrom(...ALL_KEYS);
    // A valid non-empty value that will pass validation
    const validValueArb = fc
      .string({ minLength: 1, maxLength: 1000 })
      .filter((v) => v.trim().length > 0);

    await fc.assert(
      fc.asyncProperty(keyArbitrary, validValueArb, async (key, value) => {
        // Reset spy between iterations
        mockRevalidatePath.mockClear();
        mockUpsert.mockClear();

        const result = await upsertContentBlock(key, value);

        // The upsert must succeed
        expect(result).toEqual({ success: true });

        // Collect all paths that revalidatePath was called with
        const calledPaths: string[] = mockRevalidatePath.mock.calls.map(
          (call: unknown[]) => call[0] as string,
        );

        const expectedPaths = getExpectedPaths(key);

        // Must be called exactly the right number of times
        expect(calledPaths).toHaveLength(expectedPaths.length);

        // Every expected path must be present
        for (const expected of expectedPaths) {
          expect(calledPaths).toContain(expected);
        }

        // No extra paths beyond the expected set
        for (const called of calledPaths) {
          expect(expectedPaths).toContain(called);
        }
      }),
      { numRuns: 200 },
    );
  });

  it('business_info.* keys trigger BOTH "/" and "/contact"', async () => {
    const businessInfoKeys = ALL_KEYS.filter((k) => k.startsWith('business_info.'));
    const keyArbitrary = fc.constantFrom(...businessInfoKeys);
    const validValueArb = fc
      .string({ minLength: 1, maxLength: 1000 })
      .filter((v) => v.trim().length > 0);

    await fc.assert(
      fc.asyncProperty(keyArbitrary, validValueArb, async (key, value) => {
        mockRevalidatePath.mockClear();
        mockUpsert.mockClear();

        const result = await upsertContentBlock(key, value);

        expect(result).toEqual({ success: true });

        const calledPaths: string[] = mockRevalidatePath.mock.calls.map(
          (call: unknown[]) => call[0] as string,
        );

        // Must revalidate exactly two paths
        expect(calledPaths).toHaveLength(2);
        expect(calledPaths).toContain('/');
        expect(calledPaths).toContain('/contact');
      }),
      { numRuns: 50 },
    );
  });

  it('about_page.* keys trigger ONLY "/about"', async () => {
    const aboutPageKeys = ALL_KEYS.filter((k) => k.startsWith('about_page.'));
    const keyArbitrary = fc.constantFrom(...aboutPageKeys);
    const validValueArb = fc
      .string({ minLength: 1, maxLength: 1000 })
      .filter((v) => v.trim().length > 0);

    await fc.assert(
      fc.asyncProperty(keyArbitrary, validValueArb, async (key, value) => {
        mockRevalidatePath.mockClear();
        mockUpsert.mockClear();

        const result = await upsertContentBlock(key, value);

        expect(result).toEqual({ success: true });

        const calledPaths: string[] = mockRevalidatePath.mock.calls.map(
          (call: unknown[]) => call[0] as string,
        );

        // Must revalidate exactly one path: /about
        expect(calledPaths).toHaveLength(1);
        expect(calledPaths[0]).toBe('/about');
      }),
      { numRuns: 50 },
    );
  });

  it('experiences.* keys trigger ONLY "/experiences"', async () => {
    const experiencesKeys = ALL_KEYS.filter((k) => k.startsWith('experiences.'));
    const keyArbitrary = fc.constantFrom(...experiencesKeys);
    const validValueArb = fc
      .string({ minLength: 1, maxLength: 1000 })
      .filter((v) => v.trim().length > 0);

    await fc.assert(
      fc.asyncProperty(keyArbitrary, validValueArb, async (key, value) => {
        mockRevalidatePath.mockClear();
        mockUpsert.mockClear();

        const result = await upsertContentBlock(key, value);

        expect(result).toEqual({ success: true });

        const calledPaths: string[] = mockRevalidatePath.mock.calls.map(
          (call: unknown[]) => call[0] as string,
        );

        // Must revalidate exactly one path: /experiences
        expect(calledPaths).toHaveLength(1);
        expect(calledPaths[0]).toBe('/experiences');
      }),
      { numRuns: 50 },
    );
  });

  it('hero/about_preview/testimonials/services/why_lusso/gallery_images/footer keys trigger ONLY "/"', async () => {
    const homepageKeys = ALL_KEYS.filter((k) => {
      const section = k.includes('.') ? k.split('.')[0] : k;
      return ['hero', 'about_preview', 'testimonials', 'services', 'why_lusso', 'gallery_images', 'footer'].includes(section);
    });
    const keyArbitrary = fc.constantFrom(...homepageKeys);
    const validValueArb = fc
      .string({ minLength: 1, maxLength: 1000 })
      .filter((v) => v.trim().length > 0);

    await fc.assert(
      fc.asyncProperty(keyArbitrary, validValueArb, async (key, value) => {
        mockRevalidatePath.mockClear();
        mockUpsert.mockClear();

        const result = await upsertContentBlock(key, value);

        expect(result).toEqual({ success: true });

        const calledPaths: string[] = mockRevalidatePath.mock.calls.map(
          (call: unknown[]) => call[0] as string,
        );

        // Must revalidate exactly one path: /
        expect(calledPaths).toHaveLength(1);
        expect(calledPaths[0]).toBe('/');
      }),
      { numRuns: 100 },
    );
  });
});
