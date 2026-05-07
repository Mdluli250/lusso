import path from 'path';
import { mkdir, readFile } from 'fs/promises';

/**
 * Get the base storage directory for documents.
 * Reads from DOCUMENT_STORAGE_PATH env var, defaults to './storage/documents'.
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

/**
 * Ensure the storage directory exists, creating it recursively if needed.
 */
export async function ensureStorageDirectory(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}

/**
 * Read a document file and return it as a Buffer.
 * Throws if file does not exist.
 */
export async function readDocument(filePath: string): Promise<Buffer> {
  return readFile(filePath);
}
