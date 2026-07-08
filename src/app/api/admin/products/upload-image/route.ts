import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return { error: "Unauthorized" };
  }
  return {};
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("image");

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "No image file provided" },
      { status: 400 },
    );
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  const ext = file.name.substring(file.name.lastIndexOf('.')) || ".jpg";
  const fileName = `${Date.now()}-${randomUUID()}${ext}`;

  // Try Vercel Blob first, fall back to local filesystem for development
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

  if (blobToken && blobToken !== "your-blob-read-write-token") {
    try {
      const blobPath = `products/${fileName}`;
      const blob = await put(blobPath, file, {
        access: "public",
        contentType: file.type,
      });

      return NextResponse.json({ imagePath: blob.url });
    } catch (error: any) {
      console.error("Vercel Blob upload failed:", error?.message ?? error);
      // Fall through to local filesystem fallback
    }
  }

  // Local filesystem fallback (works without Vercel Blob token)
  try {
    const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    const imagePath = `/uploads/products/${fileName}`;
    return NextResponse.json({ imagePath });
  } catch (error: any) {
    console.error("Local upload failed:", error?.message ?? error);
    return NextResponse.json(
      { error: `Failed to upload image: ${error?.message ?? "Unknown error"}` },
      { status: 500 },
    );
  }
}
