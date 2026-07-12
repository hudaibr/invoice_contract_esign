import { renderToBuffer } from "@react-pdf/renderer";
import { randomBytes } from "crypto";
import { ContractPDF } from "@/components/ContractPDF";
import { prisma } from "@/lib/prisma";
import { ESIGN_CONSTANTS } from "./constants";
import {
  hashPdf,
  embedSignature,
  embedCompanySignature,
  generateAuditCertificate,
} from "./pdf";
import {
  uploadUnsignedPdf,
  uploadSignedPdf,
  uploadAuditCert,
  uploadSignature,
} from "./storage";
import { logEvent, getEvents } from "./audit";
import { sendSigningLink, sendSignedCopies } from "./email";
import {
  TokenExpiredError,
  TokenAlreadyUsedError,
  InvalidTokenError,
  ContractCancelledError,
  AlreadySignedError,
  InvalidStateTransitionError,
} from "./errors";
import {
  ContractStatus,
  AuditEvent,
  CONTRACT_TRANSITIONS,
} from "./types";
import type {
  SendContractInput,
  SendContractResult,
  SignContractInput,
  SignContractResult,
} from "./types";

async function transitionStatus(
  contractId: string,
  to: ContractStatus,
) {
  const contract = await prisma.esContract.findUniqueOrThrow({
    where: { id: contractId },
  });
  const allowed = CONTRACT_TRANSITIONS[contract.status as ContractStatus];
  if (!allowed?.includes(to)) {
    throw new InvalidStateTransitionError(contract.status, to);
  }
  await prisma.esContract.update({
    where: { id: contractId },
    data: {
      status: to,
      completedAt: to === ContractStatus.COMPLETED ? new Date() : undefined,
    },
  });
}

export async function sendContract(
  input: SendContractInput,
): Promise<SendContractResult> {
  const { contractData, userId } = input;
  const appUrl = process.env.SIGNING_URL_BASE!;

  const pdfBuffer = await renderToBuffer(<ContractPDF data={contractData} />);
  const documentHash = hashPdf(pdfBuffer);

  const contract = await prisma.esContract.create({
    data: {
      contractNumber: contractData.contractNumber,
      userId,
      status: ContractStatus.DRAFT,
      contractData: contractData as object,
      documentHash,
    },
  });

  const pdfUrl = await uploadUnsignedPdf(pdfBuffer, contract.id);

  await prisma.esContract.update({
    where: { id: contract.id },
    data: { pdfUrl },
  });

  await logEvent(contract.id, AuditEvent.CONTRACT_CREATED);
  await logEvent(contract.id, AuditEvent.CONTRACT_SENT);

  const token = randomBytes(ESIGN_CONSTANTS.TOKEN_BYTES).toString("hex");
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + ESIGN_CONSTANTS.TOKEN_EXPIRY_HOURS);

  await prisma.esSigningToken.create({
    data: { contractId: contract.id, token, expiresAt },
  });

  await transitionStatus(contract.id, ContractStatus.PENDING_CLIENT);

  await sendSigningLink({
    to: { email: contractData.clientEmail, name: contractData.clientName },
    token,
    contractNumber: contractData.contractNumber,
  });

  await logEvent(contract.id, AuditEvent.EMAIL_DELIVERED);

  const signingUrl = `${appUrl}/sign/${token}`;
  return { contractId: contract.id, signingUrl };
}

