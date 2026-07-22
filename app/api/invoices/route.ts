import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { InvoiceData } from "@/lib/types";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invoices = await prisma.invoice.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(invoices);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data: InvoiceData = await req.json();
    const subtotal = data.lineItems.reduce((s, li) => s + li.quantity * li.rate, 0);
    const totalAmount = subtotal + (subtotal * data.taxRate / 100);

    const invoice = await prisma.invoice.create({
      data: {
        userId: session.user.id,
        invoiceNumber: data.invoiceNumber,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientPhone: data.clientPhone,
        clientAddress: data.clientAddress,
        totalAmount,
        currencyCode: "USD",
        invoiceData: data as object,
      },
    });

    return NextResponse.json(invoice);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to save invoice" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.invoice.deleteMany({ where: { id, userId: session.user.id } });
  return NextResponse.json({ success: true });
}
