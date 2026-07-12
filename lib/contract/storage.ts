import { createClient } from "@supabase/supabase-js";
import { ESIGN_CONSTANTS } from "./constants";

function getAdminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set");
  }
  return createClient(url, key);
}

async function uploadFile(
  buffer: Buffer,
  path: string,
  contentType: string,
): Promise<string> {
  const supabase = getAdminClient();
  const { error } = await supabase.storage
    .from(ESIGN_CONSTANTS.STORAGE_BUCKET)
    .upload(path, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const { data: publicUrl } = supabase.storage
    .from(ESIGN_CONSTANTS.STORAGE_BUCKET)
    .getPublicUrl(path);

  return publicUrl.publicUrl;
}

export async function uploadUnsignedPdf(
  buffer: Buffer,
  contractId: string,
): Promise<string> {
  return uploadFile(
    buffer,
    ESIGN_CONSTANTS.STORAGE_PATHS.UNSIGNED_PDF(contractId),
    "application/pdf",
  );
}

export async function uploadSignedPdf(
  buffer: Buffer,
  contractId: string,
): Promise<string> {
  return uploadFile(
    buffer,
    ESIGN_CONSTANTS.STORAGE_PATHS.SIGNED_PDF(contractId),
    "application/pdf",
  );
}

export async function uploadAuditCert(
  buffer: Buffer,
  contractId: string,
): Promise<string> {
  return uploadFile(
    buffer,
    ESIGN_CONSTANTS.STORAGE_PATHS.AUDIT_CERT(contractId),
    "application/pdf",
  );
}

export async function uploadSignature(
  pngBuffer: Buffer,
  contractId: string,
  signerId: string,
): Promise<string> {
  return uploadFile(
    pngBuffer,
    ESIGN_CONSTANTS.STORAGE_PATHS.SIGNATURE(contractId, signerId),
    "image/png",
  );
}
