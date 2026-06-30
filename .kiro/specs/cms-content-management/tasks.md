# Implementation Plan: CMS Content Management

## Overview

Replace every piece of hard-coded site copy in the Lusso Next.js 14 app with database-driven
`ContentBlock` records. The implementation follows the same server-action / Server Component
patterns already established by `/admin/products` and `/admin/gallery`. Tasks proceed in a
strict dependency order: schema → service → action → admin UI → frontend integration → seeding
→ navigation, with property-based tests wired in immediately after the code they validate.

---

## Tasks

- [x] 1. Extend Prisma schema and generate migration
  - [x] 1.1 Add `ContentType` enum and `ContentBlock` model to `prisma/schema.prisma`
    - Add `enum ContentType { text rich_text image json }` after the existing enums
    - Add `model ContentBlock` with fields: `id` (cuid), `key` (unique String), `type`
      (ContentType, default text), `value` (String @db.Text), `label` (String?),
      `description` (String?), `updatedAt` (DateTime @updatedAt), `createdAt` (DateTime
      @default(now()))
    - Add `@@index([key])` on the model
    - Run `npx prisma migrate dev --name add_content_blocks` to generate and apply the migration
    - Run `npx prisma generate` to regenerate the Prisma client
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 1.2 Write property test for schema uniqueness and round-trip persistence (Property 1)
    - File: `src/lib/cms/__tests__/schema.property.test.ts`
    - Use `fast-check` with `fc.tuple(fc.string({ minLength: 1, maxLength: 200 }), fc.constantFrom('text', 'rich_text', 'image', 'json'), fc.string({ minLength: 1, maxLength: 500 }))` as the input arbitrary
    - For each generated `(key, type, value)` triple: upsert a ContentBlock, read it back with
      `prisma.contentBlock.findUnique({ where: { key } })`, assert the returned record is
      structurally equal and `updatedAt` is a valid Date
    - Tag: `// Feature: cms-content-management, Property 1: ContentBlock upsert–read round-trip`
    - _Requirements: 1.1, 1.3, 2.1_

- [x] 2. Implement CMS service module
  - [x] 2.1 Create `src/lib/cms/service.ts` with `getContent`, `getContentJson`, `getContentSection`
    - Import `prisma` from `@/lib/prisma`
    - `getContent(key, fallback)`: call `prisma.contentBlock.findUnique({ where: { key } })`,
      return `fallback` if row absent or `value` is an empty string; wrap in try/catch and
      return `fallback` on any DB error; log a `console.warn` on error
    - `getContentJson<T>(key, fallback)`: call `getContent(key, '')`, attempt `JSON.parse` on
      the result, return `fallback` on absent/empty/parse failure with `console.warn`
    - `getContentSection(section, fallbacks)`: call
      `prisma.contentBlock.findMany({ where: { key: { startsWith: section + '.' } } })`, build
      a `Map<string, string>`, merge `fallbacks` for any missing or empty-string key; wrap in
      try/catch returning a fully-fallback map on DB error
    - Export all three functions; do not export a class or singleton
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [x] 2.2 Write property test for missing-key fallback (Property 2)
    - File: `src/lib/cms/__tests__/service.property.test.ts`
    - Mock `prisma.contentBlock.findUnique` to return `null` for all keys
    - Use `fc.tuple(fc.string({ minLength: 1 }), fc.string({ minLength: 1 }))` as arbitrary
    - Assert `getContent(key, fallback)` returns exactly `fallback`, never `null`, `undefined`,
      or `''`
    - Tag: `// Feature: cms-content-management, Property 2: Missing key returns the supplied fallback`
    - _Requirements: 2.2, 7.2_

  - [x] 2.3 Write property test for JSON round-trip (Property 3)
    - Extend `src/lib/cms/__tests__/service.property.test.ts`
    - Use `fc.jsonValue()` as the value arbitrary (covers nested objects and arrays)
    - Mock `prisma.contentBlock.findUnique` to return `{ value: JSON.stringify(generated) }`
    - Assert `getContentJson(key, fallback)` returns a value deeply equal to the original via
      `expect(result).toEqual(generated)`
    - Tag: `// Feature: cms-content-management, Property 3: JSON round-trip preserves structure`
    - _Requirements: 2.3_

  - [x] 2.4 Write property test for DB unavailability returning fallback (Property 7)
    - Extend `src/lib/cms/__tests__/service.property.test.ts`
    - Mock `prisma.contentBlock.findUnique` and `prisma.contentBlock.findMany` to throw a
      simulated DB error
    - Use `fc.tuple(fc.string({ minLength: 1 }), fc.anything())` as arbitraries
    - Assert that `getContent` and `getContentJson` each return `fallback` and do NOT throw or
      reject
    - Tag: `// Feature: cms-content-management, Property 7: Database unavailability yields fallback without exception`
    - _Requirements: 7.1_

