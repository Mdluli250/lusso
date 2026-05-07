type BadgeStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED'
  | 'active'
  | 'inactive'
  | 'in-stock'
  | 'low-stock'
  | 'out-of-stock';

interface StatusBadgeProps {
  status: BadgeStatus;
}

const statusConfig: Record<BadgeStatus, { label: string; classes: string }> = {
  // Order statuses
  PENDING: {
    label: 'Pending',
    classes: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  },
  PAID: {
    label: 'Paid',
    classes: 'bg-green-500/15 text-green-400 border-green-500/30',
  },
  FAILED: {
    label: 'Failed',
    classes: 'bg-red-500/15 text-red-400 border-red-500/30',
  },
  REFUNDED: {
    label: 'Refunded',
    classes: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  },
  // Product statuses
  active: {
    label: 'Active',
    classes: 'bg-green-500/15 text-green-400 border-green-500/30',
  },
  inactive: {
    label: 'Inactive',
    classes: 'bg-muted/15 text-muted border-border',
  },
  // Stock statuses
  'in-stock': {
    label: 'In Stock',
    classes: 'bg-green-500/15 text-green-400 border-green-500/30',
  },
  'low-stock': {
    label: 'Low Stock',
    classes: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  },
  'out-of-stock': {
    label: 'Out of Stock',
    classes: 'bg-red-500/15 text-red-400 border-red-500/30',
  },
};

/**
 * StatusBadge — color-coded badge for order, product, and stock statuses.
 * Uses semantic colors: green for positive, amber for warning, red for critical.
 *
 * Requirements: 10.1
 */
export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  if (!config) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border border-border text-muted">
        {status}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${config.classes}`}
    >
      {config.label}
    </span>
  );
}
