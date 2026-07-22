import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createAndSendPaypalInvoice, getPaypalInvoiceStatus } from "@/lib/paypal/invoice";
import { checkRateLimit } from "@/lib/rate-limit";
import type { InvoiceData } from "@/lib/types";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!checkRateLimit(`paypal:send:${session.user.id}`, 10, 60000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const data: InvoiceData = await req.json();
    const result = await createAndSendPaypalInvoice(data, session.user.id);

    return NextResponse.json({ ...result, paypalStatus: "SENT" });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to send PayPal invoice" },
      { status: 500 },
    );
  }
}
