import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/profile/address
 * Returns the authenticated user's saved shipping address, or null.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ address: null }, { status: 401 });
  }

  const address = await prisma.shippingAddress.findUnique({
    where: { userId: session.user.id },
    select: {
      recipient: true,
      phone: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      province: true,
      postalCode: true,
      country: true,
    },
  }).catch(() => null);

  return NextResponse.json({ address });
}
