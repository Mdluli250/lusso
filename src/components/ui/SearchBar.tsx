'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatZAR } from '@/lib/formatCurrency';

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  scentProfile: string;
  imageUrl: string | null;
}

interface SearchBarProps {
  /** Pre-fill the input (used on the /search results page) */
  defaultValue?: string;
  /** Show autofocus (used on empty search page) */
  autoFocus?: boolean;
  /** Extra classes for the wrapper */
  className?: string;
}

/**
 * SearchBar — controlled input with a live-search dropdown powered by
 * /api/search. Submitting navigates to /search?q=<query>.
 *
 * Accessible: keyboard navigation through results, Escape closes dropdown,
 * sr-only live region announces result count.
 */
export function SearchBar({ defaultValue = '', autoFocus = false, className = '' }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    // Cancel any in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(q.trim())}&limit=6`,
        { signal: abortRef.current.signal }
      );
      if (!res.ok) return;
      const data = (await res.json()) as { results: SearchResult[] };
      setResults(data.results);
      setOpen(data.results.length > 0);
    } catch {
      // Aborted or network error — ignore
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search on input change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === 'Escape') { setOpen(false); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      (listRef.current?.querySelector('a') as HTMLElement | null)?.focus();
    }
  }

  function handleListKeyDown(e: React.KeyboardEvent<HTMLUListElement>) {
    const items = Array.from(listRef.current?.querySelectorAll('a') ?? []) as HTMLElement[];
    const idx = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); items[idx + 1]?.focus(); }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (idx <= 0) inputRef.current?.focus();
      else items[idx - 1]?.focus();
    }
    if (e.key === 'Escape') { setOpen(false); inputRef.current?.focus(); }
  }

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} role="search">
        <label htmlFor="site-search" className="sr-only">Search products</label>
        <div className="relative flex items-center">
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute left-3 h-4 w-4 text-[var(--theme-accent)]/50"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            ref={inputRef}
            id="site-search"
            type="search"
            autoComplete="off"
            autoFocus={autoFocus}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (results.length > 0) setOpen(true); }}
            onBlur={(e) => {
              // Close dropdown unless focus moves inside it
              if (!listRef.current?.contains(e.relatedTarget as Node)) setOpen(false);
            }}
            placeholder="Search candles, scents…"
            aria-expanded={open}
            aria-controls="search-results-list"
            aria-autocomplete="list"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--theme-bg)] py-2.5 pl-10 pr-4 text-sm text-[var(--theme-accent)] placeholder:text-[var(--muted)] focus:border-[var(--theme-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)]"
          />
          {loading && (
            <div
              aria-hidden="true"
              className="absolute right-3 h-4 w-4 animate-spin rounded-full border-2 border-[var(--theme-accent)]/30 border-t-[var(--theme-accent)]"
            />
          )}
        </div>
      </form>

      {/* Live region for screen readers */}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {open ? `${results.length} result${results.length !== 1 ? 's' : ''} found` : ''}
      </p>

      {/* Dropdown */}
      {open && (
        <ul
          id="search-results-list"
          ref={listRef}
          role="listbox"
          onKeyDown={handleListKeyDown}
          className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl"
        >
          {results.map((r) => (
            <li key={r.id} role="option" aria-selected="false">
              <Link
                href={`/products/${r.slug}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--theme-accent)]/5 focus:bg-[var(--theme-accent)]/5 focus:outline-none transition-colors"
              >
                <div className="relative h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-[var(--theme-accent)]/10">
                  {r.imageUrl ? (
                    <Image src={r.imageUrl} alt={r.name} fill sizes="40px" className="object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-lg">🕯</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--theme-accent)] truncate">{r.name}</p>
                  <p className="text-xs text-[var(--muted)] truncate">{r.scentProfile}</p>
                </div>
                <span className="text-sm font-medium text-[var(--theme-accent)] shrink-0">
                  {formatZAR(r.price)}
                </span>
              </Link>
            </li>
          ))}
          <li className="border-t border-[var(--border)]">
            <Link
              href={`/search?q=${encodeURIComponent(query.trim())}`}
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1 px-4 py-2.5 text-xs text-[var(--theme-accent)]/60 hover:text-[var(--theme-accent)] hover:bg-[var(--theme-accent)]/5 transition-colors focus:outline-none focus:bg-[var(--theme-accent)]/5"
            >
              See all results for &ldquo;{query}&rdquo;
            </Link>
          </li>
        </ul>
      )}
    </div>
  );
}
