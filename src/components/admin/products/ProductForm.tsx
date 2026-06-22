"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/admin/slugify";
import { validateProductForm } from "@/lib/admin/validateProduct";
import { createProduct, updateProduct } from "@/actions/admin/products";

interface VariantData {
  id?: string;
  scent: string;
  waxType: string;
  colorHex: string;
  modelPath: string;
  stock: number;
  _delete?: boolean;
}

interface GalleryImageData {
  id?: string;
  url: string;
  file?: File;
  isUploading?: boolean;
  error?: string;
  _delete?: boolean;
}

interface ProductData {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  burnTimeHours: number;
  waxType: string;
  scentProfile: string;
  image?: string | null;
  images?: {
    id: string;
    url: string;
  }[];
  isActive: boolean;
  variants: {
    id: string;
    scent: string;
    waxType: string;
    colorHex: string;
    modelPath: string;
    stock: number;
  }[];
}

interface ProductFormProps {
  mode: "create" | "edit";
  initialData?: ProductData;
}

const WAX_TYPE_OPTIONS = ["soy", "beeswax", "coconut"];
const SCENT_PROFILE_OPTIONS = ["lavender", "cinnamon", "vanilla", "eucalyptus"];

/**
 * ProductForm — Client Component for creating and editing products.
 * Includes inline variant management, client-side validation,
 * and loading state on submit.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 10.6
 */
