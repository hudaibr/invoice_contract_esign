export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  lineItems: InvoiceLineItem[];
  taxRate: number;
  notes: string;
  paymentMethod: string;
}

export interface ContractData {
  contractNumber: string;
  date: string;
  clientName: string;
  clientEmail: string;
  clientCompany: string;
  projectTitle: string;
  scope: string;
  deliverables: string;
  timeline: string;
  price: number;
  paymentMethod: string;
  paymentTerms: string;
  revisionRounds: number;
  usageRights: string;
  additionalTerms: string;
}
