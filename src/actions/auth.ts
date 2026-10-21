'use server';

import { randomBytes } from 'crypto';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';

type Result = { success: true } | { error: string };

// ─── Register ──────────────────────────────────────────────────────────────

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
}): Promise<Result> {
  const name = data.name.trim();
  const email = data.email.toLowerCase().trim();
  const { password } = data;

  if (!name || name.length < 2) return { error: 'Name must be at least 2 characters.' };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Enter a valid email address.' };
  if (!password || password.length < 8) return { error: 'Password must be at least 8 characters.' };
  if (password.length > 128) return { error: 'Password is too long.' };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: 'An account with this email already exists. Try signing in.' };

  const hashed = await hash(password, 12);

  await prisma.user.create({
    data: { name, email, password: hashed },
  });

  return { success: true };
}

// ─── Request password reset ────────────────────────────────────────────────

export async function requestPasswordReset(email: string): Promise<Result> {
  const normalised = email.toLowerCase().trim();
  if (!normalised || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalised)) {
    return { error: 'Enter a valid email address.' };
  }

  const user = await prisma.user.findUnique({ where: { email: normalised } });

  // Always return success to prevent email enumeration
  if (!user || !user.password) return { success: true };

  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetToken: token, passwordResetExpires: expires },
  });

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;

  await sendPasswordResetEmail(user.id, user.email, resetUrl)
    .catch((err) => console.error('[Auth] Password reset email failed:', err));

  return { success: true };
}

// ─── Reset password ────────────────────────────────────────────────────────

export async function resetPassword(data: {
  token: string;
  password: string;
}): Promise<Result> {
  const { token, password } = data;

  if (!token) return { error: 'Invalid reset link.' };
  if (!password || password.length < 8) return { error: 'Password must be at least 8 characters.' };
  if (password.length > 128) return { error: 'Password is too long.' };

  const user = await prisma.user.findUnique({ where: { passwordResetToken: token } });

  if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
    return { error: 'This reset link is invalid or has expired. Please request a new one.' };
  }

  const hashed = await hash(password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashed,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });

  return { success: true };
}
