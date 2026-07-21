import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { deletePaypalInvoice } from "@/lib/paypal/invoice";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { paypalInvoiceId } = await req.json();
    await deletePaypalInvoice(paypalInvoiceId);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete" },
      { status: 500 },
    );
  }
}
