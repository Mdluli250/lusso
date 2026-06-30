// Feature: cms-content-management, Property 9: updatedAt timestamp format is always human-readable

/**
 * Property-based test for the `formatUpdatedAt` helper function.
 *
 * Property 9 – updatedAt timestamp format is always human-readable
 *   For any valid Date d, formatUpdatedAt(d) SHALL produce a string matching
 *   the pattern "D Mon YYYY, HH:MM" where D is day (no leading zero), Mon is
 *   a 3-letter month abbreviation, YYYY is a 4-digit year, HH is 24h hour
 *   (zero-padded), and MM is minutes (zero-padded).
 *
 * **Validates: Requirements 10.3**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { formatUpdatedAt } from '../ContentBlockRow';

// ─── Valid month abbreviations ───────────────────────────────────────────────
const VALID_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// ─── Pattern: "D Mon YYYY, HH:MM" ──────────────────────────────────────────
// D = 1-2 digit day (no leading zero), Mon = 3-letter abbr, YYYY = 4-digit year,
// HH = 2-digit hour, MM = 2-digit minute
const FORMAT_REGEX = /^\d{1,2} [A-Z][a-z]{2} \d{4}, \d{2}:\d{2}$/;

// ─── Date arbitrary that only produces valid dates in [2000, 2100] ───────────
const validDateArb = fc.date({
  min: new Date('2000-01-01T00:00:00.000Z'),
  max: new Date('2100-12-31T23:59:59.999Z'),
}).filter((d) => !isNaN(d.getTime()));

describe('Property 9: updatedAt timestamp format is always human-readable', () => {
  // Feature: cms-content-management, Property 9: updatedAt timestamp format is always human-readable
  // **Validates: Requirements 10.3**

  it('produces a string matching "D Mon YYYY, HH:MM" for any Date in [2000, 2100]', async () => {
    await fc.assert(
      fc.asyncProperty(validDateArb, async (date) => {
        const result = formatUpdatedAt(date);

        // Must match the overall pattern
        expect(result).toMatch(FORMAT_REGEX);
      }),
      { numRuns: 200 },
    );
  });

  it('uses a valid 3-letter English month abbreviation', async () => {
    await fc.assert(
      fc.asyncProperty(validDateArb, async (date) => {
        const result = formatUpdatedAt(date);

        // Extract the month abbreviation (second token)
        const parts = result.split(' ');
        const month = parts[1];

        expect(VALID_MONTHS).toContain(month);
      }),
      { numRuns: 200 },
    );
  });

  it('has a year that matches the local year of the input date', async () => {
    await fc.assert(
      fc.asyncProperty(validDateArb, async (date) => {
        const result = formatUpdatedAt(date);

        // Extract the year (third token, before the comma)
        const parts = result.split(' ');
        const yearStr = parts[2].replace(',', '');
        const year = parseInt(yearStr, 10);

        // The formatted year must match the date's local year
        expect(year).toBe(date.getFullYear());
        // And it must be a 4-digit year (reasonable range)
        expect(yearStr).toHaveLength(4);
      }),
      { numRuns: 200 },
    );
  });

  it('day, hour, minute, and month match the input Date values', async () => {
    await fc.assert(
      fc.asyncProperty(validDateArb, async (date) => {
        const result = formatUpdatedAt(date);

        // Parse out the components from the formatted string
        const parts = result.split(' ');
        const day = parseInt(parts[0], 10);
        const month = parts[1];
        const year = parseInt(parts[2].replace(',', ''), 10);
        const [hh, mm] = parts[3].split(':').map(Number);

        // Verify each component matches the source Date
        expect(day).toBe(date.getDate());
        expect(month).toBe(VALID_MONTHS[date.getMonth()]);
        expect(year).toBe(date.getFullYear());
        expect(hh).toBe(date.getHours());
        expect(mm).toBe(date.getMinutes());
      }),
      { numRuns: 200 },
    );
  });

  it('produces the expected output for known dates', () => {
    // Known examples to verify specific formatting behavior
    expect(formatUpdatedAt(new Date(2025, 6, 14, 10, 32))).toBe('14 Jul 2025, 10:32');
    expect(formatUpdatedAt(new Date(2000, 0, 1, 0, 0))).toBe('1 Jan 2000, 00:00');
    expect(formatUpdatedAt(new Date(2099, 11, 31, 23, 59))).toBe('31 Dec 2099, 23:59');
    expect(formatUpdatedAt(new Date(2024, 1, 29, 5, 7))).toBe('29 Feb 2024, 05:07');
  });
});
