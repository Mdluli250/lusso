"use client";

import { useState, useTransition } from "react";
import type { ContentBlock } from "@prisma/client";
import { InlineEditor } from "./InlineEditor";
import { JsonEditor } from "./JsonEditor";
import { upsertContentBlock } from "@/actions/admin/content";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Format a Date as "D Mon YYYY, HH:MM"
 * e.g. "14 Jul 2025, 10:32"
 *
 * Requirements: 10.3
 */
export function formatUpdatedAt(date: Date): string {
  const d = date.getDate();
  const mon = MONTH_ABBR[date.getMonth()];
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${d} ${mon} ${yyyy}, ${hh}:${mm}`;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ContentBlockRowProps {
  /** The database record, or null if the block is using its static fallback. */
  block: ContentBlock | null;
  /** The static fallback value shown when block is null. */
  fallbackValue: string;
  /** Human-readable label for the block (e.g. "Hero heading"). */
  label: string;
  /** Optional longer description shown as secondary text. */
  description?: string;
}

// ---------------------------------------------------------------------------
// JsonEditorWrapper — wraps JsonEditor with save/cancel actions
// ---------------------------------------------------------------------------

interface JsonEditorWrapperProps {
  block: ContentBlock | { id: string; key: string; type: string; value: string; label: string | null; description: string | null; updatedAt: Date; createdAt: Date };
  onSave: (newValue: string) => Promise<void>;
  onCancel: () => void;
}

function JsonEditorWrapper({ block, onSave, onCancel }: JsonEditorWrapperProps) {
  const [draft, setDraft] = useState(block.value);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      try {
        const result = await upsertContentBlock(block.key, draft);
        if ("error" in result) {
          setError(result.error);
          return;
        }
        setSuccess(true);
        await onSave(draft);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  return (
    <div className="space-y-3">
      <JsonEditor
        blockKey={block.key}
        value={draft}
        onChange={setDraft}
      />

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2">
          <p className="text-xs text-green-500">Saved successfully.</p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="px-4 py-1.5 text-xs font-medium rounded-md bg-theme-accent text-white hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="px-4 py-1.5 text-xs font-medium rounded-md border border-border text-foreground hover:bg-surface-muted transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * ContentBlockRow
 *
 * Renders a single content block row in the admin content management panel.
 * Shows the block's label, key, current value (truncated), and last-updated
 * timestamp (or a "Default value" badge when the block isn't in the DB).
 *
 * An Edit button mounts <InlineEditor> in-place; Cancel restores the
 * read-only display.
 *
 * Requirements: 3.2, 3.3, 10.1, 10.2, 10.3
 */
export function ContentBlockRow({
  block,
  fallbackValue,
  label,
  description,
}: ContentBlockRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [optimisticValue, setOptimisticValue] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // The value to display — prefer the optimistically updated value so the UI
  // reflects a successful save immediately.
  const displayValue = optimisticValue ?? block?.value ?? fallbackValue;
  const truncated =
    displayValue.length > 120
      ? displayValue.slice(0, 120) + "…"
      : displayValue;

  // The block object passed to InlineEditor; if null we pass a synthetic
  // object built from the fallback so the editor has an initial value.
  const editorBlock = block ?? {
    id: "",
    key: label, // will be overridden by parent; InlineEditor uses block.key
    type: "text" as const,
    value: fallbackValue,
    label,
    description: description ?? null,
    updatedAt: new Date(),
    createdAt: new Date(),
  };

  async function handleSave(newValue: string) {
    // Both InlineEditor and JsonEditorWrapper call upsertContentBlock
    // internally — this callback fires only after a successful save.
    startTransition(() => {
      setOptimisticValue(newValue);
    });
    setIsEditing(false);
  }

  function handleCancel() {
    setIsEditing(false);
  }

  // ── Read-only view ──────────────────────────────────────────────────────

  if (!isEditing) {
    return (
      <div className="flex items-start gap-4 py-4">
        {/* Labels + value */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-sm font-medium text-foreground">{label}</span>
            <code className="text-xs text-muted font-mono bg-surface-muted px-1.5 py-0.5 rounded">
              {editorBlock.key}
            </code>
          </div>

          {description && (
            <p className="text-xs text-muted">{description}</p>
          )}

          <p className="text-sm text-foreground/80 break-words">{truncated}</p>

          {/* Timestamp / default badge */}
          {block ? (
            <p className="text-xs text-muted">
              Updated {formatUpdatedAt(new Date(block.updatedAt))}
            </p>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
              Default value
            </span>
          )}
        </div>

        {/* Edit button */}
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-md border border-border text-foreground hover:bg-surface-muted transition-colors"
        >
          Edit
        </button>
      </div>
    );
  }

  // ── Editing view ────────────────────────────────────────────────────────

  return (
    <div className="py-4 space-y-2">
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <code className="text-xs text-muted font-mono bg-surface-muted px-1.5 py-0.5 rounded">
          {editorBlock.key}
        </code>
      </div>

      {description && (
        <p className="text-xs text-muted">{description}</p>
      )}

      {editorBlock.type === "json" ? (
        <JsonEditorWrapper
          block={editorBlock}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      ) : (
        <InlineEditor
          block={editorBlock}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
