# Design Document — CMS Content Management

## Overview

The CMS Content Management feature replaces every piece of hard-coded site copy in the Lusso
Next.js 14 app with database-driven `ContentBlock` records that an admin can edit through the
existing `/admin/content` panel — no code change and no redeployment required.

### Goals

- Replace `src/lib/constants/brand.ts` values and inline page copy with DB-backed content.
- Provide a live inline editor at `/admin/content`, following the patterns already established by
  `/admin/gallery` and `/admin/products`.
- Guarantee the site is never empty: every call to the CMS service falls back to the current
  static values when the database row is absent or the database is unavailable.
- Invalidate the Next.js ISR/RSC cache immediately after each successful save so visitors see
  the updated content within seconds.

### Non-goals

- No versioning or rollback of content edits in this iteration.
- No rich WYSIWYG editor (Tiptap, Slate, etc.) — `rich_text` uses a plain `<textarea>`.
- No per-block access-control beyond the existing `ADMIN` role.

---

## Architecture

The CMS slots into the existing stack without introducing new infrastructure dependencies.

```
┌────────────────────────────────────────────────────────────┐
│  Next.js App Router (Server Components + Server Actions)   │
│                                                            │
│  Page RSC                                                  │
│   └─ calls cmsService.getContentSection(section)          │
│        └─ one Prisma findMany → PostgreSQL                 │
│        └─ returns Map<key, value> with fallbacks merged in │
│                                                            │
│  /admin/content (Server Component + Client Components)     │
│   └─ ContentSectionPanel (per section)                     │
│       └─ ContentBlockRow (read-only display)               │
│           └─ InlineEditor (client, per type)               │
│               └─ calls upsertContentBlock server action    │
│                    └─ Prisma upsert → PostgreSQL           │
│                    └─ revalidatePath(affected routes)      │
└────────────────────────────────────────────────────────────┘
```

**Key architectural decisions:**

- The CMS service (`src/lib/cms/service.ts`) is a plain TypeScript module — no class, no
  singleton beyond what Prisma already provides. Server Components import it directly.
- Server actions live in `src/actions/admin/content.ts`, matching the existing pattern in
  `src/actions/admin/products.ts`.
- The admin UI is a Server Component page that pre-fetches all blocks and passes them as props
  to client child components. This avoids client-side data fetching and keeps the pattern
  consistent with `/admin/gallery`.
- Image uploads reuse the existing `/api/admin/products/upload-image` endpoint (Vercel Blob).

---

## Components and Interfaces

### CMS Service (`src/lib/cms/service.ts`)


```typescript
// Fetch a single scalar content block. Returns `fallback` if absent or DB unavailable.
export async function getContent(key: string, fallback: string): Promise<string>

// Fetch a JSON-typed content block, parse it, and return as T.
// Returns `fallback` on absence, DB error, or parse failure (logs a warning).
export async function getContentJson<T>(key: string, fallback: T): Promise<T>

// Fetch all blocks for one Page_Section in a single Prisma findMany call.
// Returns a Map<key, string> where missing keys map to their fallback values.
export async function getContentSection(
  section: ContentSection,
  fallbacks: Record<string, string>
): Promise<Map<string, string>>
```

`getContentSection` is the primary call made by page Server Components. It issues **one**
`prisma.contentBlock.findMany({ where: { key: { startsWith: section + '.' } } })` query,
builds the map, and fills in any missing key with its fallback value.

### Server Action (`src/actions/admin/content.ts`)

```typescript
"use server";

export type UpsertResult = { success: true } | { error: string };

export async function upsertContentBlock(
  key: string,
  value: string
): Promise<UpsertResult>
```

Behaviour (in order):

1. Call `requireAdmin()` — reads `getServerSession(authOptions)`, returns `{ error: "Unauthorized" }` if role ≠ `ADMIN`.
2. Validate: reject empty string; reject value longer than 50,000 characters.
3. `prisma.contentBlock.upsert({ where: { key }, create: { key, value }, update: { value } })`.
4. Call `revalidatePath` for every route affected by `key` (see revalidation routing table).
5. Return `{ success: true }` or `{ error: message }` on DB failure (no unhandled throws).

