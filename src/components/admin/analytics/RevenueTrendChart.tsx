'use client';

import { formatZAR } from '@/lib/formatCurrency';

interface DailyRevenue {
  date: string; // 'YYYY-MM-DD'
  revenue: number; // ZAR cents
}

interface RevenueTrendChartProps {
  data: DailyRevenue[];
}

/**
 * RevenueTrendChart — 30-day revenue sparkline using SVG polyline.
 * No external chart library required.
 */
export function RevenueTrendChart({ data }: RevenueTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-5">
        <h3 className="text-sm font-medium text-muted mb-4">Revenue (Last 30 Days)</h3>
        <p className="text-sm text-muted">No revenue data available.</p>
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  const total = data.reduce((sum, d) => sum + d.revenue, 0);

  const WIDTH = 400;
  const HEIGHT = 80;
  const PAD = 4;

  const points = data.map((d, i) => {
    const x = PAD + (i / (data.length - 1 || 1)) * (WIDTH - PAD * 2);
    const y = PAD + (1 - d.revenue / maxRevenue) * (HEIGHT - PAD * 2);
    return `${x},${y}`;
  });

  const polyline = points.join(' ');

  // Find peak day
  const peak = data.reduce((best, d) => (d.revenue > best.revenue ? d : best), data[0]);

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-medium text-muted">Revenue (Last 30 Days)</h3>
        <span className="text-sm font-semibold text-foreground">{formatZAR(total)}</span>
      </div>
      <p className="text-xs text-muted mb-4">
        Peak: {formatZAR(peak.revenue)} on {new Date(peak.date).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}
      </p>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        aria-label="Revenue trend over last 30 days"
        role="img"
      >
        {/* Fill area */}
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--theme-accent)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="var(--theme-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline
          points={`${PAD},${HEIGHT - PAD} ${polyline} ${WIDTH - PAD},${HEIGHT - PAD}`}
          fill="url(#revenueGradient)"
          stroke="none"
        />
        {/* Line */}
        <polyline
          points={polyline}
          fill="none"
          stroke="var(--theme-accent)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {/* X-axis labels: first, mid, last */}
      <div className="flex justify-between mt-1">
        <span className="text-xs text-muted">
          {new Date(data[0].date).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}
        </span>
        <span className="text-xs text-muted">
          {new Date(data[Math.floor(data.length / 2)].date).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}
        </span>
        <span className="text-xs text-muted">
          {new Date(data[data.length - 1].date).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}
        </span>
      </div>
    </div>
  );
}
