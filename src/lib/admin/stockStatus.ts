export type StockStatus = 'out-of-stock' | 'low-stock' | 'in-stock';

/**
 * Classify a stock level into a status category.
 * 0 → out-of-stock, 1-4 → low-stock, 5+ → in-stock
 */
export function classifyStock(stock: number): StockStatus {
  if (stock <= 0) return 'out-of-stock';
  if (stock <= 4) return 'low-stock';
  return 'in-stock';
}

/**
 * Count how many variants are out-of-stock and low-stock.
 */
export function countStockStatuses(variants: { stock: number }[]): {
  outOfStock: number;
  lowStock: number;
} {
  let outOfStock = 0;
  let lowStock = 0;

  for (const variant of variants) {
    const status = classifyStock(variant.stock);
    if (status === 'out-of-stock') outOfStock++;
    else if (status === 'low-stock') lowStock++;
  }

  return { outOfStock, lowStock };
}
