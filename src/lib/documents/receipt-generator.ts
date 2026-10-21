import PDFDocument from 'pdfkit';
import { ReceiptData } from './types';
import { formatZARForDocument } from './format';

/**
 * Generate a receipt PDF and return it as a Buffer.
 * Buffer-based — no filesystem writes — safe for serverless environments (Vercel).
 */
export async function generateReceiptPDF(data: ReceiptData): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const BRAND_COLOR = '#1a1208';
    const MUTED = '#8a7b6e';
    const PAGE_WIDTH = doc.page.width - 100;

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

    // ── Receipt label ─────────────────────────────────────────────
    const metaY = 106;
    doc.fillColor(BRAND_COLOR).fontSize(20).font('Helvetica-Bold')
      .text('RECEIPT', 50, metaY);

    doc.fillColor(MUTED).fontSize(9).font('Helvetica')
      .text(`Receipt No: ${data.orderId.slice(0, 8).toUpperCase()}`, 50, metaY + 28)
      .text(`Date: ${data.receiptDate.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}`, 50, metaY + 40);

    // Customer info
    doc.fillColor(BRAND_COLOR).fontSize(9).font('Helvetica-Bold')
      .text('CUSTOMER', 350, metaY, { width: 200 });
    doc.fillColor(MUTED).fontSize(9).font('Helvetica')
      .text(data.customerName, 350, metaY + 14, { width: 200 })
      .text(data.customerEmail, 350, metaY + 26, { width: 200 });

    // ── Divider ───────────────────────────────────────────────────
    const divY = metaY + 70;
    doc.moveTo(50, divY).lineTo(doc.page.width - 50, divY)
      .strokeColor('#e8e0d8').lineWidth(1).stroke();

    // ── Table header ──────────────────────────────────────────────
    const COL = { product: 50, qty: 320, unit: 390, total: 470 };
    const headerY = divY + 14;

    doc.rect(50, headerY - 4, PAGE_WIDTH, 20).fill('#f5f0eb');
    doc.fillColor(BRAND_COLOR).fontSize(8.5).font('Helvetica-Bold')
      .text('PRODUCT',    COL.product, headerY, { width: 265 })
      .text('QTY',        COL.qty,     headerY, { width: 65 })
      .text('UNIT PRICE', COL.unit,    headerY, { width: 75 })
      .text('TOTAL',      COL.total,   headerY, { width: 75 });

    // ── Line items ────────────────────────────────────────────────
    let y = headerY + 26;
    doc.font('Helvetica').fontSize(9);

    for (const item of data.items) {
      const lineTotal = item.quantity * item.unitPriceCents;

      doc.fillColor('#2d1f0e')
        .text(item.name,                                 COL.product, y, { width: 265 })
        .text(String(item.quantity),                     COL.qty,     y, { width: 65 })
        .text(formatZARForDocument(item.unitPriceCents), COL.unit,    y, { width: 75 })
        .text(formatZARForDocument(lineTotal),           COL.total,   y, { width: 75 });

      y += 20;

      doc.moveTo(50, y - 4).lineTo(doc.page.width - 50, y - 4)
        .strokeColor('#f0ebe4').lineWidth(0.5).stroke();
    }

    // ── Totals block ──────────────────────────────────────────────
    y += 10;
    const totalsX = COL.unit;
    const valX = COL.total;

    if (data.shippingCents !== undefined) {
      doc.fillColor(MUTED).fontSize(9).font('Helvetica')
        .text('Shipping:', totalsX, y, { width: 75 })
        .text(data.shippingCents === 0 ? 'Free' : formatZARForDocument(data.shippingCents), valX, y, { width: 75 });
      y += 16;
    }

    doc.rect(totalsX - 8, y - 4, PAGE_WIDTH - (totalsX - 58), 24).fill(BRAND_COLOR);
    doc.fillColor('#f9f6f2').fontSize(10).font('Helvetica-Bold')
      .text('TOTAL PAID', totalsX, y, { width: 75 })
      .text(formatZARForDocument(data.totalCents), valX, y, { width: 75 });

    // ── Payment confirmed badge ───────────────────────────────────
    y += 40;
    doc.rect(50, y, PAGE_WIDTH, 36).fill('#edfaf3');
    doc.fillColor('#22863a').fontSize(12).font('Helvetica-Bold')
      .text('✓  Payment confirmed', 50, y + 10, { width: PAGE_WIDTH, align: 'center' });

    // ── Footer ────────────────────────────────────────────────────
    doc.fillColor(MUTED).fontSize(8.5).font('Helvetica')
      .text('Thank you for shopping with Lusso.', 50, doc.page.height - 60,
            { width: PAGE_WIDTH, align: 'center' })
      .text('Keep this receipt for your records.  support@lusso.co.za', 50, doc.page.height - 46,
            { width: PAGE_WIDTH, align: 'center' });

    doc.end();
  });
}

/**
 * Legacy file-based wrapper — kept for the PayFast webhook.
 */
export async function generateReceipt(data: ReceiptData): Promise<string> {
  try {
    const { mkdir } = await import('fs/promises');
    const path = await import('path');
    const { buildDocumentPath, getStorageBasePath } = await import('./storage');

    const relativePath = buildDocumentPath('receipts', data.orderId);
    const basePath = getStorageBasePath();
    const fullPath = path.resolve(basePath, relativePath);
    await mkdir(path.dirname(fullPath), { recursive: true });

    const buffer = await generateReceiptPDF(data);
    await import('fs/promises').then((fs) => fs.writeFile(fullPath, buffer));
    return relativePath;
  } catch {
    return '';
  }
}
