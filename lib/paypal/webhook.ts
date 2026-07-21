import { getAccessToken, PAYPAL_API } from "./auth";
import { prisma } from "@/lib/prisma";

export async function verifyWebhookSignature(
  headers: Record<string, string>,
  body: string,
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return false;

  const token = await getAccessToken();

  const res = await fetch(`${PAYPAL_API}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      auth_algo: headers["paypal-auth-algo"],
      cert_url: headers["paypal-cert-url"],
      transmission_id: headers["paypal-transmission-id"],
      transmission_sig: headers["paypal-transmission-sig"],
      transmission_time: headers["paypal-transmission-time"],
      webhook_id: webhookId,
      webhook_event: JSON.parse(body),
    }),
  });

  if (!res.ok) return false;
  const result = await res.json();
  return result.verification_status === "SUCCESS";
}

export async function handleInvoiceWebhook(event: {
  event_type: string;
  resource: {
    id: string;
    status?: string;
    amount?: { value: string };
    detail?: { paid_date?: string };
  };
}) {
  const { event_type, resource } = event;

  if (event_type === "INVOICING.INVOICE.PAID") {
    await prisma.paypalInvoice.update({
      where: { paypalInvoiceId: resource.id },
      data: {
        status: "PAID",
        paidAt: resource.detail?.paid_date ? new Date(resource.detail.paid_date) : new Date(),
        paidAmount: resource.amount?.value ? Number(resource.amount.value) : undefined,
      },
    });
    return;
  }

  if (event_type === "INVOICING.INVOICE.CANCELLED") {
    await prisma.paypalInvoice.update({
      where: { paypalInvoiceId: resource.id },
      data: { status: "CANCELLED" },
    });
    return;
  }

  if (event_type === "INVOICING.INVOICE.REFUNDED") {
    await prisma.paypalInvoice.update({
      where: { paypalInvoiceId: resource.id },
      data: { status: "REFUNDED" },
    });
    return;
  }
}
