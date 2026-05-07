import { OrderStatus } from '@prisma/client';

/**
 * Valid order status transitions.
 * PENDING can move to PAID or FAILED.
 * PAID can move to REFUNDED.
 * FAILED and REFUNDED are terminal states.
 */
export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['PAID', 'FAILED'],
  PAID: ['REFUNDED'],
  FAILED: [],
  REFUNDED: [],
};

/**
 * Check whether a status transition is allowed.
 */
export function isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}