### Admin UI Components

| Component | Location | Type |
|---|---|---|
| `AdminContentPage` | `src/app/admin/content/page.tsx` | Server Component (page) |
| `ContentSectionPanel` | `src/components/admin/content/ContentSectionPanel.tsx` | Server Component |
| `ContentBlockRow` | `src/components/admin/content/ContentBlockRow.tsx` | Client Component |
| `InlineEditor` | `src/components/admin/content/InlineEditor.tsx` | Client Component |
| `JsonEditor` | `src/components/admin/content/JsonEditor.tsx` | Client Component |
| `ImageBlockEditor` | `src/components/admin/content/ImageBlockEditor.tsx` | Client Component |

**`AdminContentPage`** fetches all `ContentBlock` rows in one query, groups them by section, then
renders one `ContentSectionPanel` per section. Unauthenticated / non-admin requests are handled
by the existing `src/app/admin/layout.tsx` guard — no duplicate auth logic needed.

**`ContentBlockRow`** shows `key`, `label`, `value` (truncated), `updatedAt` (or "Default value"
badge), and an Edit button that mounts `InlineEditor` in-place.

**`InlineEditor`** switches on `ContentBlock.type`:
- `text` → `<input type="text" />`
- `rich_text` → `<textarea />`
- `json` → delegates to `JsonEditor` (section-specific structured list UI)
- `image` → `<input type="url" />` + upload button that posts to `/api/admin/products/upload-image`

**`JsonEditor`** renders different structured UIs depending on the key:
- `testimonials` → list of `{ quote, name }` rows with add/remove.
- `services` → list of `{ name, description }` rows.
- `gallery_images` → list of `{ src, alt, width, height }` rows.
- `why_lusso.items` → list of plain strings.

Submitting any editor calls `upsertContentBlock(key, JSON.stringify(value))` for JSON types or
`upsertContentBlock(key, value)` for scalar types.

---

## Data Models

### Prisma Schema Addition

Add the following model to `prisma/schema.prisma`:

```prisma
enum ContentType {
  text
  rich_text
  image
  json
}

model ContentBlock {
  id          String      @id @default(cuid())
  key         String      @unique
  type        ContentType @default(text)
  value       String      @db.Text
  label       String?
  description String?
  updatedAt   DateTime    @updatedAt
  createdAt   DateTime    @default(now())

  @@index([key])
}
```

**Design notes:**
- `key` carries an implicit section prefix (`hero.`, `about_page.`, etc.) — no separate
  `section` column is needed; `getContentSection` uses a `startsWith` filter.
- `value` is always stored as `String` (`@db.Text`). JSON blocks store a JSON string;
  the service layer handles serialisation/deserialisation.
- No `@updatedAt` on `createdAt` — that field is write-once on create.

### Full Content Key Registry


