import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { put } from "@vercel/blob";
import fs from "fs";
import path from "path";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// Map of product slugs to gallery images
const PRODUCT_IMAGE_MAP: Record<string, string> = {
  "citrus-elan": "candle-closeup-1.png",
  "pear-and-cinnamon": "styled-trio-1.png",
  "poire-lumiere": "candle-closeup-2.png",
  "peony-rose": "overhead-workspace.png",
  "rose-cashmere": "styled-trio-2.png",
  "cinnamon-vanilla": "candle-closeup-1.png",
  "duo-gift-set": "overhead-gift-set.png",
  "discovery-trio": "styled-trio-2.png",
  "signature-scent-collection": "overhead-workspace.png",
};

async function seedBlob() {
  console.log("🖼️  Uploading product images to Vercel Blob Storage...");

  try {
    for (const [slug, imageName] of Object.entries(PRODUCT_IMAGE_MAP)) {
      const imagePath = path.join(
        process.cwd(),
        "public",
        "images",
        "gallery",
        imageName,
      );

      if (!fs.existsSync(imagePath)) {
        console.warn(`⚠️  Image not found: ${imagePath}`);
        continue;
      }

      const fileBuffer = fs.readFileSync(imagePath);
      const fileExtension = path.extname(imageName);
      const blobFileName = `${slug}${fileExtension}`;
      const blobPath = `products/${blobFileName}`;

      // Upload to Vercel Blob
      const blob = await put(blobPath, fileBuffer, {
        access: "public",
        contentType: `image/${fileExtension.substring(1).toLowerCase()}`,
        allowOverwrite: true,
      });

      console.log(`  ✓ Uploaded ${slug} → ${blob.url}`);

      // Update product with blob URL
      await prisma.product.update({
        where: { slug },
        data: { image: blob.url },
      });

      console.log(`  ✓ Updated product: ${slug}`);
    }

    console.log("\n✅ Blob storage seeded successfully!");
  } catch (error) {
    console.error("❌ Blob seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedBlob();
