import { createHash } from "crypto";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { AuditEvent } from "./types";
import { branding } from "@/lib/branding";

export function hashPdf(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

const PLACEMENT = {
  clientSignature: { x: 290, y: 127, width: 180, height: 30 },
  companySignature: { x: 50, y: 80, width: 200, height: 50 },
};

export async function embedSignature(
  pdfBuffer: Buffer,
  signatureImageBuffer: Buffer,
  options?: { x?: number; y?: number; width?: number; height?: number },
): Promise<Buffer> {
  const doc = await PDFDocument.load(pdfBuffer);
  const png = await doc.embedPng(signatureImageBuffer);
  const page = doc.getPage(doc.getPageCount() - 1);

  const x = options?.x ?? PLACEMENT.clientSignature.x;
  const y = options?.y ?? PLACEMENT.clientSignature.y;
  const w = options?.width ?? PLACEMENT.clientSignature.width;
  const h = options?.height ?? PLACEMENT.clientSignature.height;

  page.drawImage(png, { x, y, width: w, height: h });

  return Buffer.from(await doc.save());
}

export async function embedCompanySignature(
  pdfBuffer: Buffer,
  companySignatureBuffer: Buffer,
  options?: { x?: number; y?: number; width?: number; height?: number },
): Promise<Buffer> {
  const doc = await PDFDocument.load(pdfBuffer);
  const png = await doc.embedPng(companySignatureBuffer);
  const page = doc.getPage(doc.getPageCount() - 1);

  const x = options?.x ?? PLACEMENT.companySignature.x;
  const y = options?.y ?? PLACEMENT.companySignature.y;
  const w = options?.width ?? PLACEMENT.companySignature.width;
  const h = options?.height ?? PLACEMENT.companySignature.height;

  page.drawImage(png, { x, y, width: w, height: h });

  return Buffer.from(await doc.save());
}

export interface AuditCertificateParams {
  contractNumber: string;
  contractId: string;
  clientName: string;
  clientEmail: string;
  signerIp: string;
  signerBrowser: string;
  signerOs: string;
  signerDevice: string;
  signerTimezone: string;
  documentHash: string;
  signedDocumentHash: string;
  signatureType: string;
  signatureId: string;
  events: { event: AuditEvent; timestamp: Date; metadata?: Record<string, unknown> }[];
  createdAt: Date;
  sentAt: Date;
  viewedAt?: Date;
  signedAt?: Date;
  completedAt?: Date;
}

export async function generateAuditCertificate(
  params: AuditCertificateParams,
): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage();
  const { width, height } = page.getSize();
  const margin = 50;
  const contentWidth = width - margin * 2;
  let y = height - margin;

  function text(
    content: string,
    opts?: { bold?: boolean; size?: number; color?: number },
  ) {
    page.drawText(content, {
      x: margin,
      y,
      size: opts?.size ?? 10,
      font: opts?.bold ? fontBold : font,
      color: opts?.color ? rgb(opts.color, opts.color, opts.color) : rgb(0, 0, 0),
    });
    y -= (opts?.size ?? 10) * 1.5;
  }

  function divider() {
    y -= 6;
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });
    y -= 10;
  }

  const gray = 0.4;

  // Header
  text("AUDIT CERTIFICATE", { bold: true, size: 16 });
  text("Electronic Signature Audit Trail", { size: 9, color: gray });
  divider();

  text(`Contract #: ${params.contractNumber}`, { bold: true });
  text(`Contract ID: ${params.contractId}`, { size: 9, color: gray });
  divider();

  text("Signer Information", { bold: true, size: 11 });
  text(`Name: ${params.clientName}`);
  text(`Email: ${params.clientEmail}`);
  text(`IP Address: ${params.signerIp}`);
  text(`Browser: ${params.signerBrowser}`);
  text(`Operating System: ${params.signerOs}`);
  text(`Device: ${params.signerDevice}`);
  text(`Timezone: ${params.signerTimezone}`);
  text(`Signature Type: ${params.signatureType}`);
  text(`Signature ID: ${params.signatureId}`);
  divider();

  text("Document Integrity", { bold: true, size: 11 });
  text(`Original Document Hash (SHA256):`, { size: 8, color: gray });
  text(params.documentHash, { size: 7, color: gray });
  y -= 4;
  text(`Signed Document Hash (SHA256):`, { size: 8, color: gray });
  text(params.signedDocumentHash, { size: 7, color: gray });
  divider();

  text("Timeline", { bold: true, size: 11 });

  for (const event of params.events) {
    const ts = event.timestamp.toISOString().replace("T", " ").slice(0, 19);
    text(`${ts} — ${event.event}`, { size: 8, color: gray });
  }
  divider();

  text(`Contract Created: ${params.createdAt.toISOString()}`, { size: 8, color: gray });
  text(`Contract Sent: ${params.sentAt.toISOString()}`, { size: 8, color: gray });
  if (params.viewedAt) {
    text(`Document Viewed: ${params.viewedAt.toISOString()}`, { size: 8, color: gray });
  }
  if (params.signedAt) {
    text(`Document Signed: ${params.signedAt.toISOString()}`, { size: 8, color: gray });
  }
  if (params.completedAt) {
    text(`Process Completed: ${params.completedAt.toISOString()}`, { size: 8, color: gray });
  }

  // Footer
  text("", { size: 20 });
  text(
    `Generated by ${branding.agencyName} — ${new Date().toISOString()}`,
    { size: 7, color: gray },
  );

  return Buffer.from(await doc.save());
}
