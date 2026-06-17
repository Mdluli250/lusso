'use client';

import { useEffect } from 'react';

/**
 * React hook that previously animated the global CSS color theme on scent change.
 * 
 * Disabled as part of the luxury rebrand — the site now maintains a consistent
 * cream/charcoal palette. The scent color is still available via the variant's
 * `colorHex` property for use in product-specific UI elements (badges, accents).
 *
 * @param _colorHex - Unused. Kept for API compatibility.
 */
export function useColorTheme(_colorHex: string | null): void {
  // No-op: global theme no longer changes per scent.
  // Product-specific color accents are handled locally via variant.colorHex.
}
