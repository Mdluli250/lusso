import type { ContentBlock } from "@prisma/client";
import { ContentBlockRow } from "./ContentBlockRow";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ContentSectionRow {
  key: string;
  label: string;
  description?: string;
  fallback: string;
  block: ContentBlock | null;
}

interface ContentSectionPanelProps {
  /** Internal section key, e.g. "hero" or "about_page". */
  section: string;
  /** Human-readable section heading, e.g. "Hero Section". */
  label: string;
  /** Array of rows to render inside this panel. */
  rows: ContentSectionRow[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * ContentSectionPanel
 *
 * Server Component that renders a labelled card containing one
 * <ContentBlockRow> per content block within a section.
 *
 * Requirements: 3.1, 3.4
 */
export function ContentSectionPanel({ section, label, rows }: ContentSectionPanelProps) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5 space-y-1">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          {label}
        </h2>
        <span className="text-xs text-muted">
          {rows.length} {rows.length === 1 ? "block" : "blocks"}
        </span>
      </div>

      <div className="divide-y divide-border">
        {rows.map((row) => (
          <ContentBlockRow
            key={row.key}
            block={row.block}
            fallbackValue={row.fallback}
            label={row.label}
            description={row.description}
          />
        ))}
      </div>
    </div>
  );
}