export function ProductForm({ mode, initialData }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form state
  const [name, setName] = useState(initialData?.name ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [description, setDescription] = useState(
    initialData?.description ?? "",
  );
  const [price, setPrice] = useState(
    initialData ? String(initialData.price / 100) : "",
  );
  const [burnTimeHours, setBurnTimeHours] = useState(
    initialData ? String(initialData.burnTimeHours) : "",
  );
  const [waxType, setWaxType] = useState(initialData?.waxType ?? "");
  const [scentProfile, setScentProfile] = useState(
    initialData?.scentProfile ?? "",
  );
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

  // Variants state
  const [variants, setVariants] = useState<VariantData[]>(
    initialData?.variants.map((v) => ({ ...v })) ?? [],
  );
  const [imagePath, setImagePath] = useState<string | null>(
    initialData?.image ?? null,
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(
    initialData?.image ?? null,
  );
  const imagePreviewRef = useRef<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImageData[]>(
    initialData?.images?.map((image) => ({ id: image.id, url: image.url })) ??
      [],
  );
  const galleryPreviewRefs = useRef<string[]>([]);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const { showToast } = useToast();

  // Error state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");

  function handleNameChange(value: string) {
    setName(value);
    if (!slugManuallyEdited) {
      setSlug(slugify(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlug(value);
    setSlugManuallyEdited(true);
  }

  function addVariant() {
    setVariants([
      ...variants,
      {
        scent: "",
        waxType: "soy",
        colorHex: "#d4a574",
        modelPath: "",
        stock: 0,
      },
    ]);
  }

  function updateVariant(
    index: number,
    field: keyof VariantData,
    value: string | number,
  ) {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    );
  }

  function removeVariant(index: number) {
    setVariants((prev) => {
      const variant = prev[index];
      if (variant.id) {
        // Mark existing variant for deletion
        return prev.map((v, i) => (i === index ? { ...v, _delete: true } : v));
      }
      // Remove new variant entirely
      return prev.filter((_, i) => i !== index);
    });
  }

  function handleImageChange(file: File | null) {
    if (imagePreviewRef.current) {
      URL.revokeObjectURL(imagePreviewRef.current);
      imagePreviewRef.current = null;
    }

    if (!file) {
      setImageFile(null);
      setImagePreviewUrl(initialData?.image ?? null);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    imagePreviewRef.current = previewUrl;
    setImageFile(file);
    setImagePreviewUrl(previewUrl);
  }

  function handleGalleryImagesChange(files: FileList | null) {
    if (!files?.length) return;

    const filesArray = Array.from(files);

    // Add preview placeholders with uploading state
    const placeholderImages = filesArray.map((file) => {
      const url = URL.createObjectURL(file);
      galleryPreviewRefs.current.push(url);
      return { url, file, isUploading: true } as GalleryImageData;
    });

    setGalleryImages((prev) => [...prev, ...placeholderImages]);

    // Upload each file and replace the placeholder when done
    filesArray.forEach(async (file, idx) => {
      const placeholderIndex = galleryImages.length + idx;
      const uploadResult = await uploadProductImage(file);
      if (uploadResult && "imagePath" in uploadResult) {
        setGalleryImages((prev) => {
          const next = [...prev];
          // Find the first placeholder matching the file object URL
          const pIdx = next.findIndex((p) => p.file === file && p.isUploading);
          const targetIdx = pIdx >= 0 ? pIdx : placeholderIndex;
          const existing = next[targetIdx];
          if (existing) {
            // Revoke local preview URL if present
            if (
              existing.file &&
              galleryPreviewRefs.current.includes(existing.url)
            ) {
              URL.revokeObjectURL(existing.url);
              galleryPreviewRefs.current = galleryPreviewRefs.current.filter(
                (u) => u !== existing.url,
              );
            }
            next[targetIdx] = {
              id: existing.id,
              url: uploadResult.imagePath,
            } as GalleryImageData;
          }
          return next;
        });
      } else {
        const errorMsg = (uploadResult as any)?.error ?? "Upload failed";
        setGalleryImages((prev) => {
          const next = [...prev];
          const pIdx = next.findIndex((p) => p.file === file && p.isUploading);
          if (pIdx >= 0) {
            next[pIdx] = {
              ...next[pIdx],
              isUploading: false,
              error: errorMsg,
            } as GalleryImageData;
          }
          return next;
        });
        try {
          showToast(`Image upload failed: ${file.name}`, "error");
        } catch (e) {
          // ignore if toast cannot be shown
        }
      }
    });
  }

  function removeGalleryImage(index: number) {
    // Mark image as deleted so user can undo; do not revoke preview immediately
    setGalleryImages((prev) => {
      const next = [...prev];
      const target = next[index];
      if (!target) return prev;
      // stable key to identify for undo
      const key = target.id ?? target.url;
      next[index] = { ...target, _delete: true } as GalleryImageData;

      // Show toast with undo action
      try {
        showToast("Image removed", {
          type: "info",
          action: {
            label: "Undo",
            onClick: () => {
              setGalleryImages((cur) =>
                cur.map((it) =>
                  (it.id ?? it.url) === key ? { ...it, _delete: false } : it,
                ),
              );
            },
          },
        });
      } catch (e) {
        // ignore toast failures
      }

      return next;
    });
  }

  async function retryUpload(index: number) {
    const image = galleryImages[index];
    if (!image) return;
    if (!image.file) {
      showToast("Cannot retry: original file not available", "error");
      return;
    }

    // mark uploading
    setGalleryImages((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        isUploading: true,
        error: undefined,
      } as GalleryImageData;
      return next;
    });

    const result = await uploadProductImage(image.file);
    if ("imagePath" in result) {
      setGalleryImages((prev) => {
        const next = [...prev];
        next[index] = {
          id: next[index].id,
          url: result.imagePath,
        } as GalleryImageData;
        return next;
      });
      showToast("Upload succeeded", "success");
    } else {
      const err = (result as any).error ?? "Upload failed";
      setGalleryImages((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          isUploading: false,
          error: err,
        } as GalleryImageData;
        return next;
      });
      showToast(`Retry failed: ${err}`, "error");
    }
  }

  function moveGalleryImage(index: number, direction: "left" | "right") {
    setGalleryImages((prev) => {
      const activeIndexes = prev
        .map((image, idx) => (image._delete ? -1 : idx))
        .filter((idx) => idx >= 0);
      const currentIndex = activeIndexes[index];
      if (currentIndex === undefined) return prev;

      const targetIndex =
        direction === "left"
          ? activeIndexes[index - 1]
          : activeIndexes[index + 1];
      if (targetIndex === undefined) return prev;

      const next = [...prev];
      [next[currentIndex], next[targetIndex]] = [
        next[targetIndex],
        next[currentIndex],
      ];
      return next;
    });
  }

  function reorderGalleryImagesByVisibleIndexes(
    sourceVisibleIndex: number,
    targetVisibleIndex: number,
  ) {
    setGalleryImages((prev) => {
      const activeIndexes = prev
        .map((image, idx) => (image._delete ? -1 : idx))
        .filter((idx) => idx >= 0);

      const sourceIdx = activeIndexes[sourceVisibleIndex];
      const targetIdx = activeIndexes[targetVisibleIndex];
      if (sourceIdx === undefined || targetIdx === undefined) return prev;

      const next = [...prev];
      const [moved] = next.splice(sourceIdx, 1);
      next.splice(targetIdx, 0, moved);
      return next;
    });
  }

  const visibleGalleryImages = galleryImages.filter((image) => !image._delete);

  useEffect(() => {
    return () => {
      if (imagePreviewRef.current) {
        URL.revokeObjectURL(imagePreviewRef.current);
      }
      galleryPreviewRefs.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");

    const priceInCents = Math.round(parseFloat(price || "0") * 100);
    const burnTime = parseInt(burnTimeHours || "0", 10);

    // Validate
    const validationErrors = validateProductForm({
      name,
      slug,
      description,
      price: priceInCents,
      burnTimeHours: burnTime,
      waxType,
      scentProfile,
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    const formData = {
      name,
      slug,
      description,
      price: priceInCents,
      burnTimeHours: burnTime,
      waxType,
      scentProfile,
      image: imagePath,
      galleryImages: galleryImages.map((image) => ({
        ...(image.id ? { id: image.id } : {}),
        url: image.url,
        ...(image._delete ? { _delete: true } : {}),
      })),
      isActive,
      variants: variants.map((v) => ({
        ...(v.id ? { id: v.id } : {}),
        scent: v.scent,
        waxType: v.waxType,
        colorHex: v.colorHex,
        modelPath: v.modelPath,
        stock: v.stock,
        ...(v._delete ? { _delete: true } : {}),
      })),
    };

    startTransition(async () => {
      if (imageFile) {
        const uploadResult = await uploadProductImage(imageFile);
        if ("error" in uploadResult) {
          setSubmitError(uploadResult.error);
          return;
        }
        setImagePath(uploadResult.imagePath);
        formData.image = uploadResult.imagePath;
      }

      if (galleryImages.some((image) => image.file && !image._delete)) {
        const uploadedImages: GalleryImageData[] = [];
        for (const image of galleryImages) {
          if (image.file && !image._delete) {
            const uploadResult = await uploadProductImage(image.file);
            if ("error" in uploadResult) {
              setSubmitError(uploadResult.error);
              return;
            }
            uploadedImages.push({
              id: image.id,
              url: uploadResult.imagePath,
            });
          } else {
            uploadedImages.push({
              id: image.id,
              url: image.url,
              _delete: image._delete,
            });
          }
        }
        formData.galleryImages = uploadedImages.map((image) => ({
          ...(image.id ? { id: image.id } : {}),
          url: image.url,
          ...(image._delete ? { _delete: true } : {}),
        }));
      }

      let result;
      if (mode === "create") {
        result = await createProduct(formData);
      } else {
        result = await updateProduct(initialData!.id, formData);
      }

      if ("error" in result) {
        setSubmitError(result.error);
      } else {
        router.push("/admin/products");
      }
    });
  }

  const visibleVariants = variants.filter((v) => !v._delete);

  async function uploadProductImage(
    file: File,
  ): Promise<{ imagePath: string } | { error: string }> {
    const maxAttempts = 3;
    let attempt = 0;
    while (attempt < maxAttempts) {
      try {
        const body = new FormData();
        body.append("image", file);
        const response = await fetch("/api/admin/products/upload-image", {
          method: "POST",
          body,
        });
        if (response.ok) {
          return await response.json();
        }
        const errorJson = await response.json().catch(() => null);
        const errMsg =
          (errorJson?.error as string) ?? `Upload failed (${response.status})`;
        attempt += 1;
        if (attempt >= maxAttempts) {
          // report to server for logging
          try {
            await fetch("/api/admin/products/upload-error", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ fileName: file.name, error: errMsg }),
            });
          } catch (e) {
            console.error("Failed to report upload error to server:", e);
          }
          return { error: errMsg };
        }
        // backoff before retry
        await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt - 1)));
      } catch (err) {
        attempt += 1;
        const msg = err instanceof Error ? err.message : String(err);
        if (attempt >= maxAttempts) {
          try {
            await fetch("/api/admin/products/upload-error", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ fileName: file.name, error: msg }),
            });
          } catch (e) {
            console.error("Failed to report upload error to server:", e);
          }
          console.error("Image upload failed:", err);
          return { error: msg };
        }
        await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt - 1)));
      }
    }
    return { error: "Failed to upload product image" };
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Product Image */}
      <div className="space-y-2">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="productImage"
            className="block text-sm font-medium text-foreground"
          >
            Product Hero Image
          </label>
          <p id="productImageDescription" className="text-xs text-muted">
            Select or upload the primary product image shown at the top of the
            product page.
          </p>
        </div>
        <input
          id="productImage"
          type="file"
          accept="image/*"
          aria-describedby="productImageDescription"
          onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}
          className="w-full text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors"
        />
        {imagePreviewUrl && (
          <div className="mt-2">
            <p className="text-xs text-muted">Hero image preview</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreviewUrl}
              alt="Product preview"
              className="mt-2 h-40 w-full max-w-md rounded-md object-cover border border-border"
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="galleryImages"
            className="block text-sm font-medium text-foreground"
          >
            Gallery Images
          </label>
          <p id="galleryImagesDescription" className="text-xs text-muted">
            Upload additional product photos for the gallery below the main
            image. You can add multiple images and remove any before saving.
          </p>
        </div>
        <input
          id="galleryImages"
          type="file"
          accept="image/*"
          multiple
          aria-describedby="galleryImagesDescription"
          onChange={(e) => handleGalleryImagesChange(e.target.files)}
          className="w-full text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors"
        />
        {visibleGalleryImages.length > 0 && (
          <div className="space-y-3 mt-2">
            <p className="text-xs text-muted">
              Drag-free reorder the gallery images or remove any before saving.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {visibleGalleryImages.map((image, visibleIndex) => (
                <div key={image.id ?? image.url}>
                  {/* Placeholder slot when dragging over this index */}
                  {dragOverIndex === visibleIndex &&
                    draggingIndex !== visibleIndex && (
                      <div className="h-28 rounded-lg border-2 border-dashed border-theme-accent/50 bg-theme-accent/5" />
                    )}
                  <div
                    draggable={!image.isUploading}
                    onDragStart={(e) => {
                      if (image.isUploading) return;
                      e.dataTransfer.setData(
                        "text/plain",
                        String(visibleIndex),
                      );
                      e.dataTransfer.effectAllowed = "move";
                      setDraggingIndex(visibleIndex);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverIndex(visibleIndex);
                    }}
                    onDragLeave={() => setDragOverIndex(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      const src = e.dataTransfer.getData("text/plain");
                      const srcIndex = parseInt(src, 10);
                      if (!Number.isNaN(srcIndex)) {
                        reorderGalleryImagesByVisibleIndexes(
                          srcIndex,
                          visibleIndex,
                        );
                      }
                      setDraggingIndex(null);
                      setDragOverIndex(null);
                    }}
                    onDragEnd={() => setDraggingIndex(null)}
                    className={[
                      "relative overflow-hidden rounded-lg border border-border bg-surface transition-all",
                      draggingIndex === visibleIndex ? "opacity-70" : "",
                      dragOverIndex === visibleIndex &&
                      draggingIndex !== visibleIndex
                        ? "ring-2 ring-dashed ring-theme-accent/60"
                        : "",
                    ].join(" ")}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.url}
                      alt={`Gallery image ${visibleIndex + 1}`}
                      className="h-28 w-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/50 p-2">
                      <button
                        type="button"
                        onClick={() => moveGalleryImage(visibleIndex, "left")}
                        disabled={visibleIndex === 0 || image.isUploading}
                        className="rounded-full bg-white/10 px-2 py-1 text-[11px] text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        ←
                      </button>
                      <span className="text-[11px] text-white">
                        {visibleIndex + 1} / {visibleGalleryImages.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => moveGalleryImage(visibleIndex, "right")}
                        disabled={
                          visibleIndex === visibleGalleryImages.length - 1 ||
                          image.isUploading
                        }
                        className="rounded-full bg-white/10 px-2 py-1 text-[11px] text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        →
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(visibleIndex)}
                      disabled={!!image.isUploading}
                      className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {image.isUploading ? "Uploading..." : "Remove"}
                    </button>
                    {image.isUploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <svg
                          className="h-8 w-8 animate-spin text-white"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                          />
                        </svg>
                      </div>
                    )}
                    {image.error && (
                      <div className="absolute inset-0 flex items-end justify-center p-2">
                        <div className="rounded bg-red-600/80 px-2 py-1 text-xs text-white">
                          {image.error}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Placeholder at end if dragging past last index */}
              {dragOverIndex === visibleGalleryImages.length && (
                <div className="h-28 rounded-lg border-2 border-dashed border-theme-accent/50 bg-theme-accent/5" />
              )}
            </div>
          </div>
        )}
      </div>
      {/* Name */}
      <div className="space-y-1">
        <label
          htmlFor="name"
          className="block text-sm font-medium text-foreground"
        >
          Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors"
        />
        {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
      </div>

      {/* Slug */}
      <div className="space-y-1">
        <label
          htmlFor="slug"
          className="block text-sm font-medium text-foreground"
        >
          Slug
        </label>
        <input
          id="slug"
          type="text"
          value={slug}
          onChange={(e) => handleSlugChange(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors"
        />
        {errors.slug && <p className="text-xs text-red-400">{errors.slug}</p>}
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label
          htmlFor="description"
          className="block text-sm font-medium text-foreground"
        >
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors resize-y"
        />
        {errors.description && (
          <p className="text-xs text-red-400">{errors.description}</p>
        )}
      </div>

      {/* Price and Burn Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label
            htmlFor="price"
            className="block text-sm font-medium text-foreground"
          >
            Price (Rands)
          </label>
          <input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors"
          />
          {errors.price && (
            <p className="text-xs text-red-400">{errors.price}</p>
          )}
        </div>

        <div className="space-y-1">
          <label
            htmlFor="burnTimeHours"
            className="block text-sm font-medium text-foreground"
          >
            Burn Time (hours)
          </label>
          <input
            id="burnTimeHours"
            type="number"
            step="1"
            min="0"
            value={burnTimeHours}
            onChange={(e) => setBurnTimeHours(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors"
          />
          {errors.burnTimeHours && (
            <p className="text-xs text-red-400">{errors.burnTimeHours}</p>
          )}
        </div>
      </div>

      {/* Wax Type and Scent Profile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label
            htmlFor="waxType"
            className="block text-sm font-medium text-foreground"
          >
            Wax Type
          </label>
          <select
            id="waxType"
            value={waxType}
            onChange={(e) => setWaxType(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors"
          >
            <option value="">Select wax type…</option>
            {WAX_TYPE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </option>
            ))}
          </select>
          {errors.waxType && (
            <p className="text-xs text-red-400">{errors.waxType}</p>
          )}
        </div>

        <div className="space-y-1">
          <label
            htmlFor="scentProfile"
            className="block text-sm font-medium text-foreground"
          >
            Scent Profile
          </label>
          <select
            id="scentProfile"
            value={scentProfile}
            onChange={(e) => setScentProfile(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors"
          >
            <option value="">Select scent…</option>
            {SCENT_PROFILE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </option>
            ))}
          </select>
          {errors.scentProfile && (
            <p className="text-xs text-red-400">{errors.scentProfile}</p>
          )}
        </div>
      </div>

      {/* Is Active Toggle */}
      <div className="flex items-center gap-3">
        <label
          htmlFor="isActive"
          className="text-sm font-medium text-foreground"
        >
          Active
        </label>
        <button
          id="isActive"
          type="button"
          role="switch"
          aria-checked={isActive}
          onClick={() => setIsActive(!isActive)}
          className={[
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
            isActive ? "bg-theme-accent" : "bg-border",
          ].join(" ")}
        >
          <span
            className={[
              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
              isActive ? "translate-x-6" : "translate-x-1",
            ].join(" ")}
          />
        </button>
      </div>

      {/* Variants Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Variants</h2>
          <button
            type="button"
            onClick={addVariant}
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-border text-foreground hover:bg-surface-muted transition-colors"
          >
            Add Variant
          </button>
        </div>

        {visibleVariants.length === 0 && (
          <p className="text-sm text-muted">No variants added yet.</p>
        )}

        {variants.map((variant, index) => {
          if (variant._delete) return null;
          return (
            <div
              key={variant.id ?? `new-${index}`}
              className="rounded-lg border border-border bg-surface p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted">
                  Variant {visibleVariants.indexOf(variant) + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  aria-label={`Remove variant ${visibleVariants.indexOf(variant) + 1}`}
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs text-muted">Scent</label>
                  <input
                    type="text"
                    value={variant.scent}
                    onChange={(e) =>
                      updateVariant(index, "scent", e.target.value)
                    }
                    className="w-full px-3 py-1.5 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs text-muted">Wax Type</label>
                  <select
                    value={variant.waxType}
                    onChange={(e) =>
                      updateVariant(index, "waxType", e.target.value)
                    }
                    className="w-full px-3 py-1.5 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors"
                  >
                    {WAX_TYPE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt.charAt(0).toUpperCase() + opt.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs text-muted">Color</label>
                  <input
                    type="color"
                    value={variant.colorHex}
                    onChange={(e) =>
                      updateVariant(index, "colorHex", e.target.value)
                    }
                    className="w-full h-9 rounded-md border border-border bg-surface cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs text-muted">Model Path</label>
                  <input
                    type="text"
                    value={variant.modelPath}
                    onChange={(e) =>
                      updateVariant(index, "modelPath", e.target.value)
                    }
                    className="w-full px-3 py-1.5 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs text-muted">Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={variant.stock}
                    onChange={(e) =>
                      updateVariant(
                        index,
                        "stock",
                        parseInt(e.target.value, 10) || 0,
                      )
                    }
                    className="w-full px-3 py-1.5 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit Error */}
      {submitError && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-400">{submitError}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2 text-sm font-medium rounded-md bg-theme-accent text-theme-bg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending
            ? mode === "create"
              ? "Creating…"
              : "Saving…"
            : mode === "create"
              ? "Create Product"
              : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="px-6 py-2 text-sm rounded-md border border-border text-foreground hover:bg-surface-muted transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
