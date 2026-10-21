import PDFDocument from 'pdfkit';
import { InvoiceData } from './types';
import { formatZARForDocument } from './format';

/**
 * Generate an invoice PDF and return it as a Buffer.
 * Buffer-based — no filesystem writes — safe for serverless environments (Vercel).
 */
export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const BRAND_COLOR = '#1a1208';
    const MUTED = '#8a7b6e';
    const PAGE_WIDTH = doc.page.width - 100; // usable width with margins

    // ── Header ────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 80).fill(BRAND_COLOR);
    doc.fillColor('#f9f6f2')
      .fontSize(26).font('Helvetica-Bold')
      .text('LUSSO', 50, 22, { width: PAGE_WIDTH, align: 'left' });
    doc.fillColor('#c8b99a')
      .fontSize(9).font('Helvetica')
      .text('HAND-POURED LUXURY CANDLES', 50, 52, { width: PAGE_WIDTH, align: 'left' });
    doc.fillColor('#c8b99a')
      .fontSize(9)
      .text('support@lusso.co.za  ·  lusso.co.za', 50, 64, { width: PAGE_WIDTH, align: 'right' });

    doc.moveDown(3);

    // ── Invoice label + meta ──────────────────────────────────────
    const metaY = 100;
    doc.fillColor(BRAND_COLOR).fontSize(20).font('Helvetica-Bold')
      .text('INVOICE', 50, metaY);

    doc.fillColor(MUTED).fontSize(9).font('Helvetica')
      .text(`Invoice No: ${data.orderId.slice(0, 8).toUpperCase()}`, 50, metaY + 28)
      .text(`Date: ${data.invoiceDate.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}`, 50, metaY + 40);

    // Bill to (right-aligned block)
    doc.fillColor(BRAND_COLOR).fontSize(9).font('Helvetica-Bold')
      .text('BILL TO', 350, metaY, { width: 200 });
    doc.fillColor(MUTED).fontSize(9).font('Helvetica')
      .text(data.customerName, 350, metaY + 14, { width: 200 })
      .text(data.customerEmail, 350, metaY + 26, { width: 200 });

    // ── Divider ───────────────────────────────────────────────────
    const divY = metaY + 70;
    doc.moveTo(50, divY).lineTo(doc.page.width - 50, divY)
      .strokeColor('#e8e0d8').lineWidth(1).stroke();

    // ── Items table header ────────────────────────────────────────
    const COL = { product: 50, scent: 230, qty: 330, unit: 390, total: 470 };
    const headerY = divY + 14;

    doc.rect(50, headerY - 4, PAGE_WIDTH, 20).fill('#f5f0eb');
    doc.fillColor(BRAND_COLOR).fontSize(8.5).font('Helvetica-Bold')
      .text('PRODUCT',    COL.product, headerY, { width: 175 })
      .text('SCENT',      COL.scent,   headerY, { width: 95 })
      .text('QTY',        COL.qty,     headerY, { width: 55 })
      .text('UNIT PRICE', COL.unit,    headerY, { width: 75 })
      .text('TOTAL',      COL.total,   headerY, { width: 75 });

    // ── Line items ────────────────────────────────────────────────
    let y = headerY + 26;
    doc.font('Helvetica').fontSize(9);

    for (const item of data.items) {
      const lineTotal = item.quantity * item.unitPriceCents;

      doc.fillColor('#2d1f0e')
        .text(item.name,                              COL.product, y, { width: 175 })
        .text(item.scent ?? '—',                      COL.scent,   y, { width: 95 })
        .text(String(item.quantity),                  COL.qty,     y, { width: 55 })
        .text(formatZARForDocument(item.unitPriceCents), COL.unit,  y, { width: 75 })
        .text(formatZARForDocument(lineTotal),        COL.total,   y, { width: 75 });

      y += 20;

      // Light row divider
      doc.moveTo(50, y - 4).lineTo(doc.page.width - 50, y - 4)
        .strokeColor('#f0ebe4').lineWidth(0.5).stroke();
    }

    // ── Totals block ──────────────────────────────────────────────
    y += 10;
    const totalsX = COL.unit;
    const valX = COL.total;

    doc.fillColor(MUTED).fontSize(9).font('Helvetica')
      .text('Subtotal:', totalsX, y, { width: 75 })
      .text(formatZARForDocument(data.subtotalCents), valX, y, { width: 75 });
    y += 16;

    if (data.shippingCents && data.shippingCents > 0) {
      doc.text('Shipping:', totalsX, y, { width: 75 })
        .text(formatZARForDocument(data.shippingCents), valX, y, { width: 75 });
      y += 16;
    } else if (data.shippingCents === 0) {
      doc.text('Shipping:', totalsX, y, { width: 75 })
        .text('Free', valX, y, { width: 75 });
      y += 16;
    }

    // Total row with background
    doc.rect(totalsX - 8, y - 4, PAGE_WIDTH - (totalsX - 58), 24).fill(BRAND_COLOR);
    doc.fillColor('#f9f6f2').fontSize(10).font('Helvetica-Bold')
      .text('TOTAL', totalsX, y, { width: 75 })
      .text(formatZARForDocument(data.totalCents), valX, y, { width: 75 });

    // ── Footer ────────────────────────────────────────────────────
    doc.fillColor(MUTED).fontSize(8.5).font('Helvetica')
      .text('Thank you for your order.', 50, doc.page.height - 60,
            { width: PAGE_WIDTH, align: 'center' })
      .text('Questions? contact support@lusso.co.za', 50, doc.page.height - 46,
            { width: PAGE_WIDTH, align: 'center' });

    doc.end();
  });
}

/**
 * Legacy file-based wrapper kept for the PayFast webhook which writes to disk.
 * On Vercel this will silently fail and return '' — the API route falls back to
 * on-demand generation, so this is acceptable.
 */
export async function generateInvoice(data: InvoiceData): Promise<string> {
  try {
    const { createWriteStream } = await import('fs');
    const { mkdir } = await import('fs/promises');
    const path = await import('path');
    const { buildDocumentPath, getStorageBasePath } = await import('./storage');

    const relativePath = buildDocumentPath('invoices', data.orderId);
    const basePath = getStorageBasePath();
    const fullPath = path.resolve(basePath, relativePath);
    const dirPath = path.dirname(fullPath);

    await mkdir(dirPath, { recursive: true });

    const buffer = await generateInvoicePDF(data);
    await import('fs/promises').then((fs) => fs.writeFile(fullPath, buffer));
    return relativePath;
  } catch {
    return '';
  }
}
