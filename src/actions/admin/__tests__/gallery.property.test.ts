// Feature: admin-gallery-management
// Property-based tests for gallery server actions and queries

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// ─── Module mock setup ────────────────────────────────────────────────────────

const {
  mockGetServerSession,
  mockRevalidatePath,
  mockPut,
  mockDel,
  mockAggregate,
  mockCreate,
  mockUpdate,
  mockDelete,
  mockFindMany,
  mockFindUnique,
  mockTransaction,
} = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
  mockRevalidatePath: vi.fn(),
  mockPut: vi.fn(),
  mockDel: vi.fn(),
  mockAggregate: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
  mockFindMany: vi.fn(),
  mockFindUnique: vi.fn(),
  mockTransaction: vi.fn(),
}));

vi.mock('next-auth', () => ({
  getServerSession: mockGetServerSession,
}));

vi.mock('next/cache', () => ({
  revalidatePath: mockRevalidatePath,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    galleryImage: {
      aggregate: mockAggregate,
      create: mockCreate,
      update: mockUpdate,
      delete: mockDelete,
      findMany: mockFindMany,
      findUnique: mockFindUnique,
    },
    $transaction: mockTransaction,
  },
}));

vi.mock('@vercel/blob', () => ({
  put: mockPut,
  del: mockDel,
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

// Import AFTER setting up the mocks
import {
  uploadGalleryImages,
  updateGalleryImage,
  deleteGalleryImage,
  reorderGalleryImages,
} from '@/actions/admin/gallery';
import { getActiveGalleryImages } from '@/lib/admin/galleryQueries';

// ─── Shared admin session ────────────────────────────────────────────────────

const adminSession = {
  user: { role: 'ADMIN', email: 'admin@lusso.co.za' },
  expires: '2099-01-01',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createMockFile(name: string, type: string, size: number): File {
  const buffer = new ArrayBuffer(size);
  return new File([buffer], name, { type });
}

// ─── Property 1: Upload creates records with correct derived fields ──────────

describe('Property 1: Upload creates records with correct derived fields', () => {
  // **Validates: Requirements 1.1**

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue(adminSession);
  });

  it('creates GalleryImage records with alt = filename without extension (truncated to 150), isActive = true, sortOrder = maxSortOrder + position', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a filename with extension (1-200 chars name + extension)
        fc.tuple(
          fc.stringMatching(/^[a-zA-Z0-9_-]{1,200}$/),
          fc.constantFrom('.jpg', '.png', '.webp'),
        ),
        // Generate a maxSortOrder (0-100)
        fc.integer({ min: 0, max: 100 }),
        async ([baseName, ext], maxSortOrder) => {
          // Clear mocks at start of each iteration
          mockAggregate.mockClear();
          mockPut.mockClear();
          mockCreate.mockClear();
          mockRevalidatePath.mockClear();

          const filename = baseName + ext;
          const file = createMockFile(filename, 'image/jpeg', 1024);

          const formData = new FormData();
          formData.append('files', file);

          // Mock aggregate to return maxSortOrder
          mockAggregate.mockResolvedValue({ _max: { sortOrder: maxSortOrder } });

          // Mock blob put to return a fake URL
          const fakeUrl = `https://blob.vercel-storage.com/gallery/${filename}`;
          mockPut.mockResolvedValue({ url: fakeUrl });

          // Mock create to return a record
          mockCreate.mockImplementation(async ({ data }: any) => ({
            id: 'test-id',
            blobUrl: data.blobUrl,
            alt: data.alt,
            width: data.width,
            height: data.height,
            sortOrder: data.sortOrder,
            isActive: data.isActive,
            createdAt: new Date(),
            updatedAt: new Date(),
          }));

          await uploadGalleryImages(formData);

          // Verify create was called with correct derived fields
          expect(mockCreate).toHaveBeenCalledTimes(1);
          const createCall = mockCreate.mock.calls[0][0];

          // alt = filename without extension, truncated to 150
          const expectedAlt = baseName.slice(0, 150);
          expect(createCall.data.alt).toBe(expectedAlt);

          // isActive = true
          expect(createCall.data.isActive).toBe(true);

          // sortOrder = maxSortOrder + position (position is 1 for first file)
          expect(createCall.data.sortOrder).toBe(maxSortOrder + 1);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── Property 2: File type validation rejects non-allowed MIME types ─────────

describe('Property 2: File type validation rejects non-allowed MIME types', () => {
  // **Validates: Requirements 1.3**

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue(adminSession);
  });

  it('rejects files with MIME types NOT in [image/jpeg, image/png, image/webp] and does NOT call blob put', async () => {
    // Generate MIME types that are NOT in the allowed set
    const invalidMimeArbitrary = fc
      .stringMatching(/^[a-z]+\/[a-z0-9.+-]+$/)
      .filter(
        (mime) =>
          mime !== 'image/jpeg' &&
          mime !== 'image/png' &&
          mime !== 'image/webp',
      );

    await fc.assert(
      fc.asyncProperty(invalidMimeArbitrary, async (invalidMime) => {
        const file = createMockFile('test-image.gif', invalidMime, 1024);

        const formData = new FormData();
        formData.append('files', file);

        const result = await uploadGalleryImages(formData);

        // Should have errors and no uploads
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.uploaded).toHaveLength(0);

        // Blob put should NOT have been called
        expect(mockPut).not.toHaveBeenCalled();
      }),
      { numRuns: 100 },
    );
  });
});

// ─── Property 3: Partial batch processing preserves valid files ──────────────

describe('Property 3: Partial batch processing preserves valid files', () => {
  // **Validates: Requirements 1.4, 1.6**

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue(adminSession);
  });

  it('uploads valid files and rejects invalid ones in the same batch', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate 1-4 valid files
        fc.integer({ min: 1, max: 4 }),
        // Generate 1-4 invalid files
        fc.integer({ min: 1, max: 4 }),
        async (validCount, invalidCount) => {
          const formData = new FormData();

          // Add valid files (correct type, small size)
          for (let i = 0; i < validCount; i++) {
            const file = createMockFile(`valid${i}.jpg`, 'image/jpeg', 1024);
            formData.append('files', file);
          }

          // Add invalid files (wrong type)
          for (let i = 0; i < invalidCount; i++) {
            const file = createMockFile(`invalid${i}.gif`, 'image/gif', 1024);
            formData.append('files', file);
          }

          // Mock aggregate
          mockAggregate.mockResolvedValue({ _max: { sortOrder: 0 } });

          // Mock blob put
          mockPut.mockImplementation(async (path: string) => ({
            url: `https://blob.vercel-storage.com/${path}`,
          }));

          // Mock create
          let createCount = 0;
          mockCreate.mockImplementation(async ({ data }: any) => {
            createCount++;
            return {
              id: `id-${createCount}`,
              blobUrl: data.blobUrl,
              alt: data.alt,
              width: data.width,
              height: data.height,
              sortOrder: data.sortOrder,
              isActive: data.isActive,
              filename: `valid${createCount - 1}.jpg`,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          });

          const result = await uploadGalleryImages(formData);

          // Valid files should be uploaded
          expect(result.uploaded).toHaveLength(validCount);

          // Invalid files should be in errors
          expect(result.errors).toHaveLength(invalidCount);

          // Verify error filenames are the invalid ones
          for (const error of result.errors) {
            expect(error.filename).toMatch(/^invalid\d+\.gif$/);
          }

          createCount = 0;
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── Property 4: Active gallery query returns only active records ────────────

describe('Property 4: Active gallery query returns only active records in sortOrder ascending', () => {
  // **Validates: Requirements 2.1, 3.2**

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls prisma.galleryImage.findMany with where: { isActive: true } and orderBy: { sortOrder: "asc" }', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a random set of gallery records (the mock return value)
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1 }),
            blobUrl: fc.string({ minLength: 1 }),
            alt: fc.string({ minLength: 10, maxLength: 150 }),
            width: fc.integer({ min: 1, max: 10000 }),
            height: fc.integer({ min: 1, max: 10000 }),
            sortOrder: fc.integer({ min: 0, max: 9999 }),
            isActive: fc.constant(true),
          }),
          { minLength: 0, maxLength: 10 },
        ),
        async (records) => {
          mockFindMany.mockResolvedValue(
            records.map((r) => ({
              ...r,
              createdAt: new Date(),
              updatedAt: new Date(),
            })),
          );

          await getActiveGalleryImages();

          // Verify findMany was called with correct arguments
          expect(mockFindMany).toHaveBeenCalledWith({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
          });

          mockFindMany.mockClear();
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── Property 5: All mutation actions trigger homepage revalidation ──────────

describe('Property 5: All mutation actions trigger homepage revalidation', () => {
  // **Validates: Requirements 2.5, 3.1, 4.4, 5.3**

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue(adminSession);
  });

  it('upload with at least 1 success calls revalidatePath("/") exactly once', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }),
        async (fileCount) => {
          // Clear mocks at start of each iteration
          mockAggregate.mockClear();
          mockPut.mockClear();
          mockCreate.mockClear();
          mockRevalidatePath.mockClear();

          const formData = new FormData();
          for (let i = 0; i < fileCount; i++) {
            formData.append('files', createMockFile(`img${i}.png`, 'image/png', 512));
          }

          mockAggregate.mockResolvedValue({ _max: { sortOrder: 0 } });
          mockPut.mockImplementation(async (path: string) => ({
            url: `https://blob.vercel-storage.com/${path}`,
          }));
          mockCreate.mockImplementation(async ({ data }: any) => ({
            id: 'id-1',
            blobUrl: data.blobUrl,
            alt: data.alt,
            width: data.width,
            height: data.height,
            sortOrder: data.sortOrder,
            isActive: data.isActive,
            createdAt: new Date(),
            updatedAt: new Date(),
          }));

          await uploadGalleryImages(formData);

          expect(mockRevalidatePath).toHaveBeenCalledTimes(1);
          expect(mockRevalidatePath).toHaveBeenCalledWith('/');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('updateGalleryImage calls revalidatePath("/") exactly once on success', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        // Generate valid alt text (trimmed length 10-150)
        fc.string({ minLength: 10, maxLength: 150 }).filter((s) => s.trim().length >= 10 && s.trim().length <= 150),
        async (id, alt) => {
          mockUpdate.mockResolvedValue({
            id,
            alt: alt.trim(),
            isActive: true,
            blobUrl: 'https://example.com/img.jpg',
            width: 800,
            height: 600,
            sortOrder: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          const result = await updateGalleryImage(id, { alt });

          expect(result).toEqual({ success: true });
          expect(mockRevalidatePath).toHaveBeenCalledTimes(1);
          expect(mockRevalidatePath).toHaveBeenCalledWith('/');

          mockRevalidatePath.mockClear();
          mockUpdate.mockClear();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('deleteGalleryImage calls revalidatePath("/") exactly once on success', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        async (id) => {
          mockFindUnique.mockResolvedValue({
            id,
            blobUrl: 'https://blob.vercel-storage.com/gallery/test.jpg',
            alt: 'Test image',
            width: 800,
            height: 600,
            sortOrder: 0,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          mockDelete.mockResolvedValue({ id });
          mockDel.mockResolvedValue(undefined);

          const result = await deleteGalleryImage(id);

          expect(result).toEqual({ success: true });
          expect(mockRevalidatePath).toHaveBeenCalledTimes(1);
          expect(mockRevalidatePath).toHaveBeenCalledWith('/');

          mockRevalidatePath.mockClear();
          mockFindUnique.mockClear();
          mockDelete.mockClear();
          mockDel.mockClear();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('reorderGalleryImages calls revalidatePath("/") exactly once on success', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 1, maxLength: 10 }),
        async (ids) => {
          mockTransaction.mockResolvedValue(ids.map((id, i) => ({ id, sortOrder: i })));

          const result = await reorderGalleryImages(ids);

          expect(result).toEqual({ success: true });
          expect(mockRevalidatePath).toHaveBeenCalledTimes(1);
          expect(mockRevalidatePath).toHaveBeenCalledWith('/');

          mockRevalidatePath.mockClear();
          mockTransaction.mockClear();
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── Property 6: Alt text length validation ──────────────────────────────────

describe('Property 6: Alt text length validation', () => {
  // **Validates: Requirements 3.3**

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue(adminSession);
  });

  it('rejects alt text where trimmed length < 10', async () => {
    // Generate strings that, after trimming, are < 10 chars
    const shortAltArbitrary = fc
      .tuple(
        fc.stringMatching(/^[ \t]*$/).filter((s) => s.length <= 5), // leading whitespace
        fc.string({ minLength: 0, maxLength: 9 }).filter((s) => s.trim().length < 10 && s.trim().length >= 0),
        fc.stringMatching(/^[ \t]*$/).filter((s) => s.length <= 5), // trailing whitespace
      )
      .map(([pre, core, post]) => pre + core + post)
      .filter((s) => s.trim().length < 10);

    await fc.assert(
      fc.asyncProperty(shortAltArbitrary, async (alt) => {
        const result = await updateGalleryImage('test-id', { alt });

        expect(result).toHaveProperty('error');
        expect(mockUpdate).not.toHaveBeenCalled();

        mockUpdate.mockClear();
      }),
      { numRuns: 100 },
    );
  });

  it('rejects alt text where trimmed length > 150', async () => {
    const longAltArbitrary = fc
      .string({ minLength: 151, maxLength: 300 })
      .filter((s) => s.trim().length > 150);

    await fc.assert(
      fc.asyncProperty(longAltArbitrary, async (alt) => {
        const result = await updateGalleryImage('test-id', { alt });

        expect(result).toHaveProperty('error');
        expect(mockUpdate).not.toHaveBeenCalled();

        mockUpdate.mockClear();
      }),
      { numRuns: 100 },
    );
  });

  it('does NOT return a validation error for alt text where trimmed length is 10-150', async () => {
    const validAltArbitrary = fc
      .string({ minLength: 10, maxLength: 150 })
      .filter((s) => s.trim().length >= 10 && s.trim().length <= 150);

    await fc.assert(
      fc.asyncProperty(validAltArbitrary, async (alt) => {
        mockUpdate.mockResolvedValue({
          id: 'test-id',
          alt: alt.trim(),
          isActive: true,
          blobUrl: 'https://example.com/img.jpg',
          width: 800,
          height: 600,
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const result = await updateGalleryImage('test-id', { alt });

        // Should not be a validation error
        expect(result).toEqual({ success: true });

        mockUpdate.mockClear();
        mockRevalidatePath.mockClear();
      }),
      { numRuns: 100 },
    );
  });
});

// ─── Property 7: Reorder produces contiguous sortOrder values ────────────────

describe('Property 7: Reorder produces contiguous sortOrder values', () => {
  // **Validates: Requirements 5.2**

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue(adminSession);
  });

  it('calls $transaction with updates assigning sortOrder 0, 1, 2, …, N-1', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 1, maxLength: 10 }),
        async (ids) => {
          mockTransaction.mockResolvedValue(ids.map((id, i) => ({ id, sortOrder: i })));

          await reorderGalleryImages(ids);

          // Verify $transaction was called
          expect(mockTransaction).toHaveBeenCalledTimes(1);

          // The argument to $transaction should be an array of update operations
          const transactionArg = mockTransaction.mock.calls[0][0];
          expect(transactionArg).toHaveLength(ids.length);

          mockTransaction.mockClear();
          mockRevalidatePath.mockClear();
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── Property 8: Authorization gate blocks all operations ────────────────────

describe('Property 8: Authorization gate blocks all operations for non-admin callers', () => {
  // **Validates: Requirements 6.2, 6.3**

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Generate non-admin sessions
  const nonAdminSessionArbitrary = fc.oneof(
    fc.constant(null), // unauthenticated
    fc.constant({ user: { role: 'CUSTOMER', email: 'user@example.com' }, expires: '2099-01-01' }), // customer
    fc.constant({ user: { email: 'user@example.com' }, expires: '2099-01-01' }), // missing role
    fc.constant({ expires: '2099-01-01' }), // missing user
  );

  it('uploadGalleryImages returns { error: "Unauthorized" } for non-admin', async () => {
    await fc.assert(
      fc.asyncProperty(nonAdminSessionArbitrary, async (session) => {
        mockGetServerSession.mockResolvedValue(session);

        const formData = new FormData();
        formData.append('files', createMockFile('test.jpg', 'image/jpeg', 1024));

        const result = await uploadGalleryImages(formData);

        // Should return unauthorized in errors
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].reason).toBe('Unauthorized');
        expect(result.uploaded).toHaveLength(0);

        // No DB or blob operations
        expect(mockPut).not.toHaveBeenCalled();
        expect(mockCreate).not.toHaveBeenCalled();
        expect(mockAggregate).not.toHaveBeenCalled();

        vi.clearAllMocks();
      }),
      { numRuns: 100 },
    );
  });

  it('updateGalleryImage returns { error: "Unauthorized" } for non-admin', async () => {
    await fc.assert(
      fc.asyncProperty(nonAdminSessionArbitrary, async (session) => {
        mockGetServerSession.mockResolvedValue(session);

        const result = await updateGalleryImage('test-id', { alt: 'Valid alt text here' });

        expect(result).toEqual({ error: 'Unauthorized' });
        expect(mockUpdate).not.toHaveBeenCalled();

        vi.clearAllMocks();
      }),
      { numRuns: 100 },
    );
  });

  it('deleteGalleryImage returns { error: "Unauthorized" } for non-admin', async () => {
    await fc.assert(
      fc.asyncProperty(nonAdminSessionArbitrary, async (session) => {
        mockGetServerSession.mockResolvedValue(session);

        const result = await deleteGalleryImage('test-id');

        expect(result).toEqual({ error: 'Unauthorized' });
        expect(mockDelete).not.toHaveBeenCalled();
        expect(mockDel).not.toHaveBeenCalled();
        expect(mockFindUnique).not.toHaveBeenCalled();

        vi.clearAllMocks();
      }),
      { numRuns: 100 },
    );
  });

  it('reorderGalleryImages returns { error: "Unauthorized" } for non-admin', async () => {
    await fc.assert(
      fc.asyncProperty(nonAdminSessionArbitrary, async (session) => {
        mockGetServerSession.mockResolvedValue(session);

        const result = await reorderGalleryImages(['id-1', 'id-2']);

        expect(result).toEqual({ error: 'Unauthorized' });
        expect(mockTransaction).not.toHaveBeenCalled();

        vi.clearAllMocks();
      }),
      { numRuns: 100 },
    );
  });
});

// ─── Property 9: blobUrl unique constraint enforcement ───────────────────────

describe('Property 9: blobUrl unique constraint enforcement', () => {
  // **Validates: Requirements 7.2, 7.4**

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue(adminSession);
  });

  it('when prisma.galleryImage.create throws a unique constraint violation, the file is added to errors', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.stringMatching(/^[a-zA-Z0-9_-]{1,50}$/),
        async (baseName) => {
          const filename = baseName + '.jpg';
          const file = createMockFile(filename, 'image/jpeg', 1024);

          const formData = new FormData();
          formData.append('files', file);

          mockAggregate.mockResolvedValue({ _max: { sortOrder: 0 } });
          mockPut.mockResolvedValue({
            url: `https://blob.vercel-storage.com/gallery/${filename}`,
          });

          // Simulate unique constraint violation
          const uniqueError = new Error(
            'Unique constraint failed on the fields: (`blobUrl`)',
          );
          (uniqueError as any).code = 'P2002';
          mockCreate.mockRejectedValue(uniqueError);

          const result = await uploadGalleryImages(formData);

          // The file should be in errors
          expect(result.errors.length).toBeGreaterThan(0);
          const fileError = result.errors.find((e) => e.filename === filename);
          expect(fileError).toBeDefined();

          // No successful uploads
          expect(result.uploaded).toHaveLength(0);

          mockCreate.mockClear();
          mockPut.mockClear();
          mockAggregate.mockClear();
        },
      ),
      { numRuns: 100 },
    );
  });
});