| Key | Type | Label | Static fallback source |
|-----|------|-------|----------------------|
| `hero.heading` | `text` | Hero heading | `"Quiet Luxury Candles"` (HeroSection.tsx) |
| `hero.subtext` | `text` | Hero subtext | `"Born from Lusso Picnic..."` (HeroSection.tsx) |
| `hero.cta_label` | `text` | CTA button label | `"Shop now"` (HeroSection.tsx) |
| `hero.bg_image` | `image` | Hero background image | `/images/gallery/styled-trio-1.png` (HeroSection.tsx) |
| `about_preview.heading` | `text` | Preview heading | `"About Lusso Candles"` (AboutPreview.tsx) |
| `about_preview.body_1` | `rich_text` | Preview body 1 | `"Born from a love of atmosphere..."` (AboutPreview.tsx) |
| `about_preview.body_2` | `rich_text` | Preview body 2 | `"We believe quiet luxury lives..."` (AboutPreview.tsx) |
| `about_preview.cta_label` | `text` | Preview CTA label | `"Learn More"` (AboutPreview.tsx) |
| `about_page.heading` | `text` | About page heading | `"Our Story"` (about/page.tsx) |
| `about_page.intro` | `rich_text` | About page intro | `"From curated picnics..."` (about/page.tsx) |
| `about_page.story_heading` | `text` | Story section heading | `"About Lusso Candles"` (about/page.tsx) |
| `about_page.story_body_1` | `rich_text` | Story body 1 | `"Born from the experiences..."` (about/page.tsx) |
| `about_page.story_body_2` | `rich_text` | Story body 2 | `"We believe luxury is not..."` (about/page.tsx) |
| `about_page.story_body_3` | `rich_text` | Story body 3 | `"Whether you're hosting guests..."` (about/page.tsx) |
| `about_page.story_tagline` | `text` | Story tagline | `"Clean. Comfortable. Intentional."` (about/page.tsx) |
| `about_page.story_image` | `image` | Story image | `/images/about/workshop.png` (about/page.tsx) |
| `about_page.philosophy_heading` | `text` | Philosophy heading | `"Our Philosophy"` (about/page.tsx) |
| `about_page.philosophy_body_1` | `rich_text` | Philosophy body 1 | `"We believe luxury should be felt..."` (about/page.tsx) |
| `about_page.philosophy_body_2` | `rich_text` | Philosophy body 2 | `"Sustainability isn't a marketing line..."` (about/page.tsx) |
| `about_page.philosophy_body_3` | `rich_text` | Philosophy body 3 | `"Based in Centurion..."` (about/page.tsx) |
| `about_page.philosophy_image` | `image` | Philosophy image | `/images/about/materials.png` (about/page.tsx) |
| `testimonials` | `json` | Testimonials | `TESTIMONIALS` array (brand.ts) |
| `services` | `json` | Services | `SERVICES` array (brand.ts) |
| `gallery_images` | `json` | Gallery images | `GALLERY_IMAGES` array (brand.ts) |
| `business_info.address` | `text` | Address | `BUSINESS_INFO.address` (brand.ts) |
| `business_info.hours` | `text` | Business hours | `BUSINESS_INFO.hours` (brand.ts) |
| `business_info.phone` | `text` | Phone | `BUSINESS_INFO.phone` (brand.ts) |
| `business_info.phone_href` | `text` | Phone href | `BUSINESS_INFO.phoneHref` (brand.ts) |
| `business_info.email` | `text` | Email address | `BUSINESS_INFO.email` (brand.ts) |
| `business_info.email_href` | `text` | Email href | `BUSINESS_INFO.emailHref` (brand.ts) |
| `business_info.map_embed_url` | `text` | Map embed URL | `BUSINESS_INFO.mapEmbedUrl` (brand.ts) |
| `experiences.intro_1` | `rich_text` | Experiences intro 1 | `"Born from the experiences..."` (experiences/page.tsx) |
| `experiences.intro_2` | `rich_text` | Experiences intro 2 | `"We believe luxury is not about excess..."` (experiences/page.tsx) |
| `experiences.intro_3` | `rich_text` | Experiences intro 3 | `"Whether you're hosting guests..."` (experiences/page.tsx) |
| `experiences.intro_tagline` | `text` | Experiences tagline | `"Clean. Comfortable. Intentional."` (experiences/page.tsx) |
| `experiences.picnics_heading` | `text` | Picnics heading | `"Lusso Picnics"` (experiences/page.tsx) |
| `experiences.picnics_body_1` | `rich_text` | Picnics body 1 | `"Our curated outdoor experiences..."` (experiences/page.tsx) |
| `experiences.picnics_body_2` | `rich_text` | Picnics body 2 | `"Every detail is considered..."` (experiences/page.tsx) |
| `experiences.picnics_image` | `image` | Picnics image | `/images/experiences/picnic.jpg` (experiences/page.tsx) |
| `experiences.scent_heading` | `text` | Scent-styling heading | `"Scent-Styling Services"` (experiences/page.tsx) |
| `experiences.scent_body_1` | `rich_text` | Scent body 1 | `"Fragrance has the power..."` (experiences/page.tsx) |
| `experiences.scent_body_2` | `rich_text` | Scent body 2 | `"The result is a cohesive..."` (experiences/page.tsx) |
| `experiences.scent_image` | `image` | Scent-styling image | `/images/experiences/scent-styling.png` (experiences/page.tsx) |
| `footer.sustainability_text` | `rich_text` | Footer sustainability | `"Crafted with sustainably sourced materials..."` (Footer.tsx) |
| `footer.newsletter_heading` | `text` | Newsletter heading | `"Join Our Inner Circle"` (Footer.tsx) |
| `footer.newsletter_subtext` | `text` | Newsletter subtext | `"Early access to new scents..."` (Footer.tsx) |
| `why_lusso.heading` | `text` | Why Lusso heading | `"Why Choose Lusso?"` (Services.tsx) |
| `why_lusso.items` | `json` | Why Lusso items | Six-item string array (Services.tsx) |


