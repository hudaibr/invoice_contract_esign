export const ESIGN_CONSTANTS = {
  TOKEN_EXPIRY_HOURS: 72,
  TOKEN_BYTES: 32,
  STORAGE_BUCKET: "esign",
  STORAGE_PATHS: {
    UNSIGNED_PDF: (id: string) => `contracts/${id}/v1_unsigned.pdf`,
    SIGNED_PDF: (id: string) => `contracts/${id}/v2_signed.pdf`,
    AUDIT_CERT: (id: string) => `contracts/${id}/v3_audit.pdf`,
    SIGNATURE: (id: string, signerId: string) => `signatures/${id}_${signerId}.png`,
  },
  COMPANY_SIGNATURE: {
    name: process.env.COMPANY_SIGNATORY_NAME || "Authorized Representative",
    title: process.env.COMPANY_SIGNATORY_TITLE || "Managing Member",
  },
} as const;
