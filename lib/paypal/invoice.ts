import { getAccessToken, PAYPAL_API } from "./auth";
import { prisma } from "@/lib/prisma";
import type { InvoiceData } from "@/lib/types";

export interface CreatePaypalInvoiceResult {
  paypalInvoiceId: string;
  paypalLink: string;
  localInvoiceId: string;
}

export async function createAndSendPaypalInvoice(
  data: InvoiceData,
  userId: string,
): Promise<CreatePaypalInvoiceResult> {
  const token = await getAccessToken();

  const lineItems = data.lineItems.map((li) => ({
    name: li.description || "Service",
    quantity: String(li.quantity),
    unit_amount: { currency_code: "USD", value: li.rate.toFixed(2) },
  }));

  const subtotal = data.lineItems.reduce((s, li) => s + li.quantity * li.rate, 0);
  const taxAmount = subtotal * (data.taxRate / 100);

  if (taxAmount > 0) {
    lineItems.push({
      name: `Sales Tax (${data.taxRate}%)`,
      quantity: "1",
      unit_amount: { currency_code: "USD", value: taxAmount.toFixed(2) },
    });
  }

  const invoicePayload = {
    detail: {
      invoice_number: data.invoiceNumber,
      currency_code: "USD",
      note: data.notes || undefined,
      payment_term: {
        term_type: "DUE_ON_DATE_SPECIFIED",
        due_date: data.dueDate,
      },
    },
    invoicer: {
      name: { given_name: process.env.PAYPAL_MERCHANT_NAME || "Agency" },
      email_address: process.env.PAYPAL_MERCHANT_EMAIL,
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
      template_id: process.env.PAYPAL_TEMPLATE_ID || undefined,
    },
    amount: {
      breakdown: {
        item_total: { currency_code: "USD", value: (subtotal + taxAmount).toFixed(2) },
      },
    },
  };

  // Create draft
  const createRes = await fetch(`${PAYPAL_API}/v2/invoicing/invoices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
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

  // Store locally
  const localInvoice = await prisma.paypalInvoice.create({
    data: {
      userId,
      paypalInvoiceId,
      invoiceNumber: data.invoiceNumber,
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      totalAmount: subtotal + taxAmount,
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
      subject: `Invoice ${data.invoiceNumber} from ${process.env.PAYPAL_MERCHANT_NAME || "Agency"}`,
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
