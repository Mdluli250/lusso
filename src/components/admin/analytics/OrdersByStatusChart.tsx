import { OrderStatus } from '@prisma/client';

interface OrdersByStatusChartProps {
  data: { status: OrderStatus; count: number }[];
}

const statusColors: Record<OrderStatus, { bg: string; text: string; label: string }> = {
  PENDING: {
    bg: 'bg-yellow-500/20',
    text: 'text-yellow-400',
    label: 'Pending',
  },
  PAID: {
    bg: 'bg-green-500/20',
    text: 'text-green-400',
    label: 'Paid',
  },
  FAILED: {
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    label: 'Failed',
  },
  REFUNDED: {
    bg: 'bg-purple-500/20',
    text: 'text-purple-400',
    label: 'Refunded',
  },
};

/**
 * OrdersByStatusChart — visual display of order counts by status
 * using colored horizontal bars. Scales bars relative to the max count.
 *
 * Requirements: 3.2
 */
export function OrdersByStatusChart({ data }: OrdersByStatusChartProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <h3 className="text-sm font-medium text-muted mb-4">Orders by Status</h3>
      <div className="space-y-3">
        {data.map(({ status, count }) => {
          const config = statusColors[status];
          const widthPercent = (count / maxCount) * 100;

          return (
            <div key={status} className="flex items-center gap-3">
              <span className={`text-xs font-medium w-20 ${config.text}`}>
                {config.label}
              </span>
              <div className="flex-1 h-6 rounded bg-surface-muted overflow-hidden">
                <div
                  className={`h-full rounded ${config.bg} transition-all duration-300`}
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-foreground w-10 text-right">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
