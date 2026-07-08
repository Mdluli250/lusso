"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDiscountStats } from "@/lib/discounts/service";

// ─── Types ────────────────────────────────────────────────────────

interface CreateDiscountInput {
  code: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";
  value: number;
  minOrderAmountZAR?: number;
  maxUsageCount?: number | null;
  perUserLimit?: number | null;
  maxDiscountAmountZAR?: number | null;
  stackable?: boolean;
  startDate?: string | null; // ISO string
  endDate?: string | null;
  applicableProductIds?: string[];
}

type UpdateDiscountInput = Partial<CreateDiscountInput>;

export interface DiscountCodeWithStats {
  id: string;
  code: string;
  type: string;
  value: number;
  active: boolean;
  maxUsageCount: number | null;
  usageCount: number;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  stackable: boolean;
  minOrderAmountZAR: number;
  totalDiscountGiven: number;
}

export interface DiscountDetail {
  id: string;
  code: string;
  type: string;
  value: number;
  active: boolean;
  minOrderAmountZAR: number;
  maxUsageCount: number | null;
  perUserLimit: number | null;
  maxDiscountAmountZAR: number | null;
  stackable: boolean;
  startDate: Date | null;
  endDate: Date | null;
  applicableProductIds: string[];
  createdAt: Date;
  updatedAt: Date;
  stats: {
    totalRedemptions: number;
    totalDiscountGiven: number;
    recentRedemptions: Array<{
      userEmail: string;
      orderId: string;
      discountAmount: number;
      date: Date;
    }>;
  };
}

// ─── Auth Helper ──────────────────────────────────────────────────

async function requireAdmin(): Promise<{ error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return { error: "Unauthorized" };
  }
  return {};
}

// ─── Validation Helpers ───────────────────────────────────────────

function validateDiscountInput(
  data: CreateDiscountInput | UpdateDiscountInput,
  isCreate: boolean
): string | null {
  if (isCreate) {
    const createData = data as CreateDiscountInput;
    if (!createData.code || createData.code.trim().length === 0) {
      return "Code is required.";
    }
    if (!createData.type) {
      return "Discount type is required.";
    }
  }

  if (data.type === "PERCENTAGE" && data.value !== undefined) {
    if (data.value < 1 || data.value > 100) {
      return "Percentage must be between 1 and 100.";
    }
  }

  if (data.type === "FIXED_AMOUNT" && data.value !== undefined) {
    if (data.value <= 0 || !Number.isInteger(data.value)) {
      return "Amount must be a positive number.";
    }
  }

  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (start >= end) {
      return "Start date must be before end date.";
    }
  }

  return null;
}

// ─── Server Actions ───────────────────────────────────────────────

export async function createDiscountCode(
  data: CreateDiscountInput
): Promise<{ id: string } | { error: string }> {
  try {
    const auth = await requireAdmin();
    if (auth.error) return { error: auth.error };

    const validationError = validateDiscountInput(data, true);
    if (validationError) return { error: validationError };

    // Check for duplicate code (case-insensitive)
    const existing = await prisma.discountCode.findFirst({
      where: { code: { equals: data.code.trim(), mode: "insensitive" } },
    });
    if (existing) {
      return { error: "A code with this name already exists." };
    }

    const discountCode = await prisma.discountCode.create({
      data: {
        code: data.code.trim().toUpperCase(),
        type: data.type,
        value: data.value,
        minOrderAmountZAR: data.minOrderAmountZAR ?? 0,
        maxUsageCount: data.maxUsageCount ?? null,
        perUserLimit: data.perUserLimit ?? null,
        maxDiscountAmountZAR: data.maxDiscountAmountZAR ?? null,
        stackable: data.stackable ?? false,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        applicableProductIds: data.applicableProductIds ?? [],
      },
    });

    revalidatePath("/admin/discounts");
    return { id: discountCode.id };
  } catch (error: any) {
    // Handle Prisma unique constraint violation
    if (error?.code === "P2002") {
      return { error: "A code with this name already exists." };
    }
    console.error("createDiscountCode failed:", error);
    return { error: "Failed to create discount code." };
  }
}

