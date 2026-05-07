import { OrderStatus } from '@prisma/client';

interface OrderLike {
  status: OrderStatus;
  merchantTransactionId: string;
  customerEmail?: string;
  user?: { email: string } | null;
}

/**
 * Filter orders by a specific status.
 */
export function filterOrdersByStatus<T extends { status: OrderStatus }>(
  orders: T[],
  status: OrderStatus
): T[] {
  return orders.filter((order) => order.status === status);
}

/**
 * Search orders by case-insensitive match on merchantTransactionId or customerEmail.
 */
export function searchOrders<T extends OrderLike>(
  orders: T[],
  searchTerm: string
): T[] {
  if (!searchTerm.trim()) return orders;

  const term = searchTerm.toLowerCase();
  return orders.filter((order) => {
    if (order.merchantTransactionId.toLowerCase().includes(term)) return true;
    if (order.customerEmail && order.customerEmail.toLowerCase().includes(term)) return true;
    if (order.user?.email && order.user.email.toLowerCase().includes(term)) return true;
    return false;
  });
}
