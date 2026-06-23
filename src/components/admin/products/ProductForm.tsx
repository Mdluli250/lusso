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
  images?: { id: string; url: string }[];
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

const WAX_TYPE_OPTIONS = ["soy", "beeswax", "coconut", "paraffin", "soy-beeswax blend"];
const SCENT_PROFILE_OPTIONS = [
  "lavender", "cinnamon", "vanilla", "eucalyptus",
  "citrus", "floral", "woody", "fresh", "spicy",
  "rose", "sandalwood", "bergamot", "jasmine", "cedarwood",
];

export function ProductForm({ mode, initialData }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(initialData?.name ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [price, setPrice] = useState(initialData ? String(initialData.price / 100) : "");
  const [burnTimeHours, setBurnTimeHours] = useState(initialData ? String(initialData.burnTimeHours) : "");
  const [waxType, setWaxType] = useState(initialData?.waxType ?? "");
  const [scentProfile, setScentProfile] = useState(initialData?.scentProfile ?? "");
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [variants, setVariants] = useState<VariantData[]>(
    initialData?.variants.map((v) => ({ ...v })) ?? []
  );
  const [imagePath, setImagePath] = useState<string | null>(initialData?.image ?? null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(initialData?.image ?? null);
  const imagePreviewRef = useRef<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImageData[]>(
    initialData?.images?.map((img) => ({ id: img.id, url: img.url })) ?? []
  );
  const galleryPreviewRefs = useRef<string[]>([]);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const deleteTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout> | null>>({});
  const { showToast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");

  function handleNameChange(value: string) {
    setName(value);
    if (!slugManuallyEdited) setSlug(slugify(value));
  }

  function addVariant() {
    setVariants((prev) => [...prev, { scent: "", waxType: "soy", colorHex: "#d4a574", modelPath: "", stock: 0 }]);
  }

  function updateVariant(index: number, field: keyof VariantData, value: string | number) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  }

  function removeVariant(index: number) {
    setVariants((prev) => {
      const variant = prev[index];
      if (variant.id) return prev.map((v, i) => (i === index ? { ...v, _delete: true } : v));
      return prev.filter((_, i) => i !== index);
    });
  }

  function handleImageChange(file: File | null) {
    if (imagePreviewRef.current) { URL.revokeObjectURL(imagePreviewRef.current); imagePreviewRef.current = null; }
    if (!file) { setImageFile(null); setImagePreviewUrl(initialData?.image ?? null); return; }
    const url = URL.createObjectURL(file);
    imagePreviewRef.current = url;
    setImageFile(file);
    setImagePreviewUrl(url);
  }

  async function uploadProductImage(file: File): Promise<{ imagePath: string } | { error: string }> {
    const maxAttempts = 3;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const body = new FormData();
        body.append("image", file);
        const res = await fetch("/api/admin/products/upload-image", { method: "POST", body });
        if (res.ok) return await res.json();
        const errJson = await res.json().catch(() => null);
        const msg = (errJson?.error as string) ?? `Upload failed (${res.status})`;
        if (attempt >= maxAttempts - 1) return { error: msg };
        await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (attempt >= maxAttempts - 1) return { error: msg };
        await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
      }
    }
    return { error: "Failed to upload image" };
  }

  function handleGalleryImagesChange(files: FileList | null) {
    if (!files?.length) return;
    const filesArray = Array.from(files);
    setGalleryImages((prev) => {
      const placeholders = filesArray.map((file) => {
        const url = URL.createObjectURL(file);
        galleryPreviewRefs.current.push(url);
        return { url, file, isUploading: true } as GalleryImageData;
      });
      return [...prev, ...placeholders];
    });
    filesArray.forEach(async (file) => {
      const result = await uploadProductImage(file);
      if ("imagePath" in result) {
        setGalleryImages((prev) => {
          const next = [...prev];
          const idx = next.findIndex((p) => p.file === file && p.isUploading);
          if (idx >= 0) {
            const existing = next[idx];
            if (existing.file && galleryPreviewRefs.current.includes(existing.url)) {
              URL.revokeObjectURL(existing.url);
              galleryPreviewRefs.current = galleryPreviewRefs.current.filter((u) => u !== existing.url);
            }
            next[idx] = { id: existing.id, url: result.imagePath } as GalleryImageData;
          }
          return next;
        });
      } else {
        const errorMsg = (result as { error: string }).error ?? "Upload failed";
        setGalleryImages((prev) => {
          const next = [...prev];
          const idx = next.findIndex((p) => p.file === file && p.isUploading);
          if (idx >= 0) next[idx] = { ...next[idx], isUploading: false, error: errorMsg } as GalleryImageData;
          return next;
        });
        try { showToast(`Upload failed: ${file.name}`, "error"); } catch { /* ignore */ }
      }
    });
  }

  function removeGalleryImage(index: number) {
    setGalleryImages((prev) => {
      const next = [...prev];
      const active = next.map((img, i) => (img._delete ? -1 : i)).filter((i) => i >= 0);
      const actualIdx = active[index];
      if (actualIdx === undefined) return prev;
      const target = next[actualIdx];
      const key = target.id ?? target.url;
      next[actualIdx] = { ...target, _delete: true } as GalleryImageData;
      const t = setTimeout(() => {
        setGalleryImages((cur) => {
          const c = [...cur];
          const i = c.findIndex((it) => (it.id ?? it.url) === key);
          if (i === -1) return cur;
          const item = c[i];
          if (item.file && galleryPreviewRefs.current.includes(item.url)) {
            URL.revokeObjectURL(item.url);
            galleryPreviewRefs.current = galleryPreviewRefs.current.filter((u) => u !== item.url);
          }
          if (item.id) { c[i] = { ...item, file: undefined } as GalleryImageData; return c; }
          c.splice(i, 1);
          return c;
        });
        delete deleteTimeoutsRef.current[key];
      }, 8000);
      deleteTimeoutsRef.current[key] = t;
      try {
        showToast("Image removed", { type: "info", action: { label: "Undo", onClick: () => {
          const existing = deleteTimeoutsRef.current[key];
          if (existing) { clearTimeout(existing); delete deleteTimeoutsRef.current[key]; }
          setGalleryImages((cur) => cur.map((it) => (it.id ?? it.url) === key ? { ...it, _delete: false } : it));
        }}});
      } catch { /* ignore */ }
      return next;
    });
  }

  async function retryUpload(index: number) {
    const active = galleryImages.map((img, i) => (img._delete ? -1 : i)).filter((i) => i >= 0);
    const idx = active[index] ?? index;
    const image = galleryImages[idx];
    if (!image?.file) { showToast("Cannot retry: file not available", "error"); return; }
    setGalleryImages((prev) => { const n = [...prev]; n[idx] = { ...n[idx], isUploading: true, error: undefined } as GalleryImageData; return n; });
    const result = await uploadProductImage(image.file);
    if ("imagePath" in result) {
      setGalleryImages((prev) => { const n = [...prev]; n[idx] = { id: n[idx].id, url: result.imagePath } as GalleryImageData; return n; });
      showToast("Upload succeeded", "success");
    } else {
      const err = (result as { error: string }).error ?? "Upload failed";
      setGalleryImages((prev) => { const n = [...prev]; n[idx] = { ...n[idx], isUploading: false, error: err } as GalleryImageData; return n; });
      showToast(`Retry failed: ${err}`, "error");
    }
  }

  function moveGalleryImage(index: number, direction: "left" | "right") {
    setGalleryImages((prev) => {
      const active = prev.map((img, i) => (img._delete ? -1 : i)).filter((i) => i >= 0);
      const cur = active[index];
      const target = direction === "left" ? active[index - 1] : active[index + 1];
      if (cur === undefined || target === undefined) return prev;
      const next = [...prev];
      [next[cur], next[target]] = [next[target], next[cur]];
      return next;
    });
  }

  function reorderByVisibleIndex(src: number, dst: number) {
    setGalleryImages((prev) => {
      const active = prev.map((img, i) => (img._delete ? -1 : i)).filter((i) => i >= 0);
      const srcIdx = active[src]; const dstIdx = active[dst];
      if (srcIdx === undefined || dstIdx === undefined) return prev;
      const next = [...prev];
      const [moved] = next.splice(srcIdx, 1);
      next.splice(dstIdx, 0, moved);
      return next;
    });
  }

  const visibleGalleryImages = galleryImages.filter((img) => !img._delete);
  const visibleVariants = variants.filter((v) => !v._delete);

  useEffect(() => {
    return () => {
      if (imagePreviewRef.current) URL.revokeObjectURL(imagePreviewRef.current);
      galleryPreviewRefs.current.forEach((url) => { try { URL.revokeObjectURL(url); } catch { /**/ } });
      Object.values(deleteTimeoutsRef.current).forEach((t) => { if (t) clearTimeout(t); });
      deleteTimeoutsRef.current = {};
    };
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");
    const priceInCents = Math.round(parseFloat(price || "0") * 100);
    const burnTime = parseInt(burnTimeHours || "0", 10);
    const validationErrors = validateProductForm({ name, slug, description, price: priceInCents, burnTimeHours: burnTime, waxType, scentProfile });
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    setErrors({});

    const formData = {
      name, slug, description, price: priceInCents, burnTimeHours: burnTime,
      waxType, scentProfile, image: imagePath, isActive,
      galleryImages: galleryImages.map((img) => ({ ...(img.id ? { id: img.id } : {}), url: img.url, ...(img._delete ? { _delete: true } : {}) })),
      variants: variants.map((v) => ({ ...(v.id ? { id: v.id } : {}), scent: v.scent, waxType: v.waxType, colorHex: v.colorHex, modelPath: v.modelPath, stock: v.stock, ...(v._delete ? { _delete: true } : {}) })),
    };

    startTransition(async () => {
      if (galleryImages.some((img) => img.isUploading && !img._delete)) {
        setSubmitError("Please wait for all images to finish uploading.");
        return;
      }
      if (imageFile) {
        const result = await uploadProductImage(imageFile);
        if ("error" in result) { setSubmitError(result.error); return; }
        setImagePath(result.imagePath);
        formData.image = result.imagePath;
      }
      // Retry any failed gallery uploads
      const failed = galleryImages.filter((img) => img.file && !img._delete && img.error);
      if (failed.length > 0) {
        const updated: GalleryImageData[] = [];
        for (const img of galleryImages) {
          if (img.file && !img._delete && img.error) {
            const result = await uploadProductImage(img.file);
            if ("error" in result) { setSubmitError(`Image upload failed: ${result.error}`); return; }
            updated.push({ id: img.id, url: result.imagePath });
          } else {
            updated.push({ id: img.id, url: img.url, _delete: img._delete });
          }
        }
        formData.galleryImages = updated.map((img) => ({ ...(img.id ? { id: img.id } : {}), url: img.url, ...(img._delete ? { _delete: true } : {}) }));
      }

      const result = mode === "create" ? await createProduct(formData) : await updateProduct(initialData!.id, formData);
      if ("error" in result) { setSubmitError(result.error); return; }
      if (imagePreviewRef.current) { URL.revokeObjectURL(imagePreviewRef.current); imagePreviewRef.current = null; }
      galleryPreviewRefs.current.forEach((url) => { try { URL.revokeObjectURL(url); } catch { /**/ } });
      galleryPreviewRefs.current = [];
      Object.values(deleteTimeoutsRef.current).forEach((t) => { if (t) clearTimeout(t); });
      deleteTimeoutsRef.current = {};
      router.push("/admin/products");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">

      {/* ── Section: Basic Info ─────────────────────────────────── */}
      <div className="rounded-lg border border-border bg-surface p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Basic Information</h2>

        <div className="space-y-1">
          <label htmlFor="name" className="block text-sm font-medium text-foreground">Name</label>
          <input id="name" type="text" value={name} onChange={(e) => handleNameChange(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors" />
          {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
        </div>

        <div className="space-y-1">
          <label htmlFor="slug" className="block text-sm font-medium text-foreground">Slug</label>
          <input id="slug" type="text" value={slug} onChange={(e) => { setSlug(e.target.value); setSlugManuallyEdited(true); }}
            className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors" />
          {errors.slug && <p className="text-xs text-red-400">{errors.slug}</p>}
        </div>

        <div className="space-y-1">
          <label htmlFor="description" className="block text-sm font-medium text-foreground">Description</label>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
            className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors resize-y" />
          {errors.description && <p className="text-xs text-red-400">{errors.description}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="price" className="block text-sm font-medium text-foreground">Price (Rands)</label>
            <input id="price" type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors" />
            {errors.price && <p className="text-xs text-red-400">{errors.price}</p>}
          </div>
          <div className="space-y-1">
            <label htmlFor="burnTime" className="block text-sm font-medium text-foreground">Burn Time (hours)</label>
            <input id="burnTime" type="number" min="0" value={burnTimeHours} onChange={(e) => setBurnTimeHours(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors" />
            {errors.burnTimeHours && <p className="text-xs text-red-400">{errors.burnTimeHours}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="waxType" className="block text-sm font-medium text-foreground">Wax Type</label>
            <select id="waxType" value={waxType} onChange={(e) => setWaxType(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors">
              <option value="">Select wax type…</option>
              {WAX_TYPE_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>)}
            </select>
            {errors.waxType && <p className="text-xs text-red-400">{errors.waxType}</p>}
          </div>
          <div className="space-y-1">
            <label htmlFor="scentProfile" className="block text-sm font-medium text-foreground">Scent Profile</label>
            <select id="scentProfile" value={scentProfile} onChange={(e) => setScentProfile(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors">
              <option value="">Select scent…</option>
              {SCENT_PROFILE_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>)}
            </select>
            {errors.scentProfile && <p className="text-xs text-red-400">{errors.scentProfile}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="isActive" className="text-sm font-medium text-foreground">Active</label>
          <button id="isActive" type="button" role="switch" aria-checked={isActive} onClick={() => setIsActive(!isActive)}
            className={["relative inline-flex h-6 w-11 items-center rounded-full transition-colors", isActive ? "bg-theme-accent" : "bg-border"].join(" ")}>
            <span className={["inline-block h-4 w-4 transform rounded-full bg-white transition-transform", isActive ? "translate-x-6" : "translate-x-1"].join(" ")} />
          </button>
        </div>
      </div>

      {/* ── Section: Images ────────────────────────────────────── */}
      <div className="rounded-lg border border-border bg-surface p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Images</h2>
        <p className="text-xs text-muted">Images are stored on Vercel Blob. Make sure BLOB_READ_WRITE_TOKEN is set in your environment.</p>

        <div className="space-y-2">
          <label htmlFor="heroImage" className="block text-sm font-medium text-foreground">Hero Image</label>
          <input id="heroImage" type="file" accept="image/*" onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}
            className="w-full text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors" />
          {imagePreviewUrl && (
            <div className="mt-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreviewUrl} alt="Hero preview" className="h-40 rounded-md object-cover border border-border" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="galleryImages" className="block text-sm font-medium text-foreground">Gallery Images</label>
          <p className="text-xs text-muted">Uploads immediately. Drag to reorder. Click Remove to delete (undo available for 8s).</p>
          <input id="galleryImages" type="file" accept="image/*" multiple onChange={(e) => handleGalleryImagesChange(e.target.files)}
            className="w-full text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors" />

          {visibleGalleryImages.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
              {visibleGalleryImages.map((image, vi) => (
                <div key={image.id ?? image.url} className="relative">
                  {dragOverIndex === vi && draggingIndex !== vi && (
                    <div className="absolute inset-0 rounded-lg border-2 border-dashed border-theme-accent/50 bg-theme-accent/5 z-10" />
                  )}
                  <div
                    draggable={!image.isUploading}
                    onDragStart={(e) => { if (image.isUploading) return; e.dataTransfer.setData("text/plain", String(vi)); e.dataTransfer.effectAllowed = "move"; setDraggingIndex(vi); }}
                    onDragOver={(e) => { e.preventDefault(); setDragOverIndex(vi); }}
                    onDragLeave={() => setDragOverIndex(null)}
                    onDrop={(e) => { e.preventDefault(); const src = parseInt(e.dataTransfer.getData("text/plain"), 10); if (!Number.isNaN(src)) reorderByVisibleIndex(src, vi); setDraggingIndex(null); setDragOverIndex(null); }}
                    onDragEnd={() => setDraggingIndex(null)}
                    className={["relative overflow-hidden rounded-lg border border-border bg-surface aspect-square", draggingIndex === vi ? "opacity-60" : ""].join(" ")}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image.url} alt={`Gallery ${vi + 1}`} className="w-full h-full object-cover" />
                    {image.isUploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <svg className="h-6 w-6 animate-spin text-white" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                      </div>
                    )}
                    {image.error && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 gap-1 p-2">
                        <p className="text-xs text-white text-center">Failed</p>
                        <button type="button" onClick={() => retryUpload(vi)} className="px-2 py-1 text-xs bg-white text-foreground rounded">Retry</button>
                      </div>
                    )}
                    {!image.isUploading && !image.error && (
                      <button type="button" onClick={() => removeGalleryImage(vi)}
                        className="absolute top-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded-full hover:bg-black/80">✕</button>
                    )}
                    <div className="absolute bottom-1 inset-x-1 flex justify-between">
                      <button type="button" onClick={() => moveGalleryImage(vi, "left")} disabled={vi === 0 || !!image.isUploading}
                        className="bg-black/50 text-white text-xs px-1.5 py-0.5 rounded disabled:opacity-30">←</button>
                      <button type="button" onClick={() => moveGalleryImage(vi, "right")} disabled={vi === visibleGalleryImages.length - 1 || !!image.isUploading}
                        className="bg-black/50 text-white text-xs px-1.5 py-0.5 rounded disabled:opacity-30">→</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Section: Variants ──────────────────────────────────── */}
      <div className="rounded-lg border border-border bg-surface p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Variants ({visibleVariants.length})
          </h2>
          <button type="button" onClick={addVariant}
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-border text-foreground hover:bg-surface-muted transition-colors">
            + Add Variant
          </button>
        </div>

        {visibleVariants.length === 0 && (
          <p className="text-sm text-muted">No variants yet. Add at least one variant with stock to sell this product.</p>
        )}

        {variants.map((variant, index) => {
          if (variant._delete) return null;
          const vNum = visibleVariants.indexOf(variant) + 1;
          return (
            <div key={variant.id ?? `new-${index}`} className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted">Variant {vNum}</span>
                <button type="button" onClick={() => removeVariant(index)}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors">
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs text-muted">Scent</label>
                  <input type="text" value={variant.scent} onChange={(e) => updateVariant(index, "scent", e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors" />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs text-muted">Wax Type</label>
                  <select value={variant.waxType} onChange={(e) => updateVariant(index, "waxType", e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors">
                    {WAX_TYPE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs text-muted">Colour</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={variant.colorHex} onChange={(e) => updateVariant(index, "colorHex", e.target.value)}
                      className="h-9 w-14 rounded-md border border-border bg-surface cursor-pointer" />
                    <span className="text-xs text-muted font-mono">{variant.colorHex}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs text-muted">Stock</label>
                  <input type="number" min="0" value={variant.stock}
                    onChange={(e) => updateVariant(index, "stock", parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-1.5 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors" />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs text-muted">3D Model Path (optional)</label>
                  <input type="text" value={variant.modelPath} onChange={(e) => updateVariant(index, "modelPath", e.target.value)}
                    placeholder="/models/candle.glb"
                    className="w-full px-3 py-1.5 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Submit ─────────────────────────────────────────────── */}
      {submitError && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-400">{submitError}</p>
        </div>
      )}

      <div className="flex items-center gap-3 pb-8">
        <button type="submit" disabled={isPending}
          className="px-6 py-2.5 text-sm font-medium rounded-md bg-theme-accent text-theme-bg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
          {isPending
            ? (mode === "create" ? "Creating…" : "Saving…")
            : (mode === "create" ? "Create Product" : "Save Changes")}
        </button>
        <button type="button" onClick={() => router.push("/admin/products")}
          className="px-6 py-2.5 text-sm rounded-md border border-border text-foreground hover:bg-surface-muted transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}
