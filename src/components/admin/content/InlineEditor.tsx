"use client";

import { useState, useTransition } from "react";
import { upsertContentBlock } from "@/actions/admin/content";
import type { UpsertResult } from "@/actions/admin/content";
import { JsonEditor } from "./JsonEditor";
import { Button } from "@/components/ui/Button";

// Feature: cms-content-management
// Implements inline editing of a single ContentBlock.
// Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 6.1, 6.2, 6.3, 6.5, 6.6

interface InlineEditorBlock {
  key: string;
  type: string;
  value: string;
  label?: string | null;
}

interface InlineEditorProps {
  block: InlineEditorBlock;
  onSave: (newValue: string) => Promise<void>;
  onCancel: () => void;
}

export function InlineEditor({ block, onSave, onCancel }: InlineEditorProps) {
  const [draft, setDraft] = useState(block.value);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Image upload state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleImageUpload(file: File) {
    setUploading(true);
    setUploadError(null);
    try {
      const body = new FormData();
      body.append("image", file);
      const res = await fetch("/api/admin/products/upload-image", { method: "POST", body });
      const data = await res.json();
      if (res.ok && data.imagePath) {
        setDraft(data.imagePath);
      } else {
        setUploadError(data.error ?? `Upload failed (${res.status})`);
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleSave() {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result: UpsertResult = await upsertContentBlock(block.key, draft);
      if ("error" in result) {
        // Property 11: draft is preserved on error (state not reset here)
        setError(result.error);
        return;
      }
      setSuccess(true);
      await onSave(draft);
    });
  }

  return (
    <div className="space-y-3">
      {/* ── Editor input ─────────────────────────────────────── */}
      {block.type === "text" && (
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={isPending}
          aria-label={block.label ?? block.key}
          className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors disabled:opacity-60"
        />
      )}

      {block.type === "rich_text" && (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={isPending}
          rows={6}
          aria-label={block.label ?? block.key}
          className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors resize-y disabled:opacity-60"
        />
      )}

      {block.type === "image" && (
        <div className="space-y-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={isPending || uploading}
            placeholder="Image path or URL"
            aria-label={block.label ?? block.key}
            className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors disabled:opacity-60"
          />
          <div className="flex items-center gap-3">
            <label className="cursor-pointer">
              <span className="px-3 py-1.5 text-xs font-medium rounded-md border border-border text-foreground hover:bg-surface-muted transition-colors inline-block">
                {uploading ? "Uploading…" : "Upload image"}
              </span>
              <input
                type="file"
                accept="image/*"
                disabled={isPending || uploading}
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                  e.target.value = "";
                }}
              />
            </label>
            {uploading && (
              <svg className="h-4 w-4 animate-spin text-muted" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            )}
          </div>
          {uploadError && (
            <p className="text-xs text-red-400">{uploadError}</p>
          )}
          {draft && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={draft}
              alt="Preview"
              className="h-24 rounded-md object-cover border border-border mt-1"
            />
          )}
        </div>
      )}

      {block.type === "json" && (
        <JsonEditor
          blockKey={block.key}
          value={draft}
          onChange={(json) => setDraft(json)}
          label={block.label ?? undefined}
        />
      )}

      {/* ── Feedback messages ────────────────────────────────── */}
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

      {/* ── Action buttons ───────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          disabled={isPending || uploading}
        >
          {isPending ? "Saving…" : "Save"}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
