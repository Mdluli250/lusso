# Requirements Document

## Introduction

The CMS (Content Management System) feature replaces all hard-coded static content in the Lusso web app with database-driven content that administrators can edit through the existing admin panel at `/admin/content`. This includes every piece of page copy (headings, body text, descriptions, taglines, CTA labels), repeating content blocks (testimonials, services, gallery images), and business information (address, hours, contact details) currently stored in `src/lib/constants/brand.ts` or hard-coded inline in page components.

The CMS must integrate with the existing Next.js 14+ / Prisma / PostgreSQL stack and the admin panel UI patterns already established in the codebase. Admins should be able to edit any piece of managed content without touching code or triggering a redeployment. Frontend pages must serve CMS content with graceful fallbacks to the current static values so the site never renders empty or broken.

## Glossary

- **CMS**: Content Management System — the database-backed admin interface for editing site copy and images.
- **Content_Block**: A named, typed unit of editable content stored in the database (e.g., a string, rich-text, image URL, or structured JSON blob).
- **Content_Key**: A unique string identifier for a Content_Block, e.g. `hero.heading`, `about.body_1`, `testimonials`.
- **Page_Section**: A logical grouping of Content_Blocks belonging to one area of the site (e.g., `hero`, `about_preview`, `testimonials`, `services`, `gallery`, `footer`, `business_info`).
- **Admin**: An authenticated user with the `ADMIN` role as defined in the existing `UserRole` enum.
- **CMS_Service**: The server-side module responsible for reading and writing Content_Blocks to the database.
- **CMS_Admin_UI**: The admin interface at `/admin/content` for browsing and editing Content_Blocks.
- **Static_Fallback**: The original hard-coded value used when a Content_Block is absent from the database.
- **Image_Upload_Service**: The existing Vercel Blob–based upload pipeline already used in the gallery admin page.
- **Revalidation**: Next.js on-demand cache invalidation triggered after a Content_Block is saved.

## Requirements

---

### Requirement 1: Database Schema for Content Blocks

**User Story:** As an admin, I want all site copy and image references to be stored in the database, so that I can edit them without code changes or redeployments.

#### Acceptance Criteria

1. THE CMS_Service SHALL store each Content_Block as a row with at minimum: a unique Content_Key (`key`), a content type (`type`: one of `text`, `rich_text`, `image`, `json`), a string value (`value`), an optional label for the admin UI (`label`), and an optional description (`description`).
2. THE CMS_Service SHALL enforce uniqueness on the Content_Key at the database level.
3. WHEN a Content_Block is created or updated, THE CMS_Service SHALL record `updatedAt` automatically.
4. THE CMS_Service SHALL support the following Content_Keys at minimum, grouped by Page_Section:
   - `hero.heading`, `hero.subtext`, `hero.cta_label`, `hero.bg_image`
   - `about_preview.heading`, `about_preview.body_1`, `about_preview.body_2`, `about_preview.cta_label`
   - `about_page.heading`, `about_page.intro`, `about_page.story_heading`, `about_page.story_body_1`, `about_page.story_body_2`, `about_page.story_body_3`, `about_page.story_tagline`, `about_page.story_image`, `about_page.philosophy_heading`, `about_page.philosophy_body_1`, `about_page.philosophy_body_2`, `about_page.philosophy_body_3`, `about_page.philosophy_image`
   - `testimonials` (type `json`, stores an array of `{ quote, name }` objects)
   - `services` (type `json`, stores an array of `{ name, description }` objects)
   - `gallery_images` (type `json`, stores an array of `{ src, alt, width, height }` objects)
   - `business_info.address`, `business_info.hours`, `business_info.phone`, `business_info.phone_href`, `business_info.email`, `business_info.email_href`, `business_info.map_embed_url`
   - `experiences.intro_1`, `experiences.intro_2`, `experiences.intro_3`, `experiences.intro_tagline`, `experiences.picnics_heading`, `experiences.picnics_body_1`, `experiences.picnics_body_2`, `experiences.picnics_image`, `experiences.scent_heading`, `experiences.scent_body_1`, `experiences.scent_body_2`, `experiences.scent_image`
   - `footer.sustainability_text`, `footer.newsletter_heading`, `footer.newsletter_subtext`
   - `why_lusso.heading`, `why_lusso.items` (type `json`, stores an array of strings)

---

### Requirement 2: CMS Read API

**User Story:** As a visitor to the Lusso site, I want page content to load from the database, so that admins can update it without a redeployment.

#### Acceptance Criteria

