import { OrderStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { computeTopSellers } from '@/lib/admin/analytics';
import { classifyStock, countStockStatuses, StockStatus } from '@/lib/admin/stockStatus';

// ─── Types ────────────────────────────────────────────────────────

interface AnalyticsData {
  totalRevenue: number;
  ordersByStatus: { status: OrderStatus; count: number }[];
  currentMonthOrders: number;
  previousMonthOrders: number;
  topSellers: { name: string; totalSold: number; revenue: number }[];
  activeProductCount: number;
  outOfStockVariantCount: number;
}

interface ProductWithVariantCount {
  id: string;
  name: string;
  price: number;
  waxType: string;
  scentProfile: string;
  isActive: boolean;
  variantCount: number;
  hasOutOfStock: boolean;
  createdAt: Date;
}

interface ProductWithVariants {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  burnTimeHours: number;
  waxType: string;
  scentProfile: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  variants: {
    id: string;
    scent: string;
    waxType: string;
    colorHex: string;
    modelPath: string;
    stock: number;
  }[];
}

interface OrderWithCustomer {
  id: string;
  userId: string;
  customerName: string | null;
  customerEmail: string;
  status: OrderStatus;
  paymentStatus: string | null;
  totalAmountZAR: number;
  createdAt: Date;
}

interface OrderFull extends OrderWithCustomer {
  merchantTransactionId: string;
  items: { name: string; quantity: number; price: number }[];
  giftWrap: boolean;
  giftMessage: string | null;
}

interface InventoryVariant {
  id: string;
  productName: string;
  scent: string;
  waxType: string;
  stock: number;
  stockStatus: StockStatus;
}

// ─── Analytics ────────────────────────────────────────────────────

export async function getAnalyticsData(): Promise<AnalyticsData> {
  const [
    revenueResult,
    orderStatusCounts,
    currentMonthOrders,
    previousMonthOrders,
    orders,
    activeProductCount,
    outOfStockVariantCount,
  ] = await Promise.all([
    // Total revenue from PAID orders
    prisma.order.aggregate({
      _sum: { totalAmountZAR: true },
      where: { status: 'PAID' },
    }),
    // Orders grouped by status
    prisma.order.groupBy({
      by: ['status'],
      _count: { status: true },
    }),
    // Current month order count
    (() => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return prisma.order.count({
        where: { createdAt: { gte: startOfMonth } },
      });
    })(),
    // Previous month order count
    (() => {
      const now = new Date();
      const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return prisma.order.count({
        where: {
          createdAt: { gte: startOfPrevMonth, lt: startOfCurrentMonth },
        },
      });
    })(),
    // All orders for top sellers computation
    prisma.order.findMany({
      where: { status: 'PAID' },
      select: {
        status: true,
        totalAmountZAR: true,
        createdAt: true,
        items: true,
      },
    }),
    // Active product count
    prisma.product.count({ where: { isActive: true } }),
    // Out of stock variant count
    prisma.productVariant.count({ where: { stock: 0 } }),
  ]);

  // Build ordersByStatus ensuring all 4 statuses are present
  const statusCountMap: Record<OrderStatus, number> = {
    PENDING: 0,
    PAID: 0,
    FAILED: 0,
    REFUNDED: 0,
  };
  for (const group of orderStatusCounts) {
    statusCountMap[group.status] = group._count.status;
  }
  const ordersByStatus = Object.entries(statusCountMap).map(([status, count]) => ({
    status: status as OrderStatus,
    count,
  }));

  // Compute top sellers using the analytics utility
  const topSellers = computeTopSellers(
    orders.map((o) => ({
      status: o.status,
      totalAmountZAR: o.totalAmountZAR,
      createdAt: o.createdAt,
      items: o.items,
    })),
    5
  );

  return {
    totalRevenue: revenueResult._sum.totalAmountZAR ?? 0,
    ordersByStatus,
    currentMonthOrders,
    previousMonthOrders,
    topSellers,
    activeProductCount,
    outOfStockVariantCount,
  };
}

// ─── Products ─────────────────────────────────────────────────────

