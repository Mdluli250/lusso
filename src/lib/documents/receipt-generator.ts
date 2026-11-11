/**
 * Receipt PDF generator — Vercel-safe.
 *
 * Uses pdf-lib which is pure JavaScript with no filesystem dependencies.
 * pdfkit was replaced because it requires reading font .afm files from disk
 * at runtime, which fails on Vercel's read-only serverless filesystem.
 */
import { PDFDocument, StandardFonts, rgb, PageSizes } from 'pdf-lib';
import type { ReceiptData } from './types';
import { formatZARForDocument } from './format';

// ── Brand colours (sRGB 0–1) ────────────────────────────────────────────────
const CHARCOAL  = rgb(0.102, 0.071, 0.031);
const CREAM     = rgb(0.976, 0.965, 0.949);
const GOLD      = rgb(0.784, 0.725, 0.604);
const MUTED     = rgb(0.541, 0.482, 0.431);
const ROW_TINT  = rgb(0.961, 0.941, 0.922);
const RULE      = rgb(0.910, 0.878, 0.847);
const TEXT_DARK = rgb(0.176, 0.122, 0.055);
const SUCCESS   = rgb(0.133, 0.525, 0.227); // #22863a
const SUCCESS_BG = rgb(0.929, 0.980, 0.953); // #edfaf3

/**
 * Generates a receipt PDF and returns it as a Uint8Array.
 * Fully in-memory — no filesystem access.
 */
export async function generateReceiptPDF(data: ReceiptData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page   = pdfDoc.addPage(PageSizes.A4);
  const { width, height } = page.getSize();

  const bold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const LM = 50;
  const RM = 50;
  const UW = width - LM - RM;

  // ── Header bar ────────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: CHARCOAL });

  page.drawText('LUSSO', { x: LM, y: height - 46, font: bold, size: 26, color: CREAM });
  page.drawText('HAND-POURED LUXURY CANDLES', { x: LM, y: height - 60, font: regular, size: 9, color: GOLD });
  page.drawText('support@lusso.co.za  ·  lusso.co.za', { x: LM, y: height - 72, font: regular, size: 9, color: GOLD });

  // ── Receipt title + meta ──────────────────────────────────────────────────
  const metaY = height - 112;

  page.drawText('RECEIPT', { x: LM, y: metaY, font: bold, size: 20, color: CHARCOAL });

  const receiptNo = data.orderId.slice(0, 8).toUpperCase();
  const dateStr   = data.receiptDate.toLocaleDateString('en-ZA', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  page.drawText(`Receipt No: ${receiptNo}`, { x: LM, y: metaY - 24, font: regular, size: 9, color: MUTED });
  page.drawText(`Date: ${dateStr}`,          { x: LM, y: metaY - 36, font: regular, size: 9, color: MUTED });

  // Customer block (right side)
  page.drawText('CUSTOMER',         { x: 350, y: metaY,      font: bold,    size: 9, color: CHARCOAL });
  page.drawText(data.customerName,  { x: 350, y: metaY - 14, font: regular, size: 9, color: MUTED });
  page.drawText(data.customerEmail, { x: 350, y: metaY - 26, font: regular, size: 9, color: MUTED });

  // ── Horizontal rule ───────────────────────────────────────────────────────
  const ruleY = metaY - 68;
  page.drawLine({
    start: { x: LM, y: ruleY }, end: { x: width - RM, y: ruleY },
    thickness: 0.5, color: RULE,
  });

  // ── Table header ──────────────────────────────────────────────────────────
  const colProduct = LM;
  const colQty     = 320;
  const colUnit    = 390;
  const colTotal   = 470;
  const headerY    = ruleY - 24;

  page.drawRectangle({ x: LM, y: headerY - 4, width: UW, height: 18, color: ROW_TINT });

  const headers: [string, number][] = [
    ['PRODUCT',    colProduct],
    ['QTY',        colQty],
    ['UNIT PRICE', colUnit],
    ['TOTAL',      colTotal],
  ];
  for (const [label, x] of headers) {
    page.drawText(label, { x, y: headerY + 2, font: bold, size: 8.5, color: CHARCOAL });
  }

  // ── Line items ────────────────────────────────────────────────────────────
  let rowY = headerY - 20;

  for (const item of data.items) {
    const lineTotal = item.quantity * item.unitPriceCents;

    page.drawText(item.name,                                { x: colProduct, y: rowY, font: regular, size: 9, color: TEXT_DARK, maxWidth: 265 });
    page.drawText(String(item.quantity),                    { x: colQty,     y: rowY, font: regular, size: 9, color: TEXT_DARK });
    page.drawText(formatZARForDocument(item.unitPriceCents),{ x: colUnit,    y: rowY, font: regular, size: 9, color: TEXT_DARK });
    page.drawText(formatZARForDocument(lineTotal),          { x: colTotal,   y: rowY, font: regular, size: 9, color: TEXT_DARK });

    rowY -= 4;
    page.drawLine({ start: { x: LM, y: rowY }, end: { x: width - RM, y: rowY }, thickness: 0.3, color: RULE });
    rowY -= 14;
  }

  // ── Totals ────────────────────────────────────────────────────────────────
  rowY -= 8;

  if (data.shippingCents !== undefined) {
    page.drawText('Shipping:', { x: colUnit, y: rowY, font: regular, size: 9, color: MUTED });
    page.drawText(
      data.shippingCents === 0 ? 'Free' : formatZARForDocument(data.shippingCents),
      { x: colTotal, y: rowY, font: regular, size: 9, color: MUTED }
    );
    rowY -= 16;
  }

  // Total row
  const totalBoxW = UW - (colUnit - LM - 8);
  page.drawRectangle({ x: colUnit - 8, y: rowY - 6, width: totalBoxW, height: 22, color: CHARCOAL });
  page.drawText('TOTAL PAID', { x: colUnit, y: rowY + 2, font: bold, size: 10, color: CREAM });
  page.drawText(formatZARForDocument(data.totalCents), { x: colTotal, y: rowY + 2, font: bold, size: 10, color: CREAM });

  // ── Payment confirmed badge ───────────────────────────────────────────────
  rowY -= 48;
  page.drawRectangle({ x: LM, y: rowY, width: UW, height: 32, color: SUCCESS_BG });
  page.drawText('Payment confirmed', {
    x: LM + UW / 2 - 50, y: rowY + 10, font: bold, size: 12, color: SUCCESS,
  });

  // ── Footer ────────────────────────────────────────────────────────────────
  page.drawText('Thank you for shopping with Lusso.', {
    x: LM, y: 48, font: regular, size: 8.5, color: MUTED, maxWidth: UW,
  });
  page.drawText('Keep this receipt for your records.  support@lusso.co.za', {
    x: LM, y: 36, font: regular, size: 8.5, color: MUTED, maxWidth: UW,
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

/**
 * No-op legacy wrapper — filesystem writes are not possible on Vercel.
 * @deprecated
 */
export async function generateReceipt(_data: ReceiptData): Promise<string> {
  return '';
}