---

## Frontend Integration

Each consuming component is converted from a purely static Server Component to one that calls
the CMS service at render time. The pattern is identical across all components:

```typescript
// Example: Testimonials (src/components/home/Testimonials.tsx)
import { getContentJson } from '@/lib/cms/service';
import { TESTIMONIALS } from '@/lib/constants/brand';

export async function Testimonials() {
  const testimonials = await getContentJson('testimonials', [...TESTIMONIALS]);
  // render with `testimonials` instead of TESTIMONIALS constant
}
```

### Component → Content Key Mapping

| Component / Page | Keys consumed | Section query |
|---|---|---|
| `HeroSection` | `hero.*` (4 keys) | `getContentSection('hero', heroFallbacks)` |
| `AboutPreview` | `about_preview.*` (4 keys) | `getContentSection('about_preview', ...)` |
| `Gallery` | `gallery_images` | `getContentJson('gallery_images', GALLERY_IMAGES)` |
| `Testimonials` | `testimonials` | `getContentJson('testimonials', TESTIMONIALS)` |
| `Services` | `why_lusso.*` (2 keys) | `getContentSection('why_lusso', ...)` |
| `Footer` | `business_info.*` (7 keys) + `footer.*` (3 keys) | two `getContentSection` calls |
| About page | `about_page.*` (12 keys) | `getContentSection('about_page', ...)` |
| Experiences page | `experiences.*` (12 keys) | `getContentSection('experiences', ...)` |

**`HeroSection` special case:** `HeroSection` is currently a `'use client'` component (GSAP
animations). It will be split into a thin wrapper:
- `HeroSection` — stays a Client Component, receives all content values as props.
- Parent in `app/page.tsx` fetches the content server-side and passes it as props.

This avoids converting the animation-heavy component to a Server Component while still serving
CMS content.

### Graceful Fallback Strategy

`getContent` and `getContentJson` wrap their Prisma call in `try/catch`. On any error, they
log a warning and return the supplied fallback. `getContentSection` does the same: if the
query throws, it returns a map populated entirely with fallback values. This means:

1. No page ever throws during rendering due to a CMS DB issue.
2. Empty-string values stored in the DB are treated as absent (fallback is used instead).
3. Invalid JSON stored in a `json`-type block triggers the fallback and a `console.warn`.

---

## Database Seeding

The seed file at `prisma/seed.ts` is extended to run `seedContentBlocks()` after the existing
product seed. The seed uses `upsert` semantics on `key` so it is idempotent:

```typescript
async function seedContentBlocks() {
  const blocks: Array<{ key: string; type: ContentType; value: string; label: string }> = [
    { key: 'hero.heading',   type: 'text',  value: 'Quiet Luxury Candles', label: 'Hero heading' },
    { key: 'hero.subtext',   type: 'text',  value: 'Born from Lusso Picnic...', label: 'Hero subtext' },
    // ... all 48 blocks from the registry above
    { key: 'testimonials',   type: 'json',  value: JSON.stringify(TESTIMONIALS), label: 'Testimonials' },
    { key: 'gallery_images', type: 'json',  value: JSON.stringify(GALLERY_IMAGES), label: 'Gallery images' },
    // etc.
  ];

  for (const block of blocks) {
    await prisma.contentBlock.upsert({
      where:  { key: block.key },
      update: {}, // never overwrite admin edits on re-seed
      create: block,
    });
  }
}
```

