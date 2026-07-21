import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { cancelPaypalInvoice } from "@/lib/paypal/invoice";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { paypalInvoiceId } = await req.json();
    const result = await cancelPaypalInvoice(paypalInvoiceId);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to cancel" },
      { status: 500 },
    );
  }
}