- [x] 3. Implement `upsertContentBlock` server action
  - [x] 3.1 Create `src/actions/admin/content.ts` with `upsertContentBlock`
    - Add `"use server"` directive
    - Implement `requireAdmin()` using the same pattern as `src/actions/admin/products.ts`:
      `getServerSession(authOptions)`, return `{ error: 'Unauthorized' }` if role ≠ `ADMIN`
    - Implement `validateUpsertInput(key, value)`: return `{ error: 'Value cannot be empty' }`
      for empty/whitespace-only string; return `{ error: 'Value is too long (max 50 000 characters)' }`
      for `value.length > 50_000`
    - Implement `getSection(key)`: return `key.split('.')[0]` for dotted keys, else `key`
    - Define `SECTION_ROUTES: Record<string, string[]>` matching the routing table in `design.md`
    - `upsertContentBlock(key, value)`: call `requireAdmin()`, then `validateUpsertInput`,
      then `prisma.contentBlock.upsert({ where: { key }, create: { key, value }, update: { value } })`,
      then call `revalidatePath` for each path in `SECTION_ROUTES[getSection(key)]`; catch DB
      errors and return `{ error: 'Failed to save content: <message>' }`; export
      `type UpsertResult = { success: true } | { error: string }`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 3.2 Write property test for authorization guard (Property 4)
    - File: `src/actions/admin/__tests__/content.property.test.ts`
    - Mock `getServerSession` to return sessions with arbitrary roles from
      `fc.constantFrom(null, 'CUSTOMER', undefined, { role: undefined })`
    - Use `fc.tuple(fc.string({ minLength: 1 }), fc.string({ minLength: 1, maxLength: 100 }))` for `(key, value)`
    - Assert every call returns `{ error: 'Unauthorized' }` and that
      `prisma.contentBlock.upsert` is never called
    - Tag: `// Feature: cms-content-management, Property 4: Authorization guard rejects every non-admin caller`
    - _Requirements: 5.2, 5.3_

  - [x] 3.3 Write property test for input validation (Property 5)
    - Extend `src/actions/admin/__tests__/content.property.test.ts`
    - Mock `getServerSession` to return a valid ADMIN session
    - Use `fc.oneof(fc.constant(''), fc.stringOf(fc.constantFrom(' ', '\t', '\n')), fc.string({ minLength: 50_001 }))`
      as the invalid value arbitrary
    - Assert every call with an invalid value returns `{ error: ... }` and
      `prisma.contentBlock.upsert` is never called
    - Use `fc.string({ minLength: 1, maxLength: 50_000 }).filter(v => v.trim().length > 0)`
      as the valid value arbitrary and assert no validation error is returned for the value field
    - Tag: `// Feature: cms-content-management, Property 5: Input validation rejects all invalid values`
    - _Requirements: 5.5, 5.6_

  - [x] 3.4 Write property test for revalidation routing (Property 6)
    - Extend `src/actions/admin/__tests__/content.property.test.ts`
    - Mock `getServerSession` (ADMIN), `prisma.contentBlock.upsert` (resolves), and
      `revalidatePath` (jest/vitest spy)
    - Build an arbitrary from the full key registry in `design.md` using `fc.constantFrom(...allKeys)`
    - For each key assert that `revalidatePath` was called with exactly the paths prescribed in
      the `SECTION_ROUTES` routing table — no extra calls, no missing calls
    - Verify `business_info.*` keys trigger both `'/'` and `'/contact'`
    - Tag: `// Feature: cms-content-management, Property 6: Revalidation routing is correct and complete`
    - _Requirements: 5.4, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 4. Checkpoint — CMS service and action layer
  - Ensure all tests in `src/lib/cms/__tests__/` and `src/actions/admin/__tests__/content.property.test.ts`
    pass. Ask the user if questions arise.