export async function getProducts(params: {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}): Promise<{ products: ProductWithVariantCount[]; totalCount: number }> {
  const { page, pageSize, search, sortBy = 'createdAt', sortDir = 'desc' } = params;

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { scentProfile: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        variants: {
          select: { stock: true },
        },
      },
      orderBy: { [sortBy]: sortDir },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  const mapped: ProductWithVariantCount[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    waxType: p.waxType,
    scentProfile: p.scentProfile,
    isActive: p.isActive,
    variantCount: p.variants.length,
    hasOutOfStock: p.variants.some((v) => v.stock === 0),
    createdAt: p.createdAt,
  }));

  return { products: mapped, totalCount };
}

// ─── Product By ID ────────────────────────────────────────────────

export async function getProductById(id: string): Promise<ProductWithVariants | null> {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: {
        select: {
          id: true,
          scent: true,
          waxType: true,
          colorHex: true,
          modelPath: true,
          stock: true,
        },
      },
    },
  });

  if (!product) return null;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price,
    burnTimeHours: product.burnTimeHours,
    waxType: product.waxType,
    scentProfile: product.scentProfile,
    isActive: product.isActive,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    variants: product.variants,
  };
}

// ─── Orders ───────────────────────────────────────────────────────

export async function getOrders(params: {
  page: number;
  pageSize: number;
  status?: string;
  search?: string;
}): Promise<{ orders: OrderWithCustomer[]; totalCount: number }> {
  const { page, pageSize, status, search } = params;

  const where: Record<string, unknown> = {};

  if (status) {
    where.status = status as OrderStatus;
  }

  if (search) {
    where.OR = [
      { merchantTransactionId: { contains: search, mode: 'insensitive' } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [orders, totalCount] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.order.count({ where }),
  ]);

  const mapped: OrderWithCustomer[] = orders.map((o) => ({
    id: o.id,
    userId: o.userId,
    customerName: o.user.name,
    customerEmail: o.user.email,
    status: o.status,
    paymentStatus: o.paymentStatus,
    totalAmountZAR: o.totalAmountZAR,
    createdAt: o.createdAt,
  }));

  return { orders: mapped, totalCount };
}

// ─── Order By ID ──────────────────────────────────────────────────

export async function getOrderById(id: string): Promise<OrderFull | null> {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
  });

  if (!order) return null;

  const items = Array.isArray(order.items)
    ? (order.items as { name: string; quantity: number; price: number }[])
    : [];

  return {
    id: order.id,
    userId: order.userId,
    customerName: order.user.name,
    customerEmail: order.user.email,
    status: order.status,
    paymentStatus: order.paymentStatus,
    totalAmountZAR: order.totalAmountZAR,
    createdAt: order.createdAt,
    merchantTransactionId: order.merchantTransactionId,
    items,
    giftWrap: order.giftWrap,
    giftMessage: order.giftMessage,
  };
}

// ─── Inventory ────────────────────────────────────────────────────

export async function getInventory(params: {
  filter?: 'all' | 'out-of-stock' | 'low-stock';
}): Promise<{ variants: InventoryVariant[]; outOfStockCount: number; lowStockCount: number }> {
  const { filter = 'all' } = params;

  const allVariants = await prisma.productVariant.findMany({
    include: {
      product: {
        select: { name: true },
      },
    },
    orderBy: { stock: 'asc' },
  });

  const { outOfStock, lowStock } = countStockStatuses(allVariants);

  let filtered = allVariants;
  if (filter === 'out-of-stock') {
    filtered = allVariants.filter((v) => v.stock === 0);
  } else if (filter === 'low-stock') {
    filtered = allVariants.filter((v) => v.stock > 0 && v.stock <= 4);
  }

  const variants: InventoryVariant[] = filtered.map((v) => ({
    id: v.id,
    productName: v.product.name,
    scent: v.scent,
    waxType: v.waxType,
    stock: v.stock,
    stockStatus: classifyStock(v.stock),
  }));

  return {
    variants,
    outOfStockCount: outOfStock,
    lowStockCount: lowStock,
  };
}