1. WHEN a frontend page or component requests a Content_Block by its Content_Key, THE CMS_Service SHALL return the stored value from the database.
2. IF a Content_Block for a given Content_Key does not exist in the database, THEN THE CMS_Service SHALL return the corresponding Static_Fallback value defined in `src/lib/constants/brand.ts` or inline in the component.
3. WHEN the value type is `json`, THE CMS_Service SHALL parse and return the value as a JavaScript object or array.
4. IF JSON parsing of a `json`-type Content_Block fails, THEN THE CMS_Service SHALL return the Static_Fallback value and log a warning.
5. THE CMS_Service SHALL expose a `getContent(key: string, fallback: string): Promise<string>` function for scalar content types.
6. THE CMS_Service SHALL expose a `getContentJson<T>(key: string, fallback: T): Promise<T>` function for `json`-type blocks.
7. WHILE the Next.js page is rendering, THE CMS_Service SHALL use a single batched Prisma query to fetch all Content_Blocks for a given Page_Section in one database round-trip.

---

### Requirement 3: CMS Admin Interface — Content Listing

**User Story:** As an admin, I want to see all manageable content organised by page section on the `/admin/content` page, so that I can find and edit any piece of copy quickly.

#### Acceptance Criteria

1. WHEN an authenticated Admin navigates to `/admin/content`, THE CMS_Admin_UI SHALL display all Content_Blocks grouped by Page_Section.
2. THE CMS_Admin_UI SHALL display the Content_Key, label, current value, and an edit action for each Content_Block.
3. WHEN a Content_Block does not yet exist in the database, THE CMS_Admin_UI SHALL display the Static_Fallback value with a visual indicator that the item is using its default; WHEN a Content_Block exists in the database but the CMS_Service is actively returning a Static_Fallback due to a database connectivity issue, THE CMS_Admin_UI SHALL also show the same "Default value" indicator.
4. THE CMS_Admin_UI SHALL render within the existing admin shell layout, sidebar navigation, and design system already in use at `/admin`.
5. IF an unauthenticated or non-Admin user requests `/admin/content`, THEN THE CMS_Admin_UI SHALL redirect the user to the sign-in page and SHALL NOT render any content management UI during the redirect.

---

### Requirement 4: CMS Admin Interface — Inline Editing

**User Story:** As an admin, I want to edit any content block directly on the content management page, so that I can update site copy without navigating away.

#### Acceptance Criteria

1. WHEN an Admin clicks the edit action for a Content_Block, THE CMS_Admin_UI SHALL render an inline edit form replacing the read-only display for that block.
2. WHEN the Content_Block type is `text`, THE CMS_Admin_UI SHALL render exactly a single-line text `<input>` in the edit form and SHALL NOT offer any other editor type for that block.
3. WHEN the Content_Block type is `rich_text`, THE CMS_Admin_UI SHALL render exactly a multi-line `<textarea>` in the edit form and SHALL NOT offer any other editor type for that block.
4. WHEN the Content_Block type is `json`, THE CMS_Admin_UI SHALL render exactly a structured list editor appropriate to the content (e.g., a list of rows for testimonials with quote and name fields; a list of strings for `why_lusso.items`) and SHALL NOT offer any other editor type for that block.
5. WHEN the Content_Block type is `image`, THE CMS_Admin_UI SHALL render exactly a URL input and an upload button that triggers the Image_Upload_Service and SHALL NOT offer any other editor type for that block.
6. WHEN an Admin submits a valid edit form, THE CMS_Admin_UI SHALL call the server action to persist the change; THE server action SHALL save the change to the database regardless of whether the subsequent success confirmation is displayed successfully; WHEN the save succeeds, THE CMS_Admin_UI SHALL display a success confirmation.
7. IF the server action returns an error, THEN THE CMS_Admin_UI SHALL display the error message inline without losing the Admin's entered text.
8. WHEN an Admin clicks Cancel on an edit form, THE CMS_Admin_UI SHALL restore the read-only display without saving any changes.

---

### Requirement 5: CMS Write Server Action

**User Story:** As an admin, I want my content edits to be saved to the database immediately, so that the live site reflects my changes as quickly as possible.

#### Acceptance Criteria

1. THE CMS_Service SHALL expose a `upsertContentBlock(key, value)` server action that creates a new Content_Block or updates an existing one.
2. WHEN `upsertContentBlock` is called, THE CMS_Service SHALL verify that the caller has the `ADMIN` role before writing to the database.
3. IF the caller does not have the `ADMIN` role, THEN THE CMS_Service SHALL return an error response with the message "Unauthorized" and make no database changes.
4. WHEN `upsertContentBlock` successfully writes to the database, THE CMS_Service SHALL call `revalidatePath` for all frontend routes that render the affected Content_Block.
5. WHEN `upsertContentBlock` is called with an empty string value, THE CMS_Service SHALL reject the operation and return a validation error.
6. WHEN `upsertContentBlock` is called with a value exceeding 50,000 characters, THE CMS_Service SHALL reject the operation and return a validation error.
7. IF a database write fails, THEN THE CMS_Service SHALL return a descriptive error message without throwing an unhandled exception.

---

### Requirement 6: Image Management via CMS

**User Story:** As an admin, I want to upload new images for any image-type content block and have the URL saved automatically, so that I can replace hero backgrounds, about page images, and experience images without editing code.

#### Acceptance Criteria

