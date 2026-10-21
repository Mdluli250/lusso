import { prisma } from '@/lib/prisma';
import { ShippingRateForm } from './ShippingRateForm';

export default async function AdminShippingPage() {
  const rows = await prisma.contentBlock.findMany({
    where: { key: { in: ['shipping.standard_rate_cents', 'shipping.free_threshold_cents'] } },
    select: { key: true, value: true },
  }).catch(() => []);

  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  const standardRate = parseInt(map['shipping.standard_rate_cents'] ?? '') || 7500;
  const freeThreshold = parseInt(map['shipping.free_threshold_cents'] ?? '') || 75000;

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Shipping Rates</h1>
        <p className="text-muted text-sm mt-1">Configure standard shipping cost and the free-shipping threshold.</p>
      </div>
      <ShippingRateForm standardRate={standardRate} freeThreshold={freeThreshold} />
    </div>
  );
}
