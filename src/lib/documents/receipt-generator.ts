import PDFDocument from 'pdfkit';
import { createWriteStream } from 'fs';
import path from 'path';
import { ReceiptData } from './types';
import { formatZARForDocument } from './format';
import { buildDocumentPath, ensureStorageDirectory, getStorageBasePath } from './storage';

/**
 * Generate a receipt PDF and write it to the filesystem.
 * Returns the relative file path of the generated PDF, or empty string on failure.
 */
export async function generateReceipt(data: ReceiptData): Promise<string> {
  try {
    const relativePath = buildDocumentPath('receipts', data.orderId);
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
      doc.fontSize(22).font('Helvetica-Bold').text('Lusso', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').text('Hand-Poured Luxury Candles', { align: 'center' });
      doc.moveDown(1.5);

      // Receipt title
      doc.fontSize(16).font('Helvetica-Bold').text('RECEIPT', { align: 'center' });
      doc.moveDown(1);

      // Receipt details
      doc.fontSize(10).font('Helvetica');
      doc.text(`Receipt Number: ${data.orderId}`);
      doc.text(`Receipt Date: ${data.receiptDate.toLocaleDateString('en-ZA')}`);
      doc.moveDown(0.5);
      doc.text(`Customer: ${data.customerName}`);
      doc.text(`Email: ${data.customerEmail}`);
      doc.moveDown(1.5);

      // Line items header
      const tableTop = doc.y;
      const col1 = 50;   // Product
      const col2 = 300;  // Qty
      const col3 = 370;  // Unit Price

      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Product', col1, tableTop);
      doc.text('Qty', col2, tableTop);
      doc.text('Unit Price', col3, tableTop);

      // Divider
      doc.moveTo(col1, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      // Line items
      let y = tableTop + 25;
      doc.font('Helvetica');

      for (const item of data.items) {
        doc.text(item.name, col1, y, { width: 240 });
        doc.text(String(item.quantity), col2, y);
        doc.text(formatZARForDocument(item.unitPriceCents), col3, y);
        y += 20;
      }

      // Divider before total
      doc.moveTo(col1, y + 5).lineTo(550, y + 5).stroke();
      y += 15;

      // Total
      doc.font('Helvetica-Bold');
      doc.text('Total:', col2, y);
      doc.text(formatZARForDocument(data.totalCents), col3, y);
      y += 30;

      // Payment confirmed indicator
      doc.fontSize(14).font('Helvetica-Bold');
      doc.text('\u2713 Payment Confirmed', 50, y, { align: 'center' });

      // Footer
      doc.moveDown(3);
      doc.fontSize(9).font('Helvetica').text('Thank you for shopping with Lusso!', { align: 'center' });

      doc.end();
    });
  } catch (error) {
    console.error(`[ReceiptGenerator] Failed to generate receipt for order ${data.orderId}:`, error);
    return '';
  }
}
