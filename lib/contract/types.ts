import type { ContractData } from "@/lib/types";

export enum ContractStatus {
  DRAFT = "draft",
  PENDING_CLIENT = "pending_client",
  CLIENT_VIEWING = "client_viewing",
  CLIENT_SIGNED = "client_signed",
  COMPLETED = "completed",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
}

export const CONTRACT_TRANSITIONS: Record<ContractStatus, ContractStatus[]> = {
  [ContractStatus.DRAFT]: [ContractStatus.PENDING_CLIENT, ContractStatus.CANCELLED],
  [ContractStatus.PENDING_CLIENT]: [ContractStatus.CLIENT_VIEWING, ContractStatus.COMPLETED, ContractStatus.EXPIRED, ContractStatus.CANCELLED],
  [ContractStatus.CLIENT_VIEWING]: [ContractStatus.CLIENT_SIGNED, ContractStatus.COMPLETED, ContractStatus.EXPIRED, ContractStatus.CANCELLED],
  [ContractStatus.CLIENT_SIGNED]: [ContractStatus.COMPLETED],
  [ContractStatus.COMPLETED]: [],
  [ContractStatus.EXPIRED]: [],
  [ContractStatus.CANCELLED]: [],
};

export enum AuditEvent {
  CONTRACT_CREATED = "contract_created",
  CONTRACT_SENT = "contract_sent",
  EMAIL_DELIVERED = "email_delivered",
  SIGNING_LINK_OPENED = "signing_link_opened",
  DOCUMENT_VIEWED = "document_viewed",
  CONSENT_ACCEPTED = "consent_accepted",
  SIGNATURE_STARTED = "signature_started",
  SIGNATURE_COMPLETED = "signature_completed",
  PDF_GENERATED = "pdf_generated",
  COMPANY_SIGNED = "company_signed",
  AUDIT_CERTIFICATE_GENERATED = "audit_certificate_generated",
  COMPLETION_EMAIL_SENT = "completion_email_sent",
  CONTRACT_COMPLETED = "contract_completed",
  CONTRACT_EXPIRED = "contract_expired",
  CONTRACT_CANCELLED = "contract_cancelled",
}

export enum SignatureType {
  DRAWN = "drawn",
  TYPED = "typed",
}

export interface SignerInfo {
  signerName: string;
  signerEmail: string;
  signatureType: SignatureType;
  ipAddress: string;
  userAgent: string;
  browser: string;
  operatingSystem: string;
  device: string;
  timezone: string;
  language: string;
}

export interface ConsentRecord {
  reviewed: boolean;
  consentToElectronic: boolean;
  legallyBinding: boolean;
  authorized: boolean;
  consentedAt: string;
}

export interface SendContractInput {
  contractData: ContractData;
  userId: string;
}

export interface SendContractResult {
  contractId: string;
  signingUrl: string;
}

export interface SignContractInput {
  token: string;
  signatureDataUrl: string;
  consent: ConsentRecord;
  signerInfo: SignerInfo;
}

export interface SignContractResult {
  signedPdfUrl: string;
  auditCertificateUrl: string;
}
