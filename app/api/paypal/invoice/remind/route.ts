import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { remindPaypalInvoice } from "@/lib/paypal/invoice";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!checkRateLimit(`paypal:remind:${session.user.id}`, 5, 60000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const { paypalInvoiceId } = await req.json();
    const result = await remindPaypalInvoice(paypalInvoiceId);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Failed to send reminder" },
      { status: 500 },
    );
  }
}
