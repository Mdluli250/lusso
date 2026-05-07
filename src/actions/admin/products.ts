'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateProductForm } from '@/lib/admin/validateProduct';

interface VariantFormData {
  id?: string;
  scent: string;
  waxType: string;
  colorHex: string;
  modelPath: string;
  stock: number;
  _delete?: boolean;
}

interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  price: number;
  burnTimeHours: number;
  waxType: string;
  scentProfile: string;
  isActive: boolean;
  variants: VariantFormData[];
}

async function requireAdmin(): Promise<{ error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return { error: 'Unauthorized' };
  }
  return {};
}

export async function createProduct(
  data: ProductFormData
): Promise<{ id: string } | { error: string }> {
  try {
    const auth = await requireAdmin();
    if (auth.error) return { error: auth.error };

    const errors = validateProductForm(data);
    if (Object.keys(errors).length > 0) {
      return { error: Object.values(errors).join(', ') };
    }

    // Check slug uniqueness
    const existing = await prisma.product.findUnique({
      where: { slug: data.slug },
    });
    if (existing) {
      return { error: 'A product with this slug already exists' };
    }

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          price: data.price,
          burnTimeHours: data.burnTimeHours,
          waxType: data.waxType,
          scentProfile: data.scentProfile,
          isActive: data.isActive,
          variants: {
            create: data.variants
              .filter((v) => !v._delete)
              .map((v) => ({
                scent: v.scent,
                waxType: v.waxType,
                colorHex: v.colorHex,
                modelPath: v.modelPath,
                stock: v.stock,
              })),
          },
        },
      });
      return created;
    });

    return { id: product.id };
  } catch (error) {
    console.error('createProduct failed:', error);
    return { error: 'Failed to create product' };
  }
}

export async function updateProduct(
  id: string,
  data: ProductFormData
): Promise<{ success: true } | { error: string }> {
  try {
    const auth = await requireAdmin();
    if (auth.error) return { error: auth.error };

    const errors = validateProductForm(data);
    if (Object.keys(errors).length > 0) {
      return { error: Object.values(errors).join(', ') };
    }

    // Check slug uniqueness excluding self
    const existing = await prisma.product.findFirst({
      where: { slug: data.slug, NOT: { id } },
    });
    if (existing) {
      return { error: 'A product with this slug already exists' };
    }

    await prisma.$transaction(async (tx) => {
      // Update the product record
      await tx.product.update({
        where: { id },
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          price: data.price,
          burnTimeHours: data.burnTimeHours,
          waxType: data.waxType,
          scentProfile: data.scentProfile,
          isActive: data.isActive,
        },
      });

      // Handle variant deletes
      const variantsToDelete = data.variants.filter((v) => v._delete && v.id);
      if (variantsToDelete.length > 0) {
        await tx.productVariant.deleteMany({
          where: { id: { in: variantsToDelete.map((v) => v.id!) } },
        });
      }

      // Handle variant creates and updates
      const variantsToKeep = data.variants.filter((v) => !v._delete);
      for (const variant of variantsToKeep) {
        if (variant.id) {
          // Update existing variant
          await tx.productVariant.update({
            where: { id: variant.id },
            data: {
              scent: variant.scent,
              waxType: variant.waxType,
              colorHex: variant.colorHex,
              modelPath: variant.modelPath,
              stock: variant.stock,
            },
          });
        } else {
          // Create new variant
          await tx.productVariant.create({
            data: {
              productId: id,
              scent: variant.scent,
              waxType: variant.waxType,
              colorHex: variant.colorHex,
              modelPath: variant.modelPath,
              stock: variant.stock,
            },
          });
        }
      }
    });

    return { success: true };
  } catch (error) {
    console.error('updateProduct failed:', error);
    return { error: 'Failed to update product' };
  }
}

export async function deleteProduct(
  id: string
): Promise<{ success: true } | { error: string }> {
  try {
    const auth = await requireAdmin();
    if (auth.error) return { error: auth.error };

    await prisma.product.delete({ where: { id } });

    return { success: true };
  } catch (error) {
    console.error('deleteProduct failed:', error);
    return { error: 'Failed to delete product' };
  }
}

export async function toggleProductActive(
  id: string,
  isActive: boolean
): Promise<{ success: true } | { error: string }> {
  try {
    const auth = await requireAdmin();
    if (auth.error) return { error: auth.error };

    await prisma.product.update({
      where: { id },
      data: { isActive },
    });

    return { success: true };
  } catch (error) {
    console.error('toggleProductActive failed:', error);
    return { error: 'Failed to update product status' };
  }
}
