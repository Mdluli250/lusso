import { describe, it, expect } from 'vitest';
import { isValidTransition, VALID_TRANSITIONS } from '../orderTransitions';
import { classifyStock, countStockStatuses } from '../stockStatus';
import { slugify } from '../slugify';
import { validateProductForm } from '../validateProduct';
import { filterProducts, sortProducts } from '../productFilters';

describe('isValidTransition', () => {
  it('should allow PENDING → PAID', () => {
    expect(isValidTransition('PENDING', 'PAID')).toBe(true);
  });

  it('should allow PENDING → FAILED', () => {
    expect(isValidTransition('PENDING', 'FAILED')).toBe(true);
  });

  it('should allow PAID → REFUNDED', () => {
    expect(isValidTransition('PAID', 'REFUNDED')).toBe(true);
  });

  it('should reject FAILED → PAID', () => {
    expect(isValidTransition('FAILED', 'PAID')).toBe(false);
  });

  it('should reject REFUNDED → anything', () => {
    expect(isValidTransition('REFUNDED', 'PAID')).toBe(false);
    expect(isValidTransition('REFUNDED', 'PENDING')).toBe(false);
  });

  it('should reject PAID → PENDING', () => {
    expect(isValidTransition('PAID', 'PENDING')).toBe(false);
  });
});

describe('classifyStock', () => {
  it('should classify 0 as out-of-stock', () => {
    expect(classifyStock(0)).toBe('out-of-stock');
  });

  it('should classify 1-4 as low-stock', () => {
    expect(classifyStock(1)).toBe('low-stock');
    expect(classifyStock(4)).toBe('low-stock');
  });

  it('should classify 5+ as in-stock', () => {
    expect(classifyStock(5)).toBe('in-stock');
    expect(classifyStock(100)).toBe('in-stock');
  });
});

describe('countStockStatuses', () => {
  it('should count out-of-stock and low-stock variants', () => {
    const variants = [
      { stock: 0 },
      { stock: 0 },
      { stock: 3 },
      { stock: 10 },
      { stock: 1 },
    ];
    const result = countStockStatuses(variants);
    expect(result.outOfStock).toBe(2);
    expect(result.lowStock).toBe(2);
  });

  it('should return zeros for empty array', () => {
    const result = countStockStatuses([]);
    expect(result.outOfStock).toBe(0);
    expect(result.lowStock).toBe(0);
  });
});

describe('slugify', () => {
  it('should convert to lowercase and replace spaces with hyphens', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('should remove special characters', () => {
    expect(slugify('Lavender & Cinnamon!')).toBe('lavender-cinnamon');
  });

  it('should trim and remove leading/trailing hyphens', () => {
    expect(slugify('  --hello--  ')).toBe('hello');
  });
});

describe('validateProductForm', () => {
  it('should return no errors for valid data', () => {
    const errors = validateProductForm({
      name: 'Test',
      slug: 'test',
      description: 'A test product',
      price: 100,
      burnTimeHours: 10,
      waxType: 'soy',
      scentProfile: 'lavender',
    });
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('should return errors for missing fields', () => {
    const errors = validateProductForm({});
    expect(errors.name).toBeDefined();
    expect(errors.slug).toBeDefined();
    expect(errors.description).toBeDefined();
    expect(errors.price).toBeDefined();
    expect(errors.burnTimeHours).toBeDefined();
    expect(errors.waxType).toBeDefined();
    expect(errors.scentProfile).toBeDefined();
  });

  it('should reject price <= 0', () => {
    const errors = validateProductForm({
      name: 'Test',
      slug: 'test',
      description: 'Desc',
      price: 0,
      burnTimeHours: 10,
      waxType: 'soy',
      scentProfile: 'lavender',
    });
    expect(errors.price).toBeDefined();
  });
});

describe('filterProducts', () => {
  const products = [
    { name: 'Lavender Candle', scentProfile: 'lavender' },
    { name: 'Cinnamon Spice', scentProfile: 'cinnamon' },
    { name: 'Vanilla Dream', scentProfile: 'vanilla' },
  ];

  it('should filter by name (case-insensitive)', () => {
    const result = filterProducts(products, 'lavender');
    expect(result).toHaveLength(1); // matches name "Lavender Candle" and scentProfile "lavender" — same product
    expect(result[0].name).toBe('Lavender Candle');
  });

  it('should filter by scentProfile', () => {
    const result = filterProducts(products, 'cinnamon');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Cinnamon Spice');
  });

  it('should return all products for empty search', () => {
    const result = filterProducts(products, '');
    expect(result).toHaveLength(3);
  });
});

describe('sortProducts', () => {
  const products = [
    { name: 'Banana', price: 300 },
    { name: 'Apple', price: 100 },
    { name: 'Cherry', price: 200 },
  ];

  it('should sort by name ascending', () => {
    const result = sortProducts(products, 'name', 'asc');
    expect(result[0].name).toBe('Apple');
    expect(result[2].name).toBe('Cherry');
  });

  it('should sort by price descending', () => {
    const result = sortProducts(products, 'price', 'desc');
    expect(result[0].price).toBe(300);
    expect(result[2].price).toBe(100);
  });
});
