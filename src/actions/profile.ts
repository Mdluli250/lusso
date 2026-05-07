'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface ProfileSuccess {
  success: true;
}

interface ProfileError {
  error: string;
}

/**
 * Server Action: update the authenticated user's display name.
 * Validates session before persisting the change.
 *
 * Requirements: 9.5
 */
export async function updateUserName(
  name: string
): Promise<ProfileSuccess | ProfileError> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { error: 'You must be signed in to update your profile.' };
    }

    if (!name || name.trim().length === 0) {
      return { error: 'Name cannot be empty.' };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: name.trim() },
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to update user name:', error);
    return { error: 'Failed to update name. Please try again.' };
  }
}