1. WHEN an Admin uploads an image for an `image`-type Content_Block, THE Image_Upload_Service SHALL upload the file to Vercel Blob and return a public URL.
2. WHEN the upload succeeds, THE CMS_Admin_UI SHALL populate the image URL field with the returned Vercel Blob URL automatically.
3. WHEN an Admin saves an `image`-type Content_Block, THE CMS_Service SHALL store the Vercel Blob URL as the Content_Block value.
4. WHEN a frontend page renders an `image`-type Content_Block, THE CMS_Service SHALL return the stored URL so the page can use it as an image source.
5. IF the Vercel Blob upload fails, THEN THE Image_Upload_Service SHALL return an error message to THE CMS_Admin_UI without saving a partial URL to the database.
6. THE CMS_Admin_UI SHALL display a thumbnail preview of the current image for any `image`-type Content_Block.

---

### Requirement 7: Frontend Integration — Graceful Fallbacks

**User Story:** As a site visitor, I want the Lusso website to always display complete, meaningful content, so that the site never appears broken or empty even if the database is unavailable.

#### Acceptance Criteria

1. WHEN the database is unavailable during a page render, THE CMS_Service SHALL return Static_Fallback values for all requested Content_Blocks without throwing an unhandled exception.
2. WHEN a Content_Block value is an empty string in the database, THE CMS_Service SHALL treat it as absent and return the Static_Fallback value instead.
3. THE HeroSection SHALL read `hero.heading`, `hero.subtext`, `hero.cta_label`, and `hero.bg_image` from THE CMS_Service, falling back to the current hard-coded values.
4. THE Testimonials component SHALL read the `testimonials` Content_Block from THE CMS_Service, falling back to the `TESTIMONIALS` constant.
5. THE Services component SHALL read the `why_lusso.items` Content_Block from THE CMS_Service, falling back to the current hard-coded list.
6. THE Gallery component SHALL read the `gallery_images` Content_Block from THE CMS_Service, falling back to the `GALLERY_IMAGES` constant.
7. THE Footer component SHALL read all `business_info.*` and `footer.*` Content_Blocks from THE CMS_Service, falling back to the `BUSINESS_INFO` constant and existing hard-coded strings.
8. THE AboutPreview component SHALL read all `about_preview.*` Content_Blocks from THE CMS_Service, falling back to the existing hard-coded strings.
9. THE About page SHALL read all `about_page.*` Content_Blocks from THE CMS_Service, falling back to the existing hard-coded strings.
10. THE Experiences page SHALL read all `experiences.*` Content_Blocks from THE CMS_Service, falling back to the existing hard-coded strings.

---

### Requirement 8: Database Seeding for Initial Content

**User Story:** As a developer deploying the CMS for the first time, I want all existing static content to be pre-loaded into the database, so that the site looks identical before and after the CMS migration.

#### Acceptance Criteria

1. THE CMS_Service SHALL provide a seed function that populates the database with all current static values from `src/lib/constants/brand.ts` and from the hard-coded strings in page components.
2. WHEN the seed function is run, THE CMS_Service SHALL use `upsert` semantics so that running the seed multiple times does not create duplicate rows or overwrite admin edits made after the initial seed.
3. WHEN a migration is applied to the database, THE developer SHALL be able to run the seed function via the existing `prisma db seed` script entry point.

---

### Requirement 9: Content Revalidation

**User Story:** As an admin, I want the live site to reflect my content edits immediately after saving, so that visitors see updated copy without requiring a server restart or redeployment.

#### Acceptance Criteria

1. WHEN a Content_Block belonging to the `hero`, `about_preview`, `testimonials`, `services`, `gallery_images`, `why_lusso`, or `footer` sections is updated, THE CMS_Service SHALL call `revalidatePath('/')` to purge the home page cache.
2. WHEN a Content_Block belonging to the `about_page` section is updated, THE CMS_Service SHALL call `revalidatePath('/about')`.
3. WHEN a Content_Block belonging to the `experiences` section is updated, THE CMS_Service SHALL call `revalidatePath('/experiences')`.
4. WHEN a Content_Block belonging to the `business_info` section is updated, THE CMS_Service SHALL call `revalidatePath('/contact')` in addition to `revalidatePath('/')`.
5. WHEN `upsertContentBlock` is called, THE CMS_Service SHALL revalidate all affected paths within the same server action call before returning a success response.

---

### Requirement 10: Audit Trail

**User Story:** As an admin, I want to know when each piece of content was last modified, so that I can track changes and understand the history of the site.

#### Acceptance Criteria

1. THE CMS_Admin_UI SHALL display the `updatedAt` timestamp for each Content_Block that has been saved to the database.
2. WHEN a Content_Block is serving a Static_Fallback value — whether because it does not yet exist in the database or because the database is temporarily unavailable — THE CMS_Admin_UI SHALL show "Default value" in place of the `updatedAt` timestamp.
3. THE CMS_Admin_UI SHALL format `updatedAt` timestamps in a human-readable format (e.g., "14 Jul 2025, 10:32").
