/**
 * Document storage utilities.
 *
 * NOTE: On Vercel (and other serverless platforms) the filesystem is read-only
 * and ephemeral. PDF generation is done entirely in-memory using pdf-lib and
 * served on demand via the API routes. No files are written to disk.
 *
 * These helpers are kept for local development only where DOCUMENT_STORAGE_PATH
 * is configured and a writable filesystem is available.
 */

import path from 'path';

/**
 * Get the base storage directory for documents.
 * Only meaningful in local development — not used on Vercel.
 */
export function getStorageBasePath(): string {
  return process.env.DOCUMENT_STORAGE_PATH || './storage/documents';
}

/**
 * Build the relative file path for a document.
 * Pattern: {type}/{orderId}.pdf
 */
export function buildDocumentPath(type: 'invoices' | 'receipts', orderId: string): string {
  return path.join(type, `${orderId}.pdf`);
}
