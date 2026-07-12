import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getEvents } from "@/lib/contract/audit";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const contract = await prisma.esContract.findUnique({ where: { id } });
  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  const events = await getEvents(id);

  return NextResponse.json({
    contract: {
      id: contract.id,
      contractNumber: contract.contractNumber,
      status: contract.status,
      pdfUrl: contract.pdfUrl,
      signedPdfUrl: contract.signedPdfUrl,
      auditCertificateUrl: contract.auditCertificateUrl,
      createdAt: contract.createdAt,
      completedAt: contract.completedAt,
    },
    events,
  });
}