- [x] 5. Implement admin UI components
  - [x] 5.1 Create `src/components/admin/content/InlineEditor.tsx`
    - `'use client'` directive
    - Props: `block: { key: string; type: string; value: string; label?: string | null }`,
      `onSave: (newValue: string) => Promise<void>`, `onCancel: () => void`
    - Maintain local `draft` state initialised from `block.value`; on error keep `draft`
      unchanged (Property 11 compliance)
    - Render `<input type="text">` when `type === 'text'`
    - Render `<textarea>` when `type === 'rich_text'`
    - Delegate to `<JsonEditor>` when `type === 'json'`
    - Render URL `<input>` + upload `<button>` calling `/api/admin/products/upload-image` when
      `type === 'image'`; on upload success auto-populate `draft` with the returned URL
    - Save button calls `upsertContentBlock(block.key, draft)`, shows inline error on failure
    - Cancel button calls `onCancel` without saving
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 6.1, 6.2, 6.3, 6.5, 6.6_

  - [x] 5.2 Write property test for editor type matching block type (Property 10)
    - File: `src/components/admin/content/__tests__/InlineEditor.property.test.ts`
    - Use `@testing-library/react` + `jsdom` + `fast-check`
    - Use `fc.record({ key: fc.string({ minLength: 1 }), type: fc.constantFrom('text', 'rich_text', 'json', 'image'), value: fc.string() })` as the block arbitrary
    - For `type === 'text'` assert exactly one `<input type="text">` is rendered and no `<textarea>`
    - For `type === 'rich_text'` assert exactly one `<textarea>` and no `<input type="text">`
    - For `type === 'json'` assert neither a plain `<input>` nor `<textarea>` for the primary
      value field
    - For `type === 'image'` assert a URL `<input>` and an upload `<button>` are present
    - Tag: `// Feature: cms-content-management, Property 10: Editor type matches content block type`
    - _Requirements: 4.2, 4.3, 4.4, 4.5_

  - [x] 5.3 Write property test for error state preserving entered text (Property 11)
    - Extend `src/components/admin/content/__tests__/InlineEditor.property.test.ts`
    - Mock `upsertContentBlock` to return `{ error: 'Server error' }`
    - Use `fc.tuple(fc.string({ minLength: 1 }), fc.string({ minLength: 1 }))` for
      `(originalValue, adminTypedValue)` where `adminTypedValue !== originalValue`
    - Simulate: mount editor with `originalValue`, type `adminTypedValue`, click Save
    - Assert: the input/textarea value remains `adminTypedValue` and the error text is visible
      in the DOM after the failed save
    - Tag: `// Feature: cms-content-management, Property 11: Error state preserves the admin's entered text`
    - _Requirements: 4.7_

  - [x] 5.4 Create `src/components/admin/content/JsonEditor.tsx`
    - `'use client'` directive
    - Props: `blockKey: string`, `value: string`, `onChange: (json: string) => void`
    - Switch on `blockKey`:
      - `'testimonials'`: render list of `{ quote: string; name: string }` rows; add/remove buttons
      - `'services'`: render list of `{ name: string; description: string }` rows; add/remove buttons
      - `'gallery_images'`: render list of `{ src: string; alt: string; width: number; height: number }` rows; add/remove buttons
      - `'why_lusso.items'`: render list of plain string rows; add/remove buttons
    - On any field change, call `onChange(JSON.stringify(currentList))`
    - _Requirements: 4.4_

  - [x] 5.5 Create `src/components/admin/content/ContentBlockRow.tsx`
    - `'use client'` directive (needs local open/close edit state)
    - Props: `block: ContentBlock | null` (null = DB-absent, using fallback),
      `fallbackValue: string`, `label: string`, `description?: string`
    - Display: `key`, `label`, truncated current value (first 120 chars), `updatedAt`
      formatted via `formatUpdatedAt(date)` or "Default value" badge when `block` is null
    - Edit button mounts `<InlineEditor>` in-place; Cancel restores read-only view
    - `formatUpdatedAt(date)` helper: return `"D Mon YYYY, HH:MM"` (e.g. `"14 Jul 2025, 10:32"`)
    - _Requirements: 3.2, 3.3, 10.1, 10.2, 10.3_

  - [x] 5.6 Write property test for `formatUpdatedAt` (Property 9)
    - File: `src/components/admin/content/__tests__/ContentBlockRow.property.test.ts`
    - Use `fc.date({ min: new Date('2000-01-01'), max: new Date('2100-12-31') })` as arbitrary
    - Assert the returned string matches `/^\d{1,2} [A-Z][a-z]{2} \d{4}, \d{2}:\d{2}$/`
    - Assert month abbreviation is one of the 12 valid English month abbreviations
    - Assert year is in range 2000–2100
    - Tag: `// Feature: cms-content-management, Property 9: updatedAt timestamp format is always human-readable`
    - _Requirements: 10.3_

  - [x] 5.7 Create `src/components/admin/content/ContentSectionPanel.tsx`
    - Server Component (no `'use client'`)
    - Props: `section: string`, `label: string`,
      `rows: Array<{ key: string; label: string; description?: string; fallback: string; block: ContentBlock | null }>`
    - Render a labelled card with a `<ContentBlockRow>` per row entry
    - _Requirements: 3.1, 3.4_

