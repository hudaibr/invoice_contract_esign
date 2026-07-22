import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { cancelPaypalInvoice } from "@/lib/paypal/invoice";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!checkRateLimit(`paypal:cancel:${session.user.id}`, 10, 60000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const { paypalInvoiceId } = await req.json();
    const result = await cancelPaypalInvoice(paypalInvoiceId);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Failed to cancel invoice" },
      { status: 500 },
    );
  }
}