export async function signContract(
  input: SignContractInput,
): Promise<SignContractResult> {
  const { token, signatureDataUrl, consent, signerInfo } = input;

  const tokenRecord = await prisma.esSigningToken.findUnique({
    where: { token },
  });
  if (!tokenRecord) throw new InvalidTokenError();
  if (tokenRecord.used) throw new TokenAlreadyUsedError();
  if (new Date() > tokenRecord.expiresAt) throw new TokenExpiredError();

  const contract = await prisma.esContract.findUniqueOrThrow({
    where: { id: tokenRecord.contractId },
  });
  if (contract.status === ContractStatus.CANCELLED) {
    throw new ContractCancelledError();
  }
  if (contract.status === ContractStatus.COMPLETED) {
    throw new AlreadySignedError();
  }

  await logEvent(contract.id, AuditEvent.SIGNATURE_STARTED, {
    ipAddress: signerInfo.ipAddress,
    userAgent: signerInfo.userAgent,
  });

  const signaturePngBuffer = Buffer.from(
    signatureDataUrl.replace(/^data:image\/png;base64,/, ""),
    "base64",
  );

  const signerId = `${signerInfo.signerName.replace(/\s+/g, "_").toLowerCase()}_${Date.now()}`;
  const signatureUrl = await uploadSignature(
    signaturePngBuffer,
    contract.id,
    signerId,
  );

  const signature = await prisma.esSignature.create({
    data: {
      contractId: contract.id,
      signerName: signerInfo.signerName,
      signerEmail: signerInfo.signerEmail,
      signatureType: signerInfo.signatureType,
      signatureImageUrl: signatureUrl,
      consentData: consent as object,
      ipAddress: signerInfo.ipAddress,
      userAgent: signerInfo.userAgent,
      browser: signerInfo.browser,
      operatingSystem: signerInfo.operatingSystem,
      device: signerInfo.device,
      timezone: signerInfo.timezone,
      language: signerInfo.language,
    },
  });

  const unsignedPdfResponse = await fetch(contract.pdfUrl!);
  const unsignedPdfBuffer = Buffer.from(await unsignedPdfResponse.arrayBuffer());

  let signedPdfBuffer = await embedSignature(unsignedPdfBuffer, signaturePngBuffer);

  const companySigUrl = process.env.COMPANY_SIGNATURE_URL;
  if (companySigUrl) {
    try {
      const companySigResponse = await fetch(companySigUrl);
      const companySigBuffer = Buffer.from(await companySigResponse.arrayBuffer());
      signedPdfBuffer = await embedCompanySignature(signedPdfBuffer, companySigBuffer);
      await logEvent(contract.id, AuditEvent.COMPANY_SIGNED);
    } catch {
      // Company signature unavailable — continue without it
    }
  }

  const signedDocumentHash = hashPdf(signedPdfBuffer);
  const signedPdfUrl = await uploadSignedPdf(signedPdfBuffer, contract.id);

  await logEvent(contract.id, AuditEvent.PDF_GENERATED);

  const events = await getEvents(contract.id);
  const sentEvent = events.find((e) => e.event === AuditEvent.CONTRACT_SENT);
  const viewedEvent = events.find((e) => e.event === AuditEvent.SIGNING_LINK_OPENED);
  const auditPdfBuffer = await generateAuditCertificate({
    contractNumber: contract.contractNumber,
    contractId: contract.id,
    clientName: signerInfo.signerName,
    clientEmail: signerInfo.signerEmail,
    signerIp: signerInfo.ipAddress,
    signerBrowser: signerInfo.browser,
    signerOs: signerInfo.operatingSystem,
    signerDevice: signerInfo.device,
    signerTimezone: signerInfo.timezone,
    documentHash: contract.documentHash!,
    signedDocumentHash,
    signatureType: signerInfo.signatureType,
    signatureId: signature.id,
    events: events.map((e) => ({
      event: e.event as AuditEvent,
      timestamp: e.timestamp,
      metadata: e.metadata as Record<string, unknown> | undefined,
    })),
    createdAt: contract.createdAt,
    sentAt: sentEvent?.timestamp ?? contract.createdAt,
    viewedAt: viewedEvent?.timestamp ?? undefined,
    signedAt: new Date(),
    completedAt: new Date(),
  });
  const auditCertificateUrl = await uploadAuditCert(auditPdfBuffer, contract.id);

  await logEvent(contract.id, AuditEvent.AUDIT_CERTIFICATE_GENERATED);

  await prisma.esSigningToken.update({
    where: { id: tokenRecord.id },
    data: { used: true, usedAt: new Date() },
  });

  await prisma.esContract.update({
    where: { id: contract.id },
    data: {
      signedDocumentHash,
      signedPdfUrl,
      auditCertificateUrl,
    },
  });

  await logEvent(contract.id, AuditEvent.SIGNATURE_COMPLETED);
  await transitionStatus(contract.id, ContractStatus.COMPLETED);
  await logEvent(contract.id, AuditEvent.CONTRACT_COMPLETED);

  await sendSignedCopies({
    to: { email: signerInfo.signerEmail, name: signerInfo.signerName },
    contractNumber: contract.contractNumber,
    signedPdfUrl,
    auditCertificateUrl,
  });
  await logEvent(contract.id, AuditEvent.COMPLETION_EMAIL_SENT);

  return { signedPdfUrl, auditCertificateUrl };
}
