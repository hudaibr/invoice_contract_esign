import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature, handleInvoiceWebhook } from "@/lib/paypal/webhook";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    const event = JSON.parse(body);
    const isValid = await verifyWebhookSignature(headers, event);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    await handleInvoiceWebhook(event);
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
