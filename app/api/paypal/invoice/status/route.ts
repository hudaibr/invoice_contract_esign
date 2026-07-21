import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPaypalInvoiceStatus } from "@/lib/paypal/invoice";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const paypalId = searchParams.get("paypalInvoiceId");

  if (paypalId) {
    try {
      const paypalData = await getPaypalInvoiceStatus(paypalId);
      return NextResponse.json(paypalData);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Failed to fetch status" },
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
