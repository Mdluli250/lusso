"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { uploadGalleryImages } from "@/actions/admin/gallery";
import type { UploadResult } from "@/types/gallery";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB
const MAX_BATCH_SIZE = 10;

interface ValidationError {
  filename: string;
  reason: string;
}

/**
 * GalleryUploadZone — client component with drag-and-drop file upload area.
 * Validates files client-side (max 10 files, ≤ 4 MB each, JPEG/PNG/WebP only)
 * before submitting valid files to the uploadGalleryImages server action.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.5, 1.6
 */
export function GalleryUploadZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const validateFiles = useCallback(
    (files: File[]): { valid: File[]; errors: ValidationError[] } => {
      const errors: ValidationError[] = [];

      // Check batch size limit
      if (files.length > MAX_BATCH_SIZE) {
        errors.push({
          filename: "batch",
          reason: `Maximum of ${MAX_BATCH_SIZE} files per upload. You selected ${files.length}.`,
        });
        return { valid: [], errors };
      }

      const valid: File[] = [];

      for (const file of files) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          errors.push({
            filename: file.name,
            reason: "Invalid file type. Accepted formats: JPEG, PNG, WebP",
          });
          continue;
        }

        if (file.size > MAX_FILE_SIZE) {
          errors.push({
            filename: file.name,
            reason: "File exceeds the 4 MB maximum file size limit",
          });
          continue;
        }

        valid.push(file);
      }

      return { valid, errors };
    },
    []
  );

  const handleFiles = useCallback(
    (files: File[]) => {
      // Clear previous results
      setUploadResult(null);

      // Client-side validation
      const { valid, errors } = validateFiles(files);
      setValidationErrors(errors);

      // If no valid files, stop here
      if (valid.length === 0) {
        return;
      }

      // Submit valid files to server action
      startTransition(async () => {
        const formData = new FormData();
        for (const file of valid) {
          formData.append("files", file);
        }

        const result = await uploadGalleryImages(formData);
        setUploadResult(result);

        // Refresh the page data to show newly uploaded images in the grid
        if (result.uploaded.length > 0) {
          router.refresh();
        }
      });
    },
    [validateFiles, router]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFiles(files);
      }
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        handleFiles(files);
      }
      // Reset the input so the same file(s) can be selected again
      e.target.value = "";
    },
    [handleFiles]
  );

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
          isDragging
            ? "border-accent bg-accent/5"
            : "border-border bg-surface hover:border-accent/50"
        } ${isPending ? "opacity-60 pointer-events-none" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {isPending ? (
          <div className="space-y-2">
            <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <p className="text-sm text-muted">Uploading images…</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted">
              Drag and drop images here, or click to select files
            </p>
            <p className="text-xs text-muted/70 mt-1">
              JPEG, PNG, or WebP • Max 4 MB per file • Up to 10 files at once
            </p>
          </>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleInputChange}
        aria-label="Upload gallery images"
      />

      {/* Client-side validation errors */}
      {validationErrors.length > 0 && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 space-y-1">
          <p className="text-sm font-medium text-red-800">
            Validation errors:
          </p>
          <ul className="text-xs text-red-700 space-y-0.5">
            {validationErrors.map((err, i) => (
              <li key={i}>
                <span className="font-medium">{err.filename}:</span>{" "}
                {err.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Upload results */}
      {uploadResult && (
        <div className="space-y-2">
          {/* Successful uploads */}
          {uploadResult.uploaded.length > 0 && (
            <div className="rounded-lg border border-green-300 bg-green-50 p-3 space-y-1">
              <p className="text-sm font-medium text-green-800">
                Successfully uploaded {uploadResult.uploaded.length} file
                {uploadResult.uploaded.length !== 1 ? "s" : ""}:
              </p>
              <ul className="text-xs text-green-700 space-y-0.5">
                {uploadResult.uploaded.map((file) => (
                  <li key={file.id}>✓ {file.filename}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Server-side errors */}
          {uploadResult.errors.length > 0 && (
            <div className="rounded-lg border border-red-300 bg-red-50 p-3 space-y-1">
              <p className="text-sm font-medium text-red-800">
                Upload errors:
              </p>
              <ul className="text-xs text-red-700 space-y-0.5">
                {uploadResult.errors.map((err, i) => (
                  <li key={i}>
                    <span className="font-medium">{err.filename}:</span>{" "}
                    {err.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
