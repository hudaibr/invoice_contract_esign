"use server";

import { renderToBuffer } from "@react-pdf/renderer";
import { InvoicePDF } from "@/components/InvoicePDF";
import { branding } from "@/lib/branding";
import type { InvoiceData } from "@/lib/types";

const BREVO_API = "https://api.brevo.com/v3/smtp/email";

export async function sendInvoiceEmail(data: InvoiceData) {
  try {
    const pdfBuffer = await renderToBuffer(<InvoicePDF data={data} />);
    const base64 = pdfBuffer.toString("base64");

    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) throw new Error("BREVO_API_KEY not set");

    const res = await fetch(BREVO_API, {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: { name: branding.agencyName, email: branding.email },
        to: [{ email: data.clientEmail, name: data.clientName }],
        subject: `Invoice ${data.invoiceNumber} from ${branding.agencyName}`,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
            <h2 style="color: #3FBB43;">Invoice ${data.invoiceNumber}</h2>
            <p>Hi ${data.clientName},</p>
            <p>Please find your invoice attached. Payment of
              <strong>$${data.lineItems.reduce((s, li) => s + li.quantity * li.rate, 0).toFixed(2)}</strong>
              is due by <strong>${data.dueDate}</strong>.</p>
            <p>You can reply to this email if you have any questions.</p>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
            <p style="color: #9CA3AF; font-size: 12px;">
              ${branding.agencyName} · ${branding.address}
            </p>
          </div>
        `,
        attachment: [{
          name: `${data.invoiceNumber}.pdf`,
          content: base64,
        }],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Brevo API error (${res.status}): ${body}`);
    }

    return { success: true as const };
  } catch (e) {
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "Failed to send invoice",
    };
  }
}
