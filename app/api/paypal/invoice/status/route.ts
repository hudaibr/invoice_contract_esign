import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPaypalInvoiceStatus, listPaypalInvoices } from "@/lib/paypal/invoice";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!checkRateLimit(`paypal:status:${session.user.id}`, 30, 60000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const paypalId = searchParams.get("paypalInvoiceId");
  const listFromPaypal = searchParams.get("list") === "paypal";

  if (paypalId) {
    try {
      const paypalData = await getPaypalInvoiceStatus(paypalId);
      return NextResponse.json(paypalData);
    } catch {
      return NextResponse.json(
        { error: "Failed to fetch status" },
        { status: 500 },
      );
    }
  }

  if (listFromPaypal) {
    try {
      const paypalInvoices = await listPaypalInvoices();
      return NextResponse.json(paypalInvoices);
    } catch {
      return NextResponse.json(
        { error: "Failed to list PayPal invoices" },
        { status: 500 },
      );
    }
  }

  const invoices = await prisma.paypalInvoice.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(invoices);
}
