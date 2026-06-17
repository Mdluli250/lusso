interface EmptyStateProps {
  title: string;
  description: string;
  action?: { label: string; href: string } | { label: string; onClick: () => void };
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {/* Candle illustration */}
      <svg width="80" height="100" viewBox="0 0 72 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-6 opacity-30" aria-hidden="true">
        <ellipse cx="36" cy="10" rx="5" ry="8" fill="var(--theme-accent)" opacity="0.6" />
        <line x1="36" y1="18" x2="36" y2="26" stroke="var(--theme-accent)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        <rect x="18" y="26" width="36" height="58" rx="6" fill="var(--theme-accent)" opacity="0.15" />
        <rect x="18" y="26" width="36" height="58" rx="6" stroke="var(--theme-accent)" strokeWidth="1.5" opacity="0.3" />
      </svg>
      <h3 className="text-lg font-semibold text-[var(--theme-accent)] mb-2">{title}</h3>
      <p className="text-[var(--theme-accent)]/60 max-w-sm mb-6">{description}</p>
      {action && (
        'href' in action ? (
          <a href={action.href} className="inline-flex items-center justify-center px-6 py-3 min-h-[44px] rounded-lg bg-[var(--theme-accent)] text-cream font-medium hover:opacity-90 transition-opacity">
            {action.label}
          </a>
        ) : (
          <button onClick={action.onClick} className="inline-flex items-center justify-center px-6 py-3 min-h-[44px] rounded-lg bg-[var(--theme-accent)] text-cream font-medium hover:opacity-90 transition-opacity">
            {action.label}
          </button>
        )
      )}
    </div>
  );
}
