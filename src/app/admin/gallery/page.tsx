import Image from 'next/image';
import { GALLERY_IMAGES } from '@/lib/constants/brand';
import { GalleryUploadClient } from './GalleryUploadClient';

/**
 * Admin Gallery page — shows current homepage gallery images
 * and allows uploading new ones to Vercel Blob.
 */
export default function AdminGalleryPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gallery Management</h1>
        <p className="text-sm text-muted mt-1">
          Manage the homepage gallery images. Images are stored in{' '}
          <code className="text-xs bg-surface-muted px-1.5 py-0.5 rounded">public/images/gallery/</code>.
          Upload new images to Vercel Blob and update the brand constants to use them.
        </p>
      </div>

      {/* Current gallery */}
      <div className="rounded-lg border border-border bg-surface p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          Current Gallery ({GALLERY_IMAGES.length} images)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {GALLERY_IMAGES.map((image, i) => (
            <div key={image.src} className="space-y-1">
              <div className="relative aspect-square rounded-lg overflow-hidden border border-border bg-surface-muted">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(max-width: 640px) 50vw, 33vw"
                  className="object-cover"
                />
                <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {i + 1}
                </div>
              </div>
              <p className="text-xs text-muted truncate" title={image.src}>
                {image.src.split('/').pop()}
              </p>
              <p className="text-xs text-muted/70 line-clamp-2">{image.alt}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Upload new images */}
      <GalleryUploadClient />

      {/* Instructions */}
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-5 space-y-2">
        <h2 className="text-sm font-semibold text-amber-600">How to update gallery images</h2>
        <ol className="text-sm text-muted space-y-1 list-decimal list-inside">
          <li>Upload your new image above (stored to Vercel Blob)</li>
          <li>Copy the blob URL from the upload result</li>
          <li>
            Open{' '}
            <code className="text-xs bg-surface-muted px-1 rounded">src/lib/constants/brand.ts</code>
          </li>
          <li>Replace the <code className="text-xs bg-surface-muted px-1 rounded">src</code> value in <code className="text-xs bg-surface-muted px-1 rounded">GALLERY_IMAGES</code> with the blob URL</li>
          <li>Deploy — the homepage gallery will update automatically</li>
        </ol>
      </div>
    </div>
  );
}
