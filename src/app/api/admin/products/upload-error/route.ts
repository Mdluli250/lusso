import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type AdminAuthResult =
  | { ok: true; userEmail: string }
  | { ok: false; error: string };

async function requireAdmin(): Promise<AdminAuthResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return { ok: false, error: "Unauthorized" };
  }
  return { ok: true, userEmail: session.user.email ?? "unknown" };
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const payload = await request.json().catch(() => ({}));
    const fileName = payload.fileName ?? "unknown";
    const error = payload.error ?? "(no error provided)";
    console.error(`Admin reported upload error for ${fileName}:`, error, {
      user: auth.userEmail,
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