Key design decision: the `update: {}` (no-op update) ensures that running `prisma db seed`
after deployment never clobbers content an admin has already edited.

---

## Content Revalidation Routing Table

`upsertContentBlock` derives the section from the key prefix and calls `revalidatePath` for
every route that renders that section.

| Key prefix / key | `revalidatePath` calls |
|---|---|
| `hero.*` | `revalidatePath('/')` |
| `about_preview.*` | `revalidatePath('/')` |
| `testimonials` | `revalidatePath('/')` |
| `services` | `revalidatePath('/')` |
| `why_lusso.*` | `revalidatePath('/')` |
| `gallery_images` | `revalidatePath('/')` |
| `footer.*` | `revalidatePath('/')` |
| `business_info.*` | `revalidatePath('/')`, `revalidatePath('/contact')` |
| `about_page.*` | `revalidatePath('/about')` |
| `experiences.*` | `revalidatePath('/experiences')` |

Implementation uses a lookup map so each `upsertContentBlock` call revalidates exactly the
right paths without hardcoding conditionals:

```typescript
const SECTION_ROUTES: Record<string, string[]> = {
  hero:           ['/'],
  about_preview:  ['/'],
  testimonials:   ['/'],
  services:       ['/'],
  why_lusso:      ['/'],
  gallery_images: ['/'],
  footer:         ['/'],
  business_info:  ['/', '/contact'],
  about_page:     ['/about'],
  experiences:    ['/experiences'],
};

function getSection(key: string): string {
  // "hero.heading" → "hero", "testimonials" → "testimonials"
  return key.includes('.') ? key.split('.')[0] : key;
}
```

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| DB unavailable during page render | `getContent`/`getContentSection` catches error, logs warning, returns fallback — page renders with static values |
| DB unavailable during admin save | `upsertContentBlock` catches Prisma error, returns `{ error: "Failed to save content: <message>" }` — no unhandled exception |
| Invalid JSON in `json`-type block | `getContentJson` catches `JSON.parse` error, logs `console.warn`, returns fallback |
| Empty string value submitted | Server action returns `{ error: "Value cannot be empty" }` before any DB call |
| Value exceeds 50,000 characters | Server action returns `{ error: "Value is too long (max 50 000 characters)" }` |
| Non-admin caller | Server action returns `{ error: "Unauthorized" }` — no DB call made |
| Vercel Blob upload failure | Upload handler returns error JSON; `ImageBlockEditor` displays error inline; no partial URL is persisted |

---

## Testing Strategy

### Unit Tests

Unit tests cover pure functions where concrete examples are most valuable:

- `getSection(key)` helper — verifies correct prefix extraction for dotted and non-dotted keys.
- `formatUpdatedAt(date)` — verifies the human-readable format for representative dates.
- `validateUpsertInput(key, value)` — empty string, whitespace-only, exactly 50,000 chars
  (valid), 50,001 chars (invalid).
- `JsonEditor` render tests — each structured editor type renders its fields correctly.
- `InlineEditor` — Cancel restores original value without calling the server action.

### Property-Based Tests

