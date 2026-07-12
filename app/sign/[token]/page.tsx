import { prisma } from "@/lib/prisma";
import { logEvent } from "@/lib/contract/audit";
import { AuditEvent } from "@/lib/contract/types";
import { EsignErrorPage } from "@/components/esign/error-page";
import { SigningForm } from "./signing-form";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function SignPage({ params }: Props) {
  const { token } = await params;

  const tokenRecord = await prisma.esSigningToken.findUnique({
    where: { token },
    include: { contract: true },
  });

  if (!tokenRecord) {
    return (
      <EsignErrorPage
        title="Invalid Link"
        message="This signing link is invalid. Please check the link or contact the sender."
      />
    );
  }

  if (tokenRecord.used) {
    return (
      <EsignErrorPage
        title="Already Signed"
        message="This contract has already been signed using this link. Please contact the sender if you need a new copy."
      />
    );
  }

  if (new Date() > tokenRecord.expiresAt) {
    return (
      <EsignErrorPage
        title="Link Expired"
        message="This signing link has expired. Please ask the sender to resend a new signing link."
      />
    );
  }

  if (tokenRecord.contract.status === "cancelled") {
    return (
      <EsignErrorPage
        title="Contract Cancelled"
        message="This contract has been cancelled and cannot be signed."
      />
    );
  }

  // Log page visit (without blocking render)
  logEvent(tokenRecord.contractId, AuditEvent.SIGNING_LINK_OPENED).catch(() => {});

  const contractData = tokenRecord.contract.contractData as Record<string, unknown> | null;
  const clientName = (contractData?.clientName as string) ?? "Client";
  const clientEmail = (contractData?.clientEmail as string) ?? "";

  return (
    <SigningForm
      token={token}
      contractNumber={tokenRecord.contract.contractNumber}
      contractPdfUrl={tokenRecord.contract.pdfUrl ?? ""}
      clientName={clientName}
      clientEmail={clientEmail}
    />
  );
}
