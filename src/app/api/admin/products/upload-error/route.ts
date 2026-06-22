import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return { error: "Unauthorized" };
  }
  return { user: session.user };
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ((auth as any).error) {
    return NextResponse.json({ error: (auth as any).error }, { status: 401 });
  }

  try {
    const payload = await request.json().catch(() => ({}));
    const fileName = payload.fileName ?? "unknown";
    const error = payload.error ?? "(no error provided)";
    console.error(`Admin reported upload error for ${fileName}:`, error, {
      user: (auth as any).user,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("upload-error handler failed:", err);
    return NextResponse.json(
      { error: "Failed to record upload error" },
      { status: 500 },
    );
  }
}