Property-based tests use a PBT library appropriate for TypeScript. The recommended choice is
[`fast-check`](https://github.com/dubzzz/fast-check), which integrates cleanly with Jest/Vitest
and is already common in Next.js projects. Each test is configured to run a minimum of 100
iterations.

Tag format: `// Feature: cms-content-management, Property {N}: {property_text}`


---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of
a system — essentially, a formal statement about what the system should do. Properties serve as
the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: ContentBlock upsert–read round-trip

*For any* valid content key, type, and non-empty value, upserting a `ContentBlock` and then
reading it back with `getContent` (or `getContentJson` for JSON type) SHALL return a value
structurally equal to what was stored, with the `updatedAt` field populated.

**Validates: Requirements 1.1, 1.3, 2.1**

### Property 2: Missing key returns the supplied fallback

*For any* key that has no corresponding row in the database, and *for any* non-empty fallback
string, `getContent(key, fallback)` SHALL return exactly `fallback` — never `null`, `undefined`,
or an empty string.

**Validates: Requirements 2.2, 7.2**

### Property 3: JSON round-trip preserves structure

*For any* JSON-serialisable value (object or array), storing it via
`upsertContentBlock(key, JSON.stringify(value))` and retrieving it via
`getContentJson(key, fallback)` SHALL produce a value that is deeply equal to the original,
regardless of key name or JSON structure complexity.

**Validates: Requirements 2.3**

### Property 4: Authorization guard rejects every non-admin caller

*For any* server session where the user role is not `ADMIN` (including null session, `CUSTOMER`
role, or a session with a missing role field), calling `upsertContentBlock(key, value)` SHALL
return `{ error: "Unauthorized" }` and SHALL NOT write any row to the database.

**Validates: Requirements 5.2, 5.3**

### Property 5: Input validation rejects all invalid values

*For any* content key, `upsertContentBlock` SHALL return a validation error when:
- the value is an empty string, or
- the value is a string composed entirely of whitespace, or
- the value length exceeds 50,000 characters.

Conversely, *for any* non-empty value of length ≤ 50,000 characters (that passes other
validation), the action SHALL not return a validation error for the value field.

**Validates: Requirements 5.5, 5.6**

### Property 6: Revalidation routing is correct and complete

*For any* content key belonging to a known section, after a successful `upsertContentBlock`
call, `revalidatePath` SHALL have been called with exactly the set of paths specified in the
routing table — no more and no fewer. Specifically:

- Keys with prefix `business_info.` trigger both `'/'` and `'/contact'`.
- Keys with prefix `about_page.` trigger only `'/about'`.
- Keys with prefix `experiences.` trigger only `'/experiences'`.
- All other managed keys trigger at least `'/'`.

**Validates: Requirements 5.4, 9.1, 9.2, 9.3, 9.4, 9.5**

### Property 7: Database unavailability yields fallback without exception

*For any* key, fallback value, and simulated database error, calling `getContent(key, fallback)`
or `getContentJson(key, fallback)` SHALL return `fallback` and SHALL NOT throw or cause an
unhandled promise rejection.

**Validates: Requirements 7.1**

### Property 8: Seed is idempotent

*For any* number of consecutive seed runs ≥ 2, the final count of `ContentBlock` rows in the
database SHALL equal the count after the first run, and the value of every seeded block SHALL
remain equal to the seed value (i.e., no duplicate rows and no value accumulation).

**Validates: Requirements 8.2**

### Property 9: `updatedAt` timestamp format is always human-readable

*For any* `Date` value, the `formatUpdatedAt(date)` utility SHALL return a string matching the
pattern `"D Mon YYYY, HH:MM"` (e.g., `"14 Jul 2025, 10:32"`), with valid month abbreviation,
two-digit hours and minutes, and a year in the range 2000–2100.

**Validates: Requirements 10.3**

### Property 10: Editor type matches content block type

*For any* `ContentBlock` record, rendering `InlineEditor` in edit mode SHALL produce exactly:
- a single `<input type="text">` element when `type === 'text'`,
- a single `<textarea>` element when `type === 'rich_text'`,
- the `JsonEditor` subtree (no `<input>` or `<textarea>` for the primary value) when
  `type === 'json'`,
- a URL `<input>` and an upload `<button>` when `type === 'image'`.

No other editor variant SHALL be rendered for any block type.

**Validates: Requirements 4.2, 4.3, 4.4, 4.5**

### Property 11: Error state preserves the admin's entered text

*For any* error message returned by `upsertContentBlock` and *for any* text the admin has
typed into an inline editor, when the server action returns `{ error }`, the editor field's
current value SHALL remain equal to the text the admin typed, and the error message SHALL be
displayed inline.

**Validates: Requirements 4.7**

