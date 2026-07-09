"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { GalleryImageRecord } from "@/types/gallery";
import { GalleryImageCard } from "./GalleryImageCard";
import { reorderGalleryImages } from "@/actions/admin/gallery";
import { updateGalleryImage } from "@/actions/admin/gallery";
import { deleteGalleryImage } from "@/actions/admin/gallery";

interface GalleryGridProps {
  images: GalleryImageRecord[];
}

/** Sortable wrapper for each GalleryImageCard */
function SortableImageCard({
  image,
  onEdit,
  onDelete,
  disabled,
}: {
  image: GalleryImageRecord;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  disabled: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: disabled ? "default" : "grab",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <GalleryImageCard image={image} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

/**
 * GalleryGrid — client component with drag-and-drop reorder, inline edit modal,
 * and delete confirmation dialog.
 *
 * Requirements: 3.1, 3.2, 3.4, 4.1, 4.2, 4.5, 4.6, 5.1, 5.2, 5.3, 5.4, 5.5
 */
export function GalleryGrid({ images: initialImages }: GalleryGridProps) {
  const router = useRouter();
  const [images, setImages] = useState<GalleryImageRecord[]>(initialImages);
  const [isReordering, setIsReordering] = useState(false);
  const [reorderError, setReorderError] = useState<string | null>(null);

  // Sync local state when server data changes (after router.refresh())
  useEffect(() => {
    setImages(initialImages);
  }, [initialImages]);

  // Edit modal state
  const [editingImage, setEditingImage] = useState<GalleryImageRecord | null>(null);
  const [editAlt, setEditAlt] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editError, setEditError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirmation state
  const [deletingImage, setDeletingImage] = useState<GalleryImageRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // --- Reorder ---
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      setReorderError(null);

      const oldIndex = images.findIndex((img) => img.id === active.id);
      const newIndex = images.findIndex((img) => img.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      // Optimistic update
      const previousImages = [...images];
      const reordered = arrayMove(images, oldIndex, newIndex);
      setImages(reordered);

      // Disable further drag interactions
      setIsReordering(true);

      const orderedIds = reordered.map((img) => img.id);

      try {
        const result = await reorderGalleryImages(orderedIds);
        if ("error" in result) {
          // Revert on failure
          setImages(previousImages);
          setReorderError(result.error);
        } else {
          router.refresh();
        }
      } catch {
        // Revert on unexpected failure
        setImages(previousImages);
        setReorderError("Failed to save new order. Please try again.");
      } finally {
        setIsReordering(false);
      }
    },
    [images, router]
  );

  // --- Edit ---
  const handleOpenEdit = useCallback(
    (id: string) => {
      const image = images.find((img) => img.id === id);
      if (!image) return;
      setEditingImage(image);
      setEditAlt(image.alt);
      setEditIsActive(image.isActive);
      setEditError(null);
    },
    [images]
  );

  const handleSaveEdit = useCallback(async () => {
    if (!editingImage) return;

    const trimmed = editAlt.trim();
    if (trimmed.length < 10 || trimmed.length > 150) {
      setEditError("Alt text must be between 10 and 150 characters.");
      return;
    }

    setIsSaving(true);
    setEditError(null);

    try {
      const result = await updateGalleryImage(editingImage.id, {
        alt: trimmed,
        isActive: editIsActive,
      });

      if ("error" in result) {
        setEditError(result.error);
      } else {
        // Update local state
        setImages((prev) =>
          prev.map((img) =>
            img.id === editingImage.id
              ? { ...img, alt: trimmed, isActive: editIsActive }
              : img
          )
        );
        setEditingImage(null);
        router.refresh();
      }
    } catch {
      setEditError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [editingImage, editAlt, editIsActive, router]);

  const handleCloseEdit = useCallback(() => {
    setEditingImage(null);
    setEditError(null);
  }, []);

  // --- Delete ---
  const handleOpenDelete = useCallback(
    (id: string) => {
      const image = images.find((img) => img.id === id);
      if (!image) return;
      setDeletingImage(image);
      setDeleteError(null);
    },
    [images]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingImage) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const result = await deleteGalleryImage(deletingImage.id);

      if ("error" in result) {
        setDeleteError(result.error);
      } else {
        // Remove from local state
        setImages((prev) => prev.filter((img) => img.id !== deletingImage.id));
        setDeletingImage(null);
        router.refresh();
      }
    } catch {
      setDeleteError("An unexpected error occurred. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }, [deletingImage, router]);

  const handleCloseDelete = useCallback(() => {
    setDeletingImage(null);
    setDeleteError(null);
  }, []);

  // --- Render ---
  if (images.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-8 text-center">
        <p className="text-muted text-sm">
          No gallery images yet. Upload some images above to get started.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-border bg-surface p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Gallery Images ({images.length})
          </h2>
          {isReordering && (
            <span className="text-xs text-muted animate-pulse">
              Saving order…
            </span>
          )}
        </div>

        {reorderError && (
          <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {reorderError}
          </div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={images.map((img) => img.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {images.map((image) => (
                <SortableImageCard
                  key={image.id}
                  image={image}
                  onEdit={handleOpenEdit}
                  onDelete={handleOpenDelete}
                  disabled={isReordering}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Edit Modal */}
      {editingImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={handleCloseEdit}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-modal-title"
        >
          <div
            className="bg-surface rounded-xl shadow-xl p-6 w-full max-w-md mx-4 border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="edit-modal-title"
              className="text-lg font-semibold text-foreground mb-4"
            >
              Edit Image
            </h3>

            {/* Preview */}
            <div className="mb-4 aspect-video rounded overflow-hidden bg-surface-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={editingImage.blobUrl}
                alt={editingImage.alt}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Alt text input */}
            <div className="mb-4">
              <label
                htmlFor="edit-alt"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Alt Text
              </label>
              <input
                id="edit-alt"
                type="text"
                value={editAlt}
                onChange={(e) => setEditAlt(e.target.value)}
                className="w-full rounded-md border border-border px-3 py-2 text-sm text-foreground bg-surface focus:outline-none focus:border-theme-accent transition-colors"
                placeholder="Descriptive alt text (10-150 characters)"
                maxLength={150}
              />
              <p className="mt-1 text-xs text-muted">
                {editAlt.trim().length}/150 characters (minimum 10)
              </p>
            </div>

            {/* Active toggle */}
            <div className="mb-4 flex items-center gap-3">
              <label
                htmlFor="edit-active"
                className="text-sm font-medium text-foreground"
              >
                Active
              </label>
              <input
                id="edit-active"
                type="checkbox"
                checked={editIsActive}
                onChange={(e) => setEditIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-border text-theme-accent focus:ring-theme-accent"
              />
              <span className="text-xs text-muted">
                {editIsActive
                  ? "Visible on homepage"
                  : "Hidden from homepage"}
              </span>
            </div>

            {/* Error message */}
            {editError && (
              <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {editError}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCloseEdit}
                disabled={isSaving}
                className="px-4 py-2 text-sm rounded-md border border-border text-foreground hover:bg-surface-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium rounded-md bg-theme-accent text-theme-bg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={handleCloseDelete}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          <div
            className="bg-surface rounded-xl shadow-xl p-6 w-full max-w-sm mx-4 border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="delete-modal-title"
              className="text-lg font-semibold text-foreground mb-2"
            >
              Delete Image
            </h3>
            <p className="text-sm text-muted mb-4">
              Are you sure you want to permanently delete this image?
            </p>

            {/* Image preview */}
            <div className="mb-4 flex items-center gap-3 p-3 rounded-md bg-surface-muted border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={deletingImage.blobUrl}
                alt={deletingImage.alt}
                className="w-12 h-12 rounded object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">
                  {deletingImage.alt}
                </p>
                <p className="text-xs text-muted">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Error message */}
            {deleteError && (
              <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {deleteError}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCloseDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm rounded-md border border-border text-foreground hover:bg-surface-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
