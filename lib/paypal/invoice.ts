import { getAccessToken, PAYPAL_API } from "./auth";
import { prisma } from "@/lib/prisma";
import { branding } from "@/lib/branding";
import type { InvoiceData } from "@/lib/types";

export interface CreatePaypalInvoiceResult {
  paypalInvoiceId: string;
  paypalLink: string;
  localInvoiceId: string;
}

async function generatePaypalInvoiceNumber(): Promise<string> {
  const token = await getAccessToken();
  const res = await fetch(`${PAYPAL_API}/v2/invoicing/generate-next-invoice-number`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ fetch_id: true }),
  });
  if (!res.ok) {
    throw new Error(`PayPal generate invoice number error (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  return data.invoice_number;
}

export async function createAndSendPaypalInvoice(
  data: InvoiceData,
  userId: string,
): Promise<CreatePaypalInvoiceResult> {
  const token = await getAccessToken();

  const [paypalInvoiceNumber] = await Promise.all([
    generatePaypalInvoiceNumber(),
  ]);

  const subtotal = data.lineItems.reduce((s, li) => s + li.quantity * li.rate, 0);

  const lineItems = data.lineItems.map((li) => ({
    name: li.description || "Service",
    quantity: String(li.quantity),
    unit_amount: { currency_code: "USD", value: li.rate.toFixed(2) },
    ...(data.taxRate > 0 ? {
      tax: {
        name: "Sales Tax",
        percent: String(data.taxRate),
      },
    } : {}),
  }));

  const invoicerName = (process.env.PAYPAL_MERCHANT_NAME || branding.agencyName).split(" ");
  const invoicePayload: Record<string, unknown> = {
    detail: {
      reference: data.invoiceNumber,
      invoice_number: paypalInvoiceNumber,
      currency_code: "USD",
      note: data.notes || undefined,
      payment_term: {
        term_type: "DUE_ON_RECEIPT",
      },
    },
    invoicer: {
      name: {
        given_name: invoicerName[0] || branding.agencyName,
        surname: invoicerName.slice(1).join(" ") || undefined,
      },
      email_address: process.env.PAYPAL_MERCHANT_EMAIL || branding.email,
      website: branding.website,
    },
    primary_recipients: [
      {
        billing_info: {
          name: { given_name: data.clientName },
          email_address: data.clientEmail,
        },
      },
    ],
    items: lineItems,
    configuration: {
      partial_payment: { allow_partial_payment: false },
      allow_tip: false,
      tax_calculated_after_discount: true,
    },
    amount: {
      breakdown: {
        item_total: { currency_code: "USD", value: subtotal.toFixed(2) },
      },
    },
  };

  if (process.env.PAYPAL_TEMPLATE_ID) {
    (invoicePayload.configuration as Record<string, unknown>).template_id = process.env.PAYPAL_TEMPLATE_ID;
  }

  // Create draft
  const createRes = await fetch(`${PAYPAL_API}/v2/invoicing/invoices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Prefer: "return=representation",
    },
    body: JSON.stringify(invoicePayload),
  });

  if (!createRes.ok) {
    throw new Error(`PayPal create invoice error (${createRes.status}): ${await createRes.text()}`);
  }

  const created = await createRes.json();
  const paypalInvoiceId = created.id ?? created.invoice_id;
  if (!paypalInvoiceId) {
    throw new Error(`PayPal create invoice response missing ID: ${JSON.stringify(created)}`);
  }
  const paypalLink = created.links?.find((l: { rel: string }) => l.rel === "self")?.href
    ?? created.href ?? created.invoice_url ?? "";

  const totalAmount = subtotal + (subtotal * data.taxRate / 100);

  // Store locally
  const localInvoice = await prisma.paypalInvoice.create({
    data: {
      userId,
      paypalInvoiceId,
      paypalInvoiceNumber,
      invoiceNumber: data.invoiceNumber,
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      totalAmount,
      currencyCode: "USD",
      status: "DRAFT",
      paypalLink,
      invoiceData: data as object,
    },
  });

  // Send the invoice
  const sendRes = await fetch(`${PAYPAL_API}/v2/invoicing/invoices/${paypalInvoiceId}/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      subject: `Invoice ${data.invoiceNumber} from ${process.env.PAYPAL_MERCHANT_NAME || branding.agencyName}`,
      note: data.notes || "Thank you for your business.",
      send_to_invoicer: true,
      send_to_recipient: true,
    }),
  });

  if (!sendRes.ok) {
    const errText = await sendRes.text();
    await prisma.paypalInvoice.update({
      where: { id: localInvoice.id },
      data: { status: "DRAFT_ERROR" },
    });
    throw new Error(`PayPal send invoice error (${sendRes.status}): ${errText}`);
  }

  await prisma.paypalInvoice.update({
    where: { id: localInvoice.id },
    data: { status: "SENT" },
  });

  return { paypalInvoiceId, paypalLink, localInvoiceId: localInvoice.id };
}

export async function getPaypalInvoiceStatus(paypalInvoiceId: string) {
  const token = await getAccessToken();
  const res = await fetch(`${PAYPAL_API}/v2/invoicing/invoices/${paypalInvoiceId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`PayPal status error (${res.status}): ${await res.text()}`);
  }

  return res.json();
}

export async function listPaypalInvoices() {
  const token = await getAccessToken();
  const res = await fetch(`${PAYPAL_API}/v2/invoicing/invoices?page=1&page_size=50&total_required=true`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`PayPal list invoices error (${res.status}): ${await res.text()}`);
  }

  return res.json();
}

export async function cancelPaypalInvoice(paypalInvoiceId: string) {
  const token = await getAccessToken();
  const res = await fetch(`${PAYPAL_API}/v2/invoicing/invoices/${paypalInvoiceId}/cancel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ send_to_invoicer: true, send_to_recipient: true }),
  });

  if (!res.ok) {
    throw new Error(`PayPal cancel invoice error (${res.status}): ${await res.text()}`);
  }

  await prisma.paypalInvoice.updateMany({
    where: { paypalInvoiceId },
    data: { status: "CANCELLED" },
  });

  return res.json();
}

export async function deletePaypalInvoice(paypalInvoiceId: string) {
  const token = await getAccessToken();
  const res = await fetch(`${PAYPAL_API}/v2/invoicing/invoices/${paypalInvoiceId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`PayPal delete invoice error (${res.status}): ${await res.text()}`);
  }

  await prisma.paypalInvoice.deleteMany({ where: { paypalInvoiceId } });
  return true;
}

export async function remindPaypalInvoice(paypalInvoiceId: string) {
  const token = await getAccessToken();
  const res = await fetch(`${PAYPAL_API}/v2/invoicing/invoices/${paypalInvoiceId}/remind`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ send_to_invoicer: true }),
  });

  if (!res.ok) {
    throw new Error(`PayPal remind invoice error (${res.status}): ${await res.text()}`);
  }

  return res.json();
}

export async function setupPaypalReminders() {
  const token = await getAccessToken();
  const res = await fetch(`${PAYPAL_API}/v2/invoicing/setup-reminders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      configurations: [
        { type: "BEFORE_DUE", interval: { unit: "DAY", value: 2 }, repetition: 1, notification: { send_to_invoicer: false } },
        { type: "AFTER_DUE", interval: { unit: "DAY", value: 2 }, repetition: 2, notification: { send_to_invoicer: false } },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`PayPal setup reminders error (${res.status}): ${await res.text()}`);
  }

  return res.json();
}
