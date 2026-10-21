'use client';

import { useState } from 'react';

interface FaqItem { q: string; a: string; }

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <dl className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="rounded-xl border border-[var(--theme-accent)]/10 overflow-hidden">
          <dt>
            <button
              type="button"
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-[var(--theme-accent)] hover:bg-[var(--theme-accent)]/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--theme-accent)]"
            >
              <span>{item.q}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
          </dt>
          {open === i && (
            <dd className="px-5 pb-4 text-sm text-[var(--theme-accent)]/70 leading-relaxed border-t border-[var(--theme-accent)]/10 pt-3">
              {item.a}
            </dd>
          )}
        </div>
      ))}
    </dl>
  );
}