export async function updateDiscountCode(
  id: string,
  data: UpdateDiscountInput
): Promise<{ success: true } | { error: string }> {
  try {
    const auth = await requireAdmin();
    if (auth.error) return { error: auth.error };

    const validationError = validateDiscountInput(data, false);
    if (validationError) return { error: validationError };

    // If code is being changed, check for duplicates excluding self
    if (data.code) {
      const existing = await prisma.discountCode.findFirst({
        where: {
          code: { equals: data.code.trim(), mode: "insensitive" },
          NOT: { id },
        },
      });
      if (existing) {
        return { error: "A code with this name already exists." };
      }
    }

    await prisma.discountCode.update({
      where: { id },
      data: {
        ...(data.code !== undefined && { code: data.code.trim().toUpperCase() }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.value !== undefined && { value: data.value }),
        ...(data.minOrderAmountZAR !== undefined && {
          minOrderAmountZAR: data.minOrderAmountZAR,
        }),
        ...(data.maxUsageCount !== undefined && {
          maxUsageCount: data.maxUsageCount,
        }),
        ...(data.perUserLimit !== undefined && {
          perUserLimit: data.perUserLimit,
        }),
        ...(data.maxDiscountAmountZAR !== undefined && {
          maxDiscountAmountZAR: data.maxDiscountAmountZAR,
        }),
        ...(data.stackable !== undefined && { stackable: data.stackable }),
        ...(data.startDate !== undefined && {
          startDate: data.startDate ? new Date(data.startDate) : null,
        }),
        ...(data.endDate !== undefined && {
          endDate: data.endDate ? new Date(data.endDate) : null,
        }),
        ...(data.applicableProductIds !== undefined && {
          applicableProductIds: data.applicableProductIds,
        }),
      },
    });

    revalidatePath("/admin/discounts");
    return { success: true };
  } catch (error: any) {
    if (error?.code === "P2002") {
      return { error: "A code with this name already exists." };
    }
    console.error("updateDiscountCode failed:", error);
    return { error: "Failed to update discount code." };
  }
}

export async function toggleDiscountActive(
  id: string,
  active: boolean
): Promise<{ success: true } | { error: string }> {
  try {
    const auth = await requireAdmin();
    if (auth.error) return { error: auth.error };

    await prisma.discountCode.update({
      where: { id },
      data: { active },
    });

    revalidatePath("/admin/discounts");
    return { success: true };
  } catch (error) {
    console.error("toggleDiscountActive failed:", error);
    return { error: "Failed to update discount code status." };
  }
}

export async function getDiscountCodes(
  search?: string
): Promise<DiscountCodeWithStats[]> {
  try {
    const auth = await requireAdmin();
    if (auth.error) return [];

    const where = search
      ? { code: { contains: search, mode: "insensitive" as const } }
      : {};

    const codes = await prisma.discountCode.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { usages: true },
        },
      },
    });

    // Compute totalDiscountGiven for each code
    const codeIds = codes.map((c) => c.id);
    const aggregations = await prisma.discountUsage.groupBy({
      by: ["discountCodeId"],
      where: { discountCodeId: { in: codeIds } },
      _sum: { discountAmountZAR: true },
    });

    const discountMap = new Map(
      aggregations.map((agg) => [
        agg.discountCodeId,
        agg._sum.discountAmountZAR ?? 0,
      ])
    );

    return codes.map((code) => ({
      id: code.id,
      code: code.code,
      type: code.type,
      value: code.value,
      active: code.active,
      maxUsageCount: code.maxUsageCount,
      usageCount: code._count.usages,
      startDate: code.startDate,
      endDate: code.endDate,
      createdAt: code.createdAt,
      stackable: code.stackable,
      minOrderAmountZAR: code.minOrderAmountZAR,
      totalDiscountGiven: discountMap.get(code.id) ?? 0,
    }));
  } catch (error) {
    console.error("getDiscountCodes failed:", error);
    return [];
  }
}

export async function getDiscountDetail(
  id: string
): Promise<DiscountDetail | null> {
  try {
    const auth = await requireAdmin();
    if (auth.error) return null;

    const code = await prisma.discountCode.findUnique({
      where: { id },
    });

    if (!code) return null;

    const stats = await getDiscountStats(id);

    return {
      id: code.id,
      code: code.code,
      type: code.type,
      value: code.value,
      active: code.active,
      minOrderAmountZAR: code.minOrderAmountZAR,
      maxUsageCount: code.maxUsageCount,
      perUserLimit: code.perUserLimit,
      maxDiscountAmountZAR: code.maxDiscountAmountZAR,
      stackable: code.stackable,
      startDate: code.startDate,
      endDate: code.endDate,
      applicableProductIds: code.applicableProductIds,
      createdAt: code.createdAt,
      updatedAt: code.updatedAt,
      stats,
    };
  } catch (error) {
    console.error("getDiscountDetail failed:", error);
    return null;
  }
}
