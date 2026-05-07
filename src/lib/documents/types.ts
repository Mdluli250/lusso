export interface InvoiceData {
  orderId: string;
  invoiceDate: Date;
  customerName: string;
  customerEmail: string;
  items: Array<{
    name: string;
    scent?: string;
    quantity: number;
    unitPriceCents: number;
  }>;
  subtotalCents: number;
  totalCents: number;
}

export interface ReceiptData {
  orderId: string;
  receiptDate: Date;
  customerName: string;
  customerEmail: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPriceCents: number;
  }>;
  totalCents: number;
}
