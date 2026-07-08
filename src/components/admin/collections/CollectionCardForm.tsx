"use client";

import { useState } from "react";
import type { CollectionCard } from "@/actions/admin/collections";

interface CollectionCardFormProps {
  card?: CollectionCard;
  onSubmit: (card: Omit<CollectionCard, "displayOrder">) => void;
  onCancel: () => void;
}

export function CollectionCardForm({ card, onSubmit, onCancel }: CollectionCardFormProps) {
  const [title, setTitle] = useState(card?.title ?? "");
  const [description, setDescription] = useState(card?.description ?? "");
  const [imageUrl, setImageUrl] = useState(card?.imageUrl ?? "");
  const [filterParam, setFilterParam] = useState(card?.filterParam ?? "");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "Title is required";
    } else if (title.length > 50) {
      newErrors.title = "Title must be 50 characters or less";
    }

    if (description.length > 150) {
      newErrors.description = "Description must be 150 characters or less";
    }

    if (!filterParam.trim()) {
      newErrors.filterParam = "Filter parameter is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      title: title.trim(),
      description,
      imageUrl,
      filterParam: filterParam.trim(),
    });
  }

  async function handleImageUpload(file: File) {
    setUploading(true);
    setUploadError(null);
    try {
      const body = new FormData();
      body.append("image", file);
      const res = await fetch("/api/admin/products/upload-image", { method: "POST", body });
      const data = await res.json();
      if (res.ok && data.imagePath) {
        setImageUrl(data.imagePath);
      } else {
        setUploadError(data.error ?? `Upload failed (${res.status})`);
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg border border-border bg-surface p-6 shadow-xl mx-4">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
          {card ? "Edit Collection Card" : "Add Collection Card"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1">
            <label htmlFor="card-title" className="block text-sm font-medium text-foreground">
              Title <span className="text-xs text-muted">({title.length}/50)</span>
            </label>
            <input
              id="card-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={51}
              className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors"
            />
            {errors.title && <p className="text-xs text-red-400">{errors.title}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label htmlFor="card-description" className="block text-sm font-medium text-foreground">
              Description <span className="text-xs text-muted">({description.length}/150)</span>
            </label>
            <textarea
              id="card-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={151}
              className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors resize-y"
            />
            {errors.description && <p className="text-xs text-red-400">{errors.description}</p>}
          </div>

          {/* Image URL with upload */}
          <div className="space-y-2">
            <label htmlFor="card-image" className="block text-sm font-medium text-foreground">
              Image
            </label>
            <div className="flex items-center gap-2">
              <input
                id="card-image"
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Image path or URL"
                disabled={uploading}
                className="flex-1 px-3 py-2 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors disabled:opacity-60"
              />
              <label className="cursor-pointer shrink-0">
                <span className="px-3 py-2 text-xs font-medium rounded-md border border-border text-foreground hover:bg-surface-muted transition-colors inline-block">
                  {uploading ? "Uploading…" : "Upload"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploading}
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            {uploading && (
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin text-muted" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <span className="text-xs text-muted">Uploading image…</span>
              </div>
            )}
            {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}

            {/* Image preview or placeholder */}
            {imageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={imageUrl}
                alt="Card preview"
                className="h-24 w-full rounded-md object-cover border border-border mt-1"
              />
            ) : (
              <div className="h-24 w-full rounded-md border border-dashed border-border bg-surface-muted flex items-center justify-center mt-1">
                <span className="text-xs text-muted">No image configured</span>
              </div>
            )}
          </div>

          {/* Filter Param */}
          <div className="space-y-1">
            <label htmlFor="card-filter" className="block text-sm font-medium text-foreground">
              Filter Parameter
            </label>
            <input
              id="card-filter"
              type="text"
              value={filterParam}
              onChange={(e) => setFilterParam(e.target.value)}
              placeholder="e.g. waxType=soy"
              className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors"
            />
            {errors.filterParam && <p className="text-xs text-red-400">{errors.filterParam}</p>}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-medium rounded-md border border-border text-foreground hover:bg-surface-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-4 py-2 text-xs font-medium rounded-md bg-theme-accent text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {card ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
