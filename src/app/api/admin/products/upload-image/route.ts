import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { put } from "@vercel/blob";
import { randomUUID } from "crypto";

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

  try {
    const ext = file.name.substring(file.name.lastIndexOf('.')) || ".jpg";
    const fileName = `${Date.now()}-${randomUUID()}${ext}`;
    const blobPath = `products/${fileName}`;

    const blob = await put(blobPath, file, {
      access: "public",
      contentType: file.type,
    });

    return NextResponse.json({ imagePath: blob.url });
  } catch (error) {
    console.error("uploadImage failed:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 },
    );
  }
}
