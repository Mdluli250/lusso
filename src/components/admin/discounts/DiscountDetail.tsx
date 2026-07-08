/**
 * DiscountDetail — Server Component that displays usage statistics
 * for a single discount code.
 *
 * Requirements: 10.3, 10.4
 */

interface DiscountDetailProps {
  stats: {
    totalRedemptions: number;
    totalDiscountGiven: number;
    recentRedemptions: Array<{
      userEmail: string;
      orderId: string;
      discountAmount: number;
      date: Date | string;
    }>;
  };
}

function formatRands(cents: number): string {
  return `R ${(cents / 100).toFixed(2)}`;
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-ZA');
}

function truncateOrderId(orderId: string): string {
  if (orderId.length <= 12) return orderId;
  return `${orderId.slice(0, 8)}…`;
}

export function DiscountDetail({ stats }: DiscountDetailProps) {
  const { totalRedemptions, totalDiscountGiven, recentRedemptions } = stats;

  return (
    <div className="space-y-6">
      {/* Summary Stats Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-sm text-muted-foreground">Total Redemptions</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {totalRedemptions}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-sm text-muted-foreground">Total Discount Given</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {formatRands(totalDiscountGiven)}
          </p>
        </div>
      </div>

      {/* Recent Redemptions Table */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">
          Recent Redemptions
        </h3>

        {recentRedemptions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No redemptions yet
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    User Email
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    Order ID
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    Discount
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentRedemptions.slice(0, 10).map((redemption, index) => (
                  <tr
                    key={`${redemption.orderId}-${index}`}
                    className="border-b border-border last:border-b-0 hover:bg-surface-muted/50 transition-colors"
                  >
                    <td className="px-4 py-2 text-foreground">
                      {redemption.userEmail}
                    </td>
                    <td
                      className="px-4 py-2 font-mono text-xs text-muted-foreground"
                      title={redemption.orderId}
                    >
                      {truncateOrderId(redemption.orderId)}
                    </td>
                    <td className="px-4 py-2 text-foreground">
                      {formatRands(redemption.discountAmount)}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {formatDate(redemption.date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
