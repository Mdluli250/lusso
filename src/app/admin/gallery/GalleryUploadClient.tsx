'use client';

import { useState } from 'react';

/**
 * GalleryUploadClient — client component for uploading gallery images
 * to Vercel Blob via the existing upload-image API route.
 */
export function GalleryUploadClient() {
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<{ name: string; url: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    setError(null);
    const uploaded: { name: string; url: string }[] = [];

    for (const file of Array.from(files)) {
      try {
        const body = new FormData();
        body.append('image', file);
        const res = await fetch('/api/admin/products/upload-image', { method: 'POST', body });
        if (res.ok) {
          const data = await res.json();
          uploaded.push({ name: file.name, url: data.imagePath });
        } else {
          const err = await res.json().catch(() => ({ error: `Failed (${res.status})` }));
          setError(`${file.name}: ${err.error}`);
        }
      } catch (err) {
        setError(`${file.name}: ${err instanceof Error ? err.message : 'Upload failed'}`);
      }
    }

    setResults((prev) => [...uploaded, ...prev]);
    setUploading(false);
    e.target.value = '';
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-5 space-y-4">
      <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Upload New Gallery Images</h2>
      <p className="text-xs text-muted">
        Images are uploaded to Vercel Blob. Copy the URL and update{' '}
        <code className="bg-surface-muted px-1 rounded">brand.ts</code> to use it.
      </p>

      <input
        type="file"
        accept="image/*"
        multiple
        disabled={uploading}
        onChange={handleUpload}
        className="w-full text-sm rounded-md border border-border bg-surface text-foreground disabled:opacity-50 cursor-pointer"
      />

      {uploading && (
        <div className="flex items-center gap-2 text-sm text-muted">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Uploading…
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-foreground">Uploaded successfully — copy these URLs into brand.ts:</p>
          {results.map((r) => (
            <div key={r.url} className="flex items-start gap-2 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{r.name}</p>
                <p className="text-xs text-green-600 break-all mt-0.5">{r.url}</p>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(r.url)}
                className="text-xs px-2 py-1 rounded border border-border text-muted hover:text-foreground transition-colors shrink-0"
              >
                Copy
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