- [x] 6. Implement admin content page
  - [x] 6.1 Replace `src/app/admin/content/page.tsx` with CMS-backed Server Component
    - Mark as `async` Server Component (no `'use client'`)
    - Fetch all `ContentBlock` rows in a single query:
      `prisma.contentBlock.findMany({ orderBy: { key: 'asc' } })`
    - Build a `Map<string, ContentBlock>` keyed by `block.key`
    - Group rows by section using the full key registry from `design.md`; define the registry
      as a typed constant array `CONTENT_REGISTRY` in `src/lib/cms/registry.ts` so both the
      page and the seed can import it
    - Render one `<ContentSectionPanel>` per section, passing the matching `ContentBlock | null`
      for each key alongside its fallback value
    - No duplicate auth guard needed — `src/app/admin/layout.tsx` already handles it
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 7. Checkpoint — Admin UI
  - Ensure all tests in `src/components/admin/content/__tests__/` pass and that
    `src/app/admin/content/page.tsx` builds without TypeScript errors.
    Ask the user if questions arise.

- [x] 8. Frontend integration — home page components
  - [x] 8.1 Convert `src/components/home/Testimonials.tsx` to async Server Component using CMS service
    - Remove the `TESTIMONIALS` import, replace with
      `getContentJson('testimonials', [...TESTIMONIALS])` call
    - Render the resolved array in place of the constant reference
    - _Requirements: 2.1, 2.2, 2.3, 7.4_

  - [x] 8.2 Convert `src/components/home/Gallery.tsx` to async Server Component using CMS service
    - Remove the `GALLERY_IMAGES` import, replace with
      `getContentJson('gallery_images', [...GALLERY_IMAGES])` call
    - _Requirements: 2.1, 2.2, 2.3, 7.6_

  - [x] 8.3 Convert `src/components/home/Services.tsx` to async Server Component using CMS service
    - Extract the hard-coded `reasons` array as the fallback constant
    - Fetch via `getContentSection('why_lusso', { 'why_lusso.heading': 'Why Choose Lusso?', 'why_lusso.items': JSON.stringify(reasons) })`
    - Parse `why_lusso.items` with `JSON.parse` inside the component (or call `getContentJson`)
    - _Requirements: 2.1, 2.2, 7.5_

  - [x] 8.4 Convert `src/components/home/AboutPreview.tsx` to async Server Component using CMS service
    - Define `aboutPreviewFallbacks` with keys `about_preview.heading`, `about_preview.body_1`,
      `about_preview.body_2`, `about_preview.cta_label` mapped to current hard-coded strings
    - Fetch via `getContentSection('about_preview', aboutPreviewFallbacks)`
    - Replace each hard-coded string with the corresponding map lookup
    - _Requirements: 2.1, 2.2, 7.8_

  - [x] 8.5 Split `src/components/home/HeroSection.tsx` into server wrapper + client component
    - Create `src/components/home/HeroContent.tsx` as `'use client'` receiving all four content
      values (`heading`, `subtext`, `ctaLabel`, `bgImage`) as props; move GSAP animation logic
      into this component (rename the existing `HeroSection` class)
    - Update `src/app/page.tsx` (or the parent Server Component that renders HeroSection) to:
      fetch `getContentSection('hero', heroFallbacks)` server-side and pass the four values
      as props to `<HeroContent>`
    - Remove the hard-coded `HERO_BG_IMAGE` constant from `HeroSection.tsx`
    - _Requirements: 2.1, 2.2, 7.3_

  - [x] 8.6 Convert `src/components/layout/Footer.tsx` to async Server Component using CMS service
    - Add two `getContentSection` calls: one for `'business_info'` and one for `'footer'`
    - Define fallbacks for all 7 `business_info.*` keys and all 3 `footer.*` keys from `BUSINESS_INFO` and the current hard-coded strings
    - Replace all `BUSINESS_INFO.*` references with map lookups from the CMS service
    - Replace hard-coded footer sustainability text, newsletter heading and subtext with CMS lookups
    - _Requirements: 2.1, 2.2, 7.7_

