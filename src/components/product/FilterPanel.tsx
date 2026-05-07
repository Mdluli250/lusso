'use client';

/**
 * FilterPanel — client-side filter controls for the product collection.
 *
 * Manages controlled state for:
 *   - Search query (matches name, scentProfile, description)
 *   - Scent profile (single select)
 *   - Wax type (single select)
 *   - Burn time range (min/max hours)
 *
 * Filters the pre-fetched product list entirely client-side and emits
 * the filtered results via `onFilteredProducts` within 300ms of any change.
 *
 * Requirements: 4.2, 4.3, 4.4, 4.5
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import type { FilterState } from '@/types';
import type { ProductWithVariants } from './types';

// ─── Types ────────────────────────────────────────────────────────

interface FilterPanelProps {
  /** Full unfiltered product list (fetched once by the Server Component) */
  allProducts: ProductWithVariants[];
  /** Called whenever the filtered list changes */
  onFilteredProducts: (products: ProductWithVariants[]) => void;
  /** Called when the user explicitly resets all filters */
  onReset?: () => void;
  /** Called when the scent filter changes (value or null when cleared) */
  onScentChange?: (scent: string | null) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────

function deriveOptions(products: ProductWithVariants[]) {
  const scents = Array.from(new Set(products.map((p) => p.scentProfile))).sort();
  const waxTypes = Array.from(new Set(products.map((p) => p.waxType))).sort();
  const burnTimes = products.map((p) => p.burnTimeHours);
  const minBurn = burnTimes.length ? Math.min(...burnTimes) : 0;
  const maxBurn = burnTimes.length ? Math.max(...burnTimes) : 200;
  return { scents, waxTypes, minBurn, maxBurn };
}

function applyFilters(
  products: ProductWithVariants[],
  filters: FilterState,
): ProductWithVariants[] {
  return products.filter((p) => {
    // Search query — matches name, scentProfile, description (case-insensitive)
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      const matches =
        p.name.toLowerCase().includes(q) ||
        p.scentProfile.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q);
      if (!matches) return false;
    }

    // Scent profile filter
    if (filters.scent && p.scentProfile.toLowerCase() !== filters.scent.toLowerCase()) {
      return false;
    }

    // Wax type filter
    if (filters.waxType && p.waxType.toLowerCase() !== filters.waxType.toLowerCase()) {
      return false;
    }

    // Burn time range filter
    if (filters.burnTimeRange) {
      const [min, max] = filters.burnTimeRange;
      if (p.burnTimeHours < min || p.burnTimeHours > max) return false;
    }

    return true;
  });
}

const EMPTY_FILTERS: FilterState = {
  scent: null,
  waxType: null,
  burnTimeRange: null,
  searchQuery: '',
};

function hasActiveFilters(filters: FilterState): boolean {
  return (
    filters.scent !== null ||
    filters.waxType !== null ||
    filters.burnTimeRange !== null ||
    filters.searchQuery.trim() !== ''
  );
}

// ─── Sub-components ───────────────────────────────────────────────

interface ChipGroupProps {
  label: string;
  options: string[];
  selected: string | null;
  onSelect: (value: string | null) => void;
}

