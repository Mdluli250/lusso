import PDFDocument from 'pdfkit';
import { createWriteStream } from 'fs';
import path from 'path';
import { InvoiceData } from './types';
import { formatZARForDocument } from './format';
import { buildDocumentPath, ensureStorageDirectory, getStorageBasePath } from './storage';

/**
 * Generate an invoice PDF and write it to the filesystem.
 * Returns the relative file path of the generated PDF, or empty string on failure.
 */
export async function generateInvoice(data: InvoiceData): Promise<string> {
  try {
    const relativePath = buildDocumentPath('invoices', data.orderId);
    const basePath = getStorageBasePath();
    const fullPath = path.resolve(basePath, relativePath);
    const dirPath = path.dirname(fullPath);

    await ensureStorageDirectory(dirPath);

    return await new Promise<string>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const stream = createWriteStream(fullPath);

      stream.on('finish', () => resolve(relativePath));
      stream.on('error', reject);

      doc.pipe(stream);

      // Store branding
      doc.fontSize(24).font('Helvetica-Bold').text('Lusso', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').text('Hand-Poured Luxury Candles', { align: 'center' });
      doc.text('hello@artisancandles.co.za | www.artisancandles.co.za', { align: 'center' });
      doc.moveDown(1.5);

      // Invoice title
      doc.fontSize(18).font('Helvetica-Bold').text('INVOICE', { align: 'left' });
      doc.moveDown(0.5);

      // Invoice details
      doc.fontSize(10).font('Helvetica');
      doc.text(`Invoice Number: ${data.orderId}`);
      doc.text(`Invoice Date: ${data.invoiceDate.toLocaleDateString('en-ZA')}`);
      doc.moveDown(1);

      // Customer details
      doc.fontSize(12).font('Helvetica-Bold').text('Bill To:');
      doc.fontSize(10).font('Helvetica');
      doc.text(data.customerName);
      doc.text(data.customerEmail);
      doc.moveDown(1.5);

      // Line items table header
      const tableTop = doc.y;
      const col1 = 50;   // Product
      const col2 = 220;  // Scent
      const col3 = 320;  // Qty
      const col4 = 380;  // Unit Price
      const col5 = 470;  // Line Total

      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Product', col1, tableTop);
      doc.text('Scent', col2, tableTop);
      doc.text('Qty', col3, tableTop);
      doc.text('Unit Price', col4, tableTop);
      doc.text('Total', col5, tableTop);

      // Divider line
      doc.moveTo(col1, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      // Line items
      let y = tableTop + 25;
      doc.font('Helvetica');

      for (const item of data.items) {
        const lineTotal = item.quantity * item.unitPriceCents;

        doc.text(item.name, col1, y, { width: 160 });
        doc.text(item.scent || '-', col2, y, { width: 90 });
        doc.text(String(item.quantity), col3, y);
        doc.text(formatZARForDocument(item.unitPriceCents), col4, y);
        doc.text(formatZARForDocument(lineTotal), col5, y);

        y += 20;
      }

      // Divider line before totals
      doc.moveTo(col1, y + 5).lineTo(550, y + 5).stroke();
      y += 15;

      // Subtotal and total
      doc.font('Helvetica');
      doc.text('Subtotal:', col4, y);
      doc.text(formatZARForDocument(data.subtotalCents), col5, y);
      y += 20;

      doc.font('Helvetica-Bold');
      doc.text('Total:', col4, y);
      doc.text(formatZARForDocument(data.totalCents), col5, y);

      // Footer
      doc.moveDown(4);
      doc.fontSize(9).font('Helvetica').text('Thank you for your purchase!', { align: 'center' });

      doc.end();
    });
  } catch (error) {
    console.error(`[InvoiceGenerator] Failed to generate invoice for order ${data.orderId}:`, error);
    return '';
  }
}