- [x] 9. Frontend integration — standalone pages
  - [x] 9.1 Convert `src/app/about/page.tsx` to async Server Component using CMS service
    - Add `getContentSection('about_page', aboutPageFallbacks)` at the top of the default export
    - Define fallbacks for all 12 `about_page.*` keys from the current hard-coded strings
    - Replace every inline string, heading, body paragraph, tagline, and image `src` with the
      corresponding map lookup
    - _Requirements: 2.1, 2.2, 7.9_

  - [x] 9.2 Convert `src/app/experiences/page.tsx` to async Server Component using CMS service
    - Add `getContentSection('experiences', experiencesFallbacks)` at the top of the default export
    - Define fallbacks for all 12 `experiences.*` keys from the current hard-coded strings
    - Replace every inline string, heading, body paragraph, tagline, and image `src` with the
      corresponding map lookup
    - _Requirements: 2.1, 2.2, 7.10_

- [x] 10. Checkpoint — Frontend integration
  - Run `npx tsc --noEmit` to confirm the project builds without TypeScript errors across all
    modified components and pages. Ask the user if questions arise.

- [x] 11. Database seeding
  - [x] 11.1 Create `src/lib/cms/registry.ts` with `CONTENT_REGISTRY` constant
    - Export a typed array `CONTENT_REGISTRY: Array<{ key: string; type: ContentType; value: string; label: string; description?: string }>`
      containing all 48 blocks from the key registry in `design.md`
    - Import and use current values from `TESTIMONIALS`, `GALLERY_IMAGES`, `BUSINESS_INFO`,
      and `SERVICES` from `@/lib/constants/brand` for the JSON and scalar fallbacks
    - This module is imported by both `prisma/seed.ts` and `src/app/admin/content/page.tsx`
    - _Requirements: 1.4, 8.1, 8.3_

  - [x] 11.2 Extend `prisma/seed.ts` with `seedContentBlocks()` function
    - Import `CONTENT_REGISTRY` from `src/lib/cms/registry.ts`
    - Implement `async function seedContentBlocks()` that iterates `CONTENT_REGISTRY` and for
      each entry calls:
      `prisma.contentBlock.upsert({ where: { key }, update: {}, create: { key, type, value, label } })`
    - The `update: {}` no-op ensures admin edits are never overwritten on re-seed
    - Call `seedContentBlocks()` inside `main()` after the existing product seed loop
    - Log `✅ Seeded N content blocks successfully.` where N is `CONTENT_REGISTRY.length`
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 11.3 Write property test for seed idempotency (Property 8)
    - File: `prisma/__tests__/seed.property.test.ts`
    - Use a test Prisma client pointing at a test database (or mock `prisma.contentBlock.upsert`)
    - Generate an arbitrary number of consecutive `seedContentBlocks()` invocations (2–5) via
      `fc.integer({ min: 2, max: 5 })`
    - After all runs, assert the row count equals `CONTENT_REGISTRY.length` (no duplicates) and
      each block's value equals the seed value (no accumulation)
    - Tag: `// Feature: cms-content-management, Property 8: Seed is idempotent`
    - _Requirements: 8.2_

