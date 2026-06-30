import type { ContentBlock } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  CONTENT_REGISTRY,
  SECTION_LABELS,
} from "@/lib/cms/registry";
import {
  ContentSectionPanel,
  type ContentSectionRow,
} from "@/components/admin/content/ContentSectionPanel";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Derive the section key from a content key.
 * For dotted keys like "hero.heading" → "hero".
 * For standalone keys like "testimonials" → "testimonials".
 */
function getSection(key: string): string {
  return key.includes(".") ? key.split(".")[0] : key;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

/**
 * Admin Content Management page — async Server Component.
 *
 * Fetches all ContentBlock records from the database, groups them by section
 * using the CONTENT_REGISTRY, and renders a <ContentSectionPanel> per section.
 *
 * No duplicate auth guard needed — src/app/admin/layout.tsx already handles it.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */
export default async function AdminContentPage() {
  // Fetch all content blocks in a single query
  const blocks = await prisma.contentBlock.findMany({
    orderBy: { key: "asc" },
  });

  // Build a lookup map: key → ContentBlock
  const blockMap = new Map<string, ContentBlock>();
  for (const block of blocks) {
    blockMap.set(block.key, block);
  }

  // Group registry entries by section, preserving registry order
  const sectionOrder: string[] = [];
  const sectionRows = new Map<string, ContentSectionRow[]>();

  for (const entry of CONTENT_REGISTRY) {
    const section = getSection(entry.key);

    if (!sectionRows.has(section)) {
      sectionOrder.push(section);
      sectionRows.set(section, []);
    }

    sectionRows.get(section)!.push({
      key: entry.key,
      label: entry.label,
      description: entry.description,
      fallback: entry.value,
      block: blockMap.get(entry.key) ?? null,
    });
  }

  // Empty state — no registry entries and no blocks
  if (CONTENT_REGISTRY.length === 0 && blocks.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Content Management</h1>
        <div className="rounded-lg border border-border bg-surface p-8 text-center">
          <p className="text-muted text-sm">
            No content blocks have been configured yet. Run the database seed to
            populate the CMS registry.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Content Management</h1>
        <p className="text-sm text-muted mt-1">
          Edit site copy, images, and structured content. Changes are reflected
          on the live site immediately after saving.
        </p>
      </div>

      {sectionOrder.map((section) => (
        <ContentSectionPanel
          key={section}
          section={section}
          label={SECTION_LABELS[section] ?? section}
          rows={sectionRows.get(section)!}
        />
      ))}
    </div>
  );
}
