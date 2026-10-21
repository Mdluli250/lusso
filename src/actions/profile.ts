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

export interface ShippingAddressInput {
  recipient: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

export async function updateShippingAddress(address: ShippingAddressInput): Promise<ProfileSuccess | ProfileError> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { error: 'You must be signed in to update your delivery address.' };

    const fields = [address.recipient, address.phone, address.addressLine1, address.city, address.province, address.postalCode, address.country];
    if (fields.some((value) => !value?.trim())) return { error: 'Complete all required delivery address fields.' };
    if (fields.some((value) => value.length > 180) || address.addressLine2.length > 180) {
      return { error: 'One or more address fields are too long.' };
    }

    const normalized = {
      recipient: address.recipient.trim(),
      phone: address.phone.trim(),
      addressLine1: address.addressLine1.trim(),
      addressLine2: address.addressLine2.trim() || null,
      city: address.city.trim(),
      province: address.province.trim(),
      postalCode: address.postalCode.trim(),
      country: address.country.trim(),
    };
    await prisma.shippingAddress.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, ...normalized },
      update: normalized,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to update shipping address:', error);
    return { error: 'Failed to save delivery address. Please try again.' };
  }
}

/**
 * Delete the authenticated user's account and all associated data.
 * Cascading deletes handle orders, reviews, wishlist items, etc.
 */
export async function deleteAccount(): Promise<ProfileSuccess | ProfileError> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { error: 'You must be signed in.' };

    // Check for pending orders that haven't been fulfilled
    const pendingOrders = await prisma.order.count({
      where: {
        userId: session.user.id,
        status: { in: ['PENDING', 'PAID'] },
        fulfillmentStatus: { notIn: ['DELIVERED', 'CANCELLED'] },
      },
    });

    if (pendingOrders > 0) {
      return { error: 'You have pending orders. Please wait for them to be delivered or contact support.' };
    }

    // Delete the user (cascade deletes handle related records)
    await prisma.user.delete({ where: { id: session.user.id } });

    return { success: true };
  } catch (error) {
    console.error('Failed to delete account:', error);
    return { error: 'Failed to delete account. Please try again.' };
  }
}
