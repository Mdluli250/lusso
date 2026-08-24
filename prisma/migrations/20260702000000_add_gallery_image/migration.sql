-- CreateTable
CREATE TABLE "GalleryImage" (
    "id" TEXT NOT NULL,
    "blobUrl" VARCHAR(2048) NOT NULL,
    "alt" VARCHAR(150) NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GalleryImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GalleryImage_blobUrl_key" ON "GalleryImage"("blobUrl");

-- CreateIndex
CREATE INDEX "GalleryImage_isActive_sortOrder_idx" ON "GalleryImage"("isActive", "sortOrder");