- [x] 12. Add CMS link to admin sidebar navigation
  - [x] 12.1 Verify `AdminSidebar.tsx` already includes Content navigation entry
    - Inspect `src/components/admin/AdminSidebar.tsx` — the `navItems` array already contains
      `{ label: 'Content', href: '/admin/content', icon: '📝' }`
    - If the entry is present and correct, no change is needed; add a code comment referencing
      Requirements 3.4
    - If absent, add the entry between 'Gallery' and 'Customers' to match the design
    - _Requirements: 3.4_

- [x] 13. Final checkpoint — full test suite and build
  - Run `npm test` (i.e., `vitest run`) to confirm all property tests, unit tests, and
    component tests pass.
  - Run `npx tsc --noEmit` to confirm zero TypeScript errors.
  - Ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP. In this plan,
  all property-based test tasks are **required** (not optional) as specified in the issue.
- All 11 correctness properties from `design.md` are mapped to concrete test tasks:
  - Property 1 → Task 1.2 (schema round-trip)
  - Property 2 → Task 2.2 (missing-key fallback)
  - Property 3 → Task 2.3 (JSON round-trip)
  - Property 4 → Task 3.2 (auth guard)
  - Property 5 → Task 3.3 (input validation)
  - Property 6 → Task 3.4 (revalidation routing)
  - Property 7 → Task 2.4 (DB unavailability)
  - Property 8 → Task 11.3 (seed idempotency)
  - Property 9 → Task 5.6 (`formatUpdatedAt` format)
  - Property 10 → Task 5.2 (editor type matching)
  - Property 11 → Task 5.3 (error state preservation)
- The `CONTENT_REGISTRY` constant in `src/lib/cms/registry.ts` is the single source of truth
  for all 48 content keys; both the admin content page and the seed import it.
- The HeroSection split (Task 8.5) is required because the existing component is `'use client'`
  due to GSAP; all other frontend components are already Server Components and can be made
  async directly.
- `fast-check` v4 is already installed as a dev dependency (`package.json`).
- `vitest` is already configured as the test runner (`npm test` runs `vitest run`).
- The `AdminSidebar` already includes the `/admin/content` link (Task 12.1 confirms this).

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1", "11.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "3.1", "11.2"] },
    { "id": 3, "tasks": ["3.2", "3.3", "3.4", "11.3"] },
    { "id": 4, "tasks": ["5.1", "5.4", "5.5", "5.7", "6.1"] },
    { "id": 5, "tasks": ["5.2", "5.3", "5.6"] },
    { "id": 6, "tasks": ["8.1", "8.2", "8.3", "8.4", "8.5", "8.6", "9.1", "9.2"] },
    { "id": 7, "tasks": ["12.1"] }
  ]
}
```
