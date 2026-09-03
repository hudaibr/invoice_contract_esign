import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/paypal/webhook";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

const WEBHOOK_ID = process.env.PAYPAL_NCP_WEBHOOK_ID;

export async function POST(req: NextRequest) {
  if (!WEBHOOK_ID) {
    console.error("[NCP Webhook] PAYPAL_NCP_WEBHOOK_ID not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  if (!checkRateLimit("ncp:webhook", 100, 60000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await req.text();
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    const event = JSON.parse(body);

    const isValid = await verifyWebhookSignature(headers, event, WEBHOOK_ID);
    if (!isValid) {
      console.warn("[NCP Webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    if (event.event_type !== "PAYMENT.CAPTURE.COMPLETED") {
      return NextResponse.json({ received: true, ignored: true });
    }

    const resource = event.resource ?? {};
    const supplementaryData = resource.supplementary_data ?? {};
    const relatedIds = supplementaryData.related_ids ?? {};
    const cartId = relatedIds.cart_id ?? "";

    if (!cartId.startsWith("PLB-")) {
      return NextResponse.json({ received: true, ignored: true });
    }

    const payer = resource.payer ?? {};
    const nameInfo = payer.name ?? {};
    const givenName = nameInfo.given_name ?? "";
    const surname = nameInfo.surname ?? "";
    const customerName = `${givenName} ${surname}`.trim() || "Unknown Client";
    const customerEmail = payer.email_address ?? "unknown@example.com";

    const amountObj = resource.amount ?? {};
    const amount = Number(amountObj.value ?? 0);
    const currencyCode = amountObj.currency_code ?? "USD";
    const status = resource.status ?? "COMPLETED";
    const captureId = resource.id ?? "";
    const paidAt = resource.create_time ? new Date(resource.create_time) : new Date();

    if (!captureId) {
      console.warn("[NCP Webhook] Missing capture ID");
      return NextResponse.json({ error: "Missing capture ID" }, { status: 400 });
    }

    await prisma.ncpPayment.upsert({
      where: { paypalCaptureId: captureId },
      create: {
        customerName,
        customerEmail,
        amount,
        currencyCode,
        status,
        paypalCartId: cartId,
        paypalCaptureId: captureId,
        paidAt,
        rawPayload: event,
      },
      update: {
        customerName,
        customerEmail,
        amount,
        currencyCode,
        status,
        paypalCartId: cartId,
        paidAt,
        rawPayload: event,
      },
    });

    console.log(`[NCP Webhook] Saved payment: ${captureId} - ${customerName} - ${amount} ${currencyCode}`);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[NCP Webhook] Error:", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}