import { ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: ReactNode;
}

/**
 * MetricCard — displays a single analytics metric with title, value,
 * optional subtitle and icon. Uses Tailwind with theme variables.
 *
 * Requirements: 3.1, 3.3, 3.5
 */
export function MetricCard({ title, value, subtitle, icon }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5 flex items-start gap-4">
      {icon && (
        <div className="flex-shrink-0 rounded-md bg-surface-muted p-2.5 text-theme-accent">
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted font-medium">{title}</p>
        <p className="mt-1 text-2xl font-bold text-foreground truncate">{value}</p>
        {subtitle && (
          <p className="mt-1 text-xs text-muted">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
