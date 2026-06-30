"use client";

// Feature: cms-content-management
// Renders a structured list editor for JSON-typed content blocks.
// Requirements: 4.4

import { useState, useEffect } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TestimonialRow {
  quote: string;
  name: string;
}

interface ServiceRow {
  name: string;
  description: string;
}

interface GalleryImageRow {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface JsonEditorProps {
  /** The content block key — determines which structured editor is rendered. */
  blockKey: string;
  /** Current JSON value as a serialised string. */
  value: string;
  /** Called with the new serialised JSON string whenever the editor state changes. */
  onChange: (json: string) => void;
  /** Optional label shown above the editor. */
  label?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeParse<T>(json: string, fallback: T): T {
  try {
    const parsed = JSON.parse(json);
    return parsed as T;
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Sub-editors
// ---------------------------------------------------------------------------

interface TestimonialsEditorProps {
  value: string;
  onChange: (json: string) => void;
}

function TestimonialsEditor({ value, onChange }: TestimonialsEditorProps) {
  const [rows, setRows] = useState<TestimonialRow[]>(() =>
    safeParse<TestimonialRow[]>(value, [])
  );

  // Keep parent in sync
  useEffect(() => {
    onChange(JSON.stringify(rows));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  function updateRow(index: number, field: keyof TestimonialRow, val: string) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: val } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { quote: "", name: "" }]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div
          key={index}
          className="rounded-lg border border-border bg-surface-muted p-3 space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Testimonial {index + 1}</span>
            <button
              type="button"
              onClick={() => removeRow(index)}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Remove
            </button>
          </div>
          <div className="space-y-1">
            <label className="block text-xs text-muted">Quote</label>
            <textarea
              value={row.quote}
              onChange={(e) => updateRow(index, "quote", e.target.value)}
              rows={2}
              className="w-full px-3 py-1.5 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors resize-y"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs text-muted">Name</label>
            <input
              type="text"
              value={row.name}
              onChange={(e) => updateRow(index, "name", e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors"
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="w-full px-3 py-1.5 text-xs font-medium rounded-md border border-dashed border-border text-muted hover:border-theme-accent hover:text-foreground transition-colors"
      >
        + Add testimonial
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------

interface ServicesEditorProps {
  value: string;
  onChange: (json: string) => void;
}

function ServicesEditor({ value, onChange }: ServicesEditorProps) {
  const [rows, setRows] = useState<ServiceRow[]>(() =>
    safeParse<ServiceRow[]>(value, [])
  );

  useEffect(() => {
    onChange(JSON.stringify(rows));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  function updateRow(index: number, field: keyof ServiceRow, val: string) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: val } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { name: "", description: "" }]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div
          key={index}
          className="rounded-lg border border-border bg-surface-muted p-3 space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Service {index + 1}</span>
            <button
              type="button"
              onClick={() => removeRow(index)}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Remove
            </button>
          </div>
          <div className="space-y-1">
            <label className="block text-xs text-muted">Name</label>
            <input
              type="text"
              value={row.name}
              onChange={(e) => updateRow(index, "name", e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs text-muted">Description</label>
            <textarea
              value={row.description}
              onChange={(e) => updateRow(index, "description", e.target.value)}
              rows={2}
              className="w-full px-3 py-1.5 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors resize-y"
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="w-full px-3 py-1.5 text-xs font-medium rounded-md border border-dashed border-border text-muted hover:border-theme-accent hover:text-foreground transition-colors"
      >
        + Add service
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------

interface GalleryImagesEditorProps {
  value: string;
  onChange: (json: string) => void;
}

function GalleryImagesEditor({ value, onChange }: GalleryImagesEditorProps) {
  const [rows, setRows] = useState<GalleryImageRow[]>(() =>
    safeParse<GalleryImageRow[]>(value, [])
  );

  useEffect(() => {
    onChange(JSON.stringify(rows));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  function updateRow(
    index: number,
    field: keyof GalleryImageRow,
    val: string | number
  ) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: val } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { src: "", alt: "", width: 0, height: 0 }]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div
          key={index}
          className="rounded-lg border border-border bg-surface-muted p-3 space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Image {index + 1}</span>
            <button
              type="button"
              onClick={() => removeRow(index)}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Remove
            </button>
          </div>
          <div className="space-y-1">
            <label className="block text-xs text-muted">Source URL</label>
            <input
              type="text"
              value={row.src}
              onChange={(e) => updateRow(index, "src", e.target.value)}
              placeholder="/images/gallery/example.png"
              className="w-full px-3 py-1.5 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs text-muted">Alt text</label>
            <input
              type="text"
              value={row.alt}
              onChange={(e) => updateRow(index, "alt", e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="block text-xs text-muted">Width (px)</label>
              <input
                type="number"
                min="0"
                value={row.width}
                onChange={(e) => updateRow(index, "width", parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-1.5 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs text-muted">Height (px)</label>
              <input
                type="number"
                min="0"
                value={row.height}
                onChange={(e) => updateRow(index, "height", parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-1.5 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors"
              />
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="w-full px-3 py-1.5 text-xs font-medium rounded-md border border-dashed border-border text-muted hover:border-theme-accent hover:text-foreground transition-colors"
      >
        + Add image
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------

interface StringListEditorProps {
  value: string;
  onChange: (json: string) => void;
  addLabel?: string;
  itemLabel?: string;
}

function StringListEditor({
  value,
  onChange,
  addLabel = "+ Add item",
  itemLabel = "Item",
}: StringListEditorProps) {
  const [rows, setRows] = useState<string[]>(() =>
    safeParse<string[]>(value, [])
  );

  useEffect(() => {
    onChange(JSON.stringify(rows));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  function updateRow(index: number, val: string) {
    setRows((prev) => prev.map((r, i) => (i === index ? val : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, ""]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      {rows.map((row, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="text"
            value={row}
            aria-label={`${itemLabel} ${index + 1}`}
            onChange={(e) => updateRow(index, e.target.value)}
            className="flex-1 px-3 py-1.5 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors"
          />
          <button
            type="button"
            onClick={() => removeRow(index)}
            aria-label={`Remove ${itemLabel.toLowerCase()} ${index + 1}`}
            className="shrink-0 text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="w-full px-3 py-1.5 text-xs font-medium rounded-md border border-dashed border-border text-muted hover:border-theme-accent hover:text-foreground transition-colors"
      >
        {addLabel}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * JsonEditor — renders a structured list editor appropriate to the content key.
 *
 * Supported keys:
 *   - `testimonials`    → list of { quote, name } rows
 *   - `services`        → list of { name, description } rows
 *   - `gallery_images`  → list of { src, alt, width, height } rows
 *   - `why_lusso.items` → list of plain strings
 *   - anything else     → raw JSON textarea fallback
 *
 * Requirements: 4.4
 */
export function JsonEditor({ blockKey, value, onChange, label }: JsonEditorProps) {
  if (blockKey === "testimonials") {
    return (
      <div className="space-y-2">
        {label && (
          <p className="text-xs text-muted font-medium">{label}</p>
        )}
        <TestimonialsEditor value={value} onChange={onChange} />
      </div>
    );
  }

  if (blockKey === "services") {
    return (
      <div className="space-y-2">
        {label && (
          <p className="text-xs text-muted font-medium">{label}</p>
        )}
        <ServicesEditor value={value} onChange={onChange} />
      </div>
    );
  }

  if (blockKey === "gallery_images") {
    return (
      <div className="space-y-2">
        {label && (
          <p className="text-xs text-muted font-medium">{label}</p>
        )}
        <GalleryImagesEditor value={value} onChange={onChange} />
      </div>
    );
  }

  if (blockKey === "why_lusso.items") {
    return (
      <div className="space-y-2">
        {label && (
          <p className="text-xs text-muted font-medium">{label}</p>
        )}
        <StringListEditor
          value={value}
          onChange={onChange}
          addLabel="+ Add reason"
          itemLabel="Reason"
        />
      </div>
    );
  }

  // Fallback: raw JSON textarea for any unrecognised JSON key
  return (
    <RawJsonEditor blockKey={blockKey} value={value} onChange={onChange} label={label} />
  );
}

// ---------------------------------------------------------------------------
// Raw JSON textarea fallback
// ---------------------------------------------------------------------------

function RawJsonEditor({ value, onChange, label }: JsonEditorProps) {
  const [draft, setDraft] = useState(value);
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Sync draft when value prop changes externally
  useEffect(() => {
    setDraft(value);
  }, [value]);

  function handleChange(next: string) {
    setDraft(next);
    try {
      JSON.parse(next);
      setJsonError(null);
      onChange(next);
    } catch {
      setJsonError("Invalid JSON — fix the syntax before saving.");
    }
  }

  return (
    <div className="space-y-2">
      {label && (
        <p className="text-xs text-muted font-medium">{label}</p>
      )}
      <textarea
        value={draft}
        onChange={(e) => handleChange(e.target.value)}
        rows={8}
        spellCheck={false}
        className={[
          "w-full px-3 py-2 text-sm font-mono rounded-md border bg-surface text-foreground transition-colors resize-y",
          jsonError ? "border-red-400 focus:border-red-400" : "border-border focus:border-theme-accent",
        ].join(" ")}
      />
      {jsonError && (
        <p className="text-xs text-red-400">{jsonError}</p>
      )}
    </div>
  );
}
