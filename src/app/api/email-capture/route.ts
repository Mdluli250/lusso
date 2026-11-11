import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';

function generateDiscountCode(): string {
  // Use crypto.randomBytes for cryptographically secure random values.
  // Map each byte into the 36-char alphanumeric set (A-Z, 0-9).
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = randomBytes(8);
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join('');
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * POST /api/email-capture — accepts an email, generates a unique discount code,
 * and stores it. Returns existing code for duplicate emails (idempotent).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check for existing entry (idempotent — return existing code)
    const existing = await prisma.emailCapture.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json({ discountCode: existing.discountCode });
    }

    // Generate a unique discount code with retry for collisions
    let discountCode: string;
    let attempts = 0;
    const maxAttempts = 5;

    while (true) {
      discountCode = generateDiscountCode();
      const codeExists = await prisma.emailCapture.findUnique({
        where: { discountCode },
      });
      if (!codeExists) break;
      attempts++;
      if (attempts >= maxAttempts) {
        return NextResponse.json(
          { error: 'Failed to generate unique code. Please try again.' },
          { status: 500 }
        );
      }
    }

    await prisma.emailCapture.create({
      data: {
        email: normalizedEmail,
        discountCode,
      },
    });

    return NextResponse.json({ discountCode });
  } catch (error) {
    console.error('Email capture failed:', error);
    return NextResponse.json(
      { error: 'Failed to process email capture' },
      { status: 500 }
    );
  }
}
