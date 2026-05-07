import { describe, it, expect } from 'vitest';
import { formatZARForDocument } from '../format';

describe('formatZARForDocument', () => {
  it('should format 0 cents', () => {
    const result = formatZARForDocument(0);
    expect(result).toContain('0');
    expect(result).toContain('R');
  });

  it('should format typical price (34900 cents = R349.00)', () => {
    const result = formatZARForDocument(34900);
    expect(result).toContain('349');
    expect(result).toContain('R');
  });

  it('should format large price (1250000 cents = R12,500.00)', () => {
    const result = formatZARForDocument(1250000);
    expect(result).toContain('12');
    expect(result).toContain('500');
    expect(result).toContain('R');
  });

  it('should include two decimal places', () => {
    const result = formatZARForDocument(100);
    // Should contain "1.00" or "1,00" depending on locale
    expect(result).toMatch(/1[.,]00/);
  });
});
