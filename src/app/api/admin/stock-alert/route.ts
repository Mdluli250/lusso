import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const LOW_STOCK_THRESHOLD = 5;

/**
 * POST /api/admin/stock-alert
 * Cron-triggered endpoint that emails admins when variants are low or out of stock.
 * Secured with CRON_SECRET header.
 */
export async function POST(request: Request): Promise<Response> {
  const secret = request.headers.get('x-cron-secret') ?? request.headers.get('authorization');
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM || !process.env.ADMIN_EMAIL) {
    return NextResponse.json({ skipped: true, reason: 'Email not configured or ADMIN_EMAIL missing' });
  }

  const lowStockVariants = await prisma.productVariant.findMany({
    where: { stock: { lte: LOW_STOCK_THRESHOLD } },
    include: { product: { select: { name: true } } },
    orderBy: { stock: 'asc' },
  });

  if (lowStockVariants.length === 0) {
    return NextResponse.json({ alerted: 0 });
  }

  const outOfStock = lowStockVariants.filter((v) => v.stock === 0);
  const lowStock = lowStockVariants.filter((v) => v.stock > 0);

  const rows = lowStockVariants
    .map((v) => `  - ${v.product.name} / ${v.scent} (${v.waxType}): ${v.stock === 0 ? 'OUT OF STOCK' : `${v.stock} left`}`)
    .join('\n');

  const subject = `[Lusso] Stock alert — ${outOfStock.length} out of stock, ${lowStock.length} low`;
  const text = `Stock Alert — ${new Date().toLocaleDateString('en-ZA')}\n\n${rows}\n\nManage inventory: ${process.env.NEXTAUTH_URL ?? 'https://lusso.co.za'}/admin/inventory`;

  const htmlRows = lowStockVariants
    .map((v) => `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;">${v.product.name} / ${v.scent}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;color:${v.stock === 0 ? '#e74c3c' : '#e67e22'};font-weight:600;">${v.stock === 0 ? 'Out of stock' : `${v.stock} left`}</td></tr>`)
    .join('');

  const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#f9f6f2;padding:32px;"><div style="max-width:500px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;"><div style="background:#1a1208;padding:20px 24px;"><span style="color:#f9f6f2;font-size:20px;font-weight:700;">LUSSO</span><span style="color:#c8b99a;font-size:12px;margin-left:12px;">Stock Alert</span></div><div style="padding:24px;"><h2 style="margin:0 0 16px;font-size:16px;color:#2d1f0e;">Inventory needs attention</h2><table style="width:100%;border-collapse:collapse;font-size:14px;"><thead><tr><th style="text-align:left;padding:6px 12px;background:#f5f0eb;color:#8a7b6e;">Variant</th><th style="text-align:left;padding:6px 12px;background:#f5f0eb;color:#8a7b6e;">Stock</th></tr></thead><tbody>${htmlRows}</tbody></table><div style="margin-top:24px;"><a href="${process.env.NEXTAUTH_URL ?? 'https://lusso.co.za'}/admin/inventory" style="background:#1a1208;color:#f9f6f2;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;">Manage inventory</a></div></div></div></body></html>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [process.env.ADMIN_EMAIL], subject, html, text }),
  });

  if (!res.ok) {
    console.error('[StockAlert] Email send failed:', await res.text());
    return NextResponse.json({ error: 'Email send failed' }, { status: 500 });
  }

  return NextResponse.json({ alerted: lowStockVariants.length, outOfStock: outOfStock.length, lowStock: lowStock.length });
}
