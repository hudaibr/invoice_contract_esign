import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { deletePaypalInvoice } from "@/lib/paypal/invoice";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!checkRateLimit(`paypal:delete:${session.user.id}`, 10, 60000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const { paypalInvoiceId } = await req.json();
    await deletePaypalInvoice(paypalInvoiceId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete invoice" },
      { status: 500 },
    );
  }
}
