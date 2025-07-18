export type Client = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  vat?: string;
  address?: string;
};

export type CompanyDetails = {
  id: string;
  name: string;
  email?: string;
  address?: string;
  logo?: string | null;
};

export type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  total: number;
};

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

export type Invoice = {
  id: string;
  invoice_number: string;
  date: string;
  due_date: string;
  status: InvoiceStatus;
  currency: string;
  tax_rate: number;
  client: Client;
  company: CompanyDetails;
  items: InvoiceItem[];
  notes?: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  created_at: string;
};