function ChipGroup({ label, options, selected, onSelect }: ChipGroupProps) {
  return (
    <fieldset>
      <legend className="text-xs font-semibold uppercase tracking-wider text-[var(--theme-accent)]/60 mb-2">
        {label}
      </legend>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map((opt) => {
          const isSelected = selected?.toLowerCase() === opt.toLowerCase();
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onSelect(isSelected ? null : opt)}
              aria-pressed={isSelected}
              className={[
                'px-3 py-1 rounded-full text-sm font-medium capitalize',
                'border transition-all duration-150',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-accent)]',
                isSelected
                  ? 'bg-[var(--theme-accent)] text-white border-[var(--theme-accent)]'
                  : 'bg-transparent text-[var(--theme-accent)]/70 border-[var(--theme-accent)]/30 hover:border-[var(--theme-accent)]/60 hover:text-[var(--theme-accent)]',
              ].join(' ')}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

// ─── FilterPanel ──────────────────────────────────────────────────

export function FilterPanel({ allProducts, onFilteredProducts, onReset, onScentChange }: FilterPanelProps) {
  // Derive unique option lists from the full product set (memoised)
  const { scents, waxTypes, minBurn, maxBurn } = useMemo(
    () => deriveOptions(allProducts),
    [allProducts],
  );

  // Initialise filters with the burn time range derived from products
  const [filters, setFilters] = useState<FilterState>(() => ({
    ...EMPTY_FILTERS,
    burnTimeRange: minBurn !== maxBurn ? [minBurn, maxBurn] : null,
  }));

  // Apply filters and emit results whenever filters or products change.
  // useMemo keeps this synchronous so results are available within the same
  // render cycle — well within the 300ms requirement.
  const filtered = useMemo(
    () => applyFilters(allProducts, filters),
    [allProducts, filters],
  );

  useEffect(() => {
    onFilteredProducts(filtered);
  }, [filtered, onFilteredProducts]);

  const handleReset = useCallback(() => {
    setFilters({ ...EMPTY_FILTERS, burnTimeRange: [minBurn, maxBurn] });
    onScentChange?.(null);
    onReset?.();
  }, [minBurn, maxBurn, onReset, onScentChange]);

  const isActive = hasActiveFilters(filters);

  return (
    <aside
      className="flex flex-col gap-5 p-5 rounded-2xl border border-[var(--theme-accent)]/20 bg-[var(--theme-accent)]/5"
      aria-label="Product filters"
    >
      {/* Search */}
      <div>
        <label
          htmlFor="product-search"
          className="text-xs font-semibold uppercase tracking-wider text-[var(--theme-accent)]/60 mb-2 block"
        >
          Search
        </label>
        <div className="relative">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-accent)]/40 pointer-events-none"
            aria-hidden="true"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
          <input
            id="product-search"
            type="search"
            value={filters.searchQuery}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))
            }
            placeholder="Search candles…"
            className={[
              'w-full pl-9 pr-4 py-2 rounded-lg text-sm',
              'bg-[var(--theme-bg)] text-[var(--theme-accent)]',
              'border border-[var(--theme-accent)]/30',
              'placeholder:text-[var(--theme-accent)]/40',
              'focus:outline-none focus:border-[var(--theme-accent)]/70',
              'focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]/40',
              'transition-colors duration-150',
            ].join(' ')}
            aria-label="Search products by name, scent, or description"
          />
        </div>
      </div>

      {/* Scent profile chips */}
      {scents.length > 0 && (
        <ChipGroup
          label="Scent"
          options={scents}
          selected={filters.scent}
          onSelect={(val) => {
            setFilters((prev) => ({ ...prev, scent: val }));
            onScentChange?.(val);
          }}
        />
      )}

      {/* Wax type chips */}
      {waxTypes.length > 0 && (
        <ChipGroup
          label="Wax type"
          options={waxTypes}
          selected={filters.waxType}
          onSelect={(val) => setFilters((prev) => ({ ...prev, waxType: val }))}
        />
      )}

      {/* Burn time range */}
      {minBurn !== maxBurn && (
        <fieldset>
          <legend className="text-xs font-semibold uppercase tracking-wider text-[var(--theme-accent)]/60 mb-2">
            Burn time
          </legend>
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <label
                htmlFor="burn-min"
                className="text-xs text-[var(--theme-accent)]/50"
              >
                Min ({filters.burnTimeRange?.[0] ?? minBurn}h)
              </label>
              <input
                id="burn-min"
                type="range"
                min={minBurn}
                max={maxBurn}
                step={1}
                value={filters.burnTimeRange?.[0] ?? minBurn}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setFilters((prev) => ({
                    ...prev,
                    burnTimeRange: [val, Math.max(val, prev.burnTimeRange?.[1] ?? maxBurn)],
                  }));
                }}
                className="w-full accent-[var(--theme-accent)] cursor-pointer"
                aria-label={`Minimum burn time: ${filters.burnTimeRange?.[0] ?? minBurn} hours`}
              />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label
                htmlFor="burn-max"
                className="text-xs text-[var(--theme-accent)]/50"
              >
                Max ({filters.burnTimeRange?.[1] ?? maxBurn}h)
              </label>
              <input
                id="burn-max"
                type="range"
                min={minBurn}
                max={maxBurn}
                step={1}
                value={filters.burnTimeRange?.[1] ?? maxBurn}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setFilters((prev) => ({
                    ...prev,
                    burnTimeRange: [Math.min(prev.burnTimeRange?.[0] ?? minBurn, val), val],
                  }));
                }}
                className="w-full accent-[var(--theme-accent)] cursor-pointer"
                aria-label={`Maximum burn time: ${filters.burnTimeRange?.[1] ?? maxBurn} hours`}
              />
            </div>
          </div>
        </fieldset>
      )}

      {/* Active filter count + reset */}
      {isActive && (
        <div className="pt-1 border-t border-[var(--theme-accent)]/15">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            fullWidth
            aria-label="Clear all active filters"
          >
            Clear filters
          </Button>
        </div>
      )}
    </aside>
  );
}
