import { OrderStatus } from '@prisma/client';

interface OrderForAnalytics {
  status: OrderStatus;
  totalAmountZAR: number;
  createdAt: Date;
  items: unknown; // JSON field — expected to be an array of { name, quantity, price }
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

/**
 * Compute total revenue from PAID orders only.
 */
export function computeRevenue(orders: OrderForAnalytics[]): number {
  return orders
    .filter((o) => o.status === 'PAID')
    .reduce((sum, o) => sum + o.totalAmountZAR, 0);
}

/**
 * Group orders by status, returning a count for each status.
 * Always includes all 4 statuses even if count is 0.
 */
export function groupOrdersByStatus(
  orders: { status: OrderStatus }[]
): Record<OrderStatus, number> {
  const counts: Record<OrderStatus, number> = {
    PENDING: 0,
    PAID: 0,
    FAILED: 0,
    REFUNDED: 0,
  };

  for (const order of orders) {
    counts[order.status]++;
  }

  return counts;
}

/**
 * Filter orders by a specific month (0-indexed) and year based on createdAt.
 */
export function filterOrdersByMonth(
  orders: OrderForAnalytics[],
  year: number,
  month: number
): OrderForAnalytics[] {
  return orders.filter((order) => {
    const d = order.createdAt;
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

/**
 * Parse the items JSON field from an order into a typed array.
 */
function parseItems(items: unknown): OrderItem[] {
  if (Array.isArray(items)) {
    return items as OrderItem[];
  }
  return [];
}

/**
 * Compute top-selling products by aggregating item quantities across all orders.
 * Returns the top N products sorted by total quantity sold (descending).
 */
export function computeTopSellers(
  orders: OrderForAnalytics[],
  limit: number
): { name: string; totalSold: number; revenue: number }[] {
  const aggregated = new Map<string, { totalSold: number; revenue: number }>();

  for (const order of orders) {
    const items = parseItems(order.items);
    for (const item of items) {
      const existing = aggregated.get(item.name);
      const quantity = item.quantity ?? 0;
      const revenue = item.price * quantity;

      if (existing) {
        existing.totalSold += quantity;
        existing.revenue += revenue;
      } else {
        aggregated.set(item.name, { totalSold: quantity, revenue });
      }
    }
  }

  return Array.from(aggregated.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.totalSold - a.totalSold)
    .slice(0, limit);
}
