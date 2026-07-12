import { branding } from "@/lib/branding";

const BREVO_API = "https://api.brevo.com/v3/smtp/email";

function getConfig() {
  const apiKey = process.env.BREVO_API_KEY;
  const appUrl = process.env.SIGNING_URL_BASE;
  if (!apiKey || !appUrl) {
    throw new Error("BREVO_API_KEY and SIGNING_URL_BASE must be set");
  }
  return { apiKey, appUrl };
}

async function sendEmail(params: {
  to: { email: string; name: string };
  subject: string;
  htmlContent: string;
}) {
  const { apiKey } = getConfig();
  const res = await fetch(BREVO_API, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: branding.agencyName, email: branding.email },
      to: [params.to],
      subject: params.subject,
      htmlContent: params.htmlContent,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo API error (${res.status}): ${body}`);
  }

  return res.json();
}

export interface SendSigningLinkParams {
  to: { email: string; name: string };
  token: string;
  contractNumber: string;
}

export async function sendSigningLink(params: SendSigningLinkParams) {
  const { appUrl } = getConfig();
  const signingUrl = `${appUrl}/sign/${params.token}`;

  return sendEmail({
    to: params.to,
    subject: `Sign your contract — ${params.contractNumber}`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
        <h2 style="color: #3FBB43;">Sign your contract</h2>
        <p>Hi ${params.to.name},</p>
        <p>
          <strong>${branding.agencyName}</strong> has sent you a contract
          (<strong>${params.contractNumber}</strong>) for electronic signature.
        </p>
        <p>Click the button below to review and sign:</p>
        <a href="${signingUrl}"
           style="display: inline-block; background: #3FBB43; color: #fff;
                  padding: 12px 28px; border-radius: 6px; text-decoration: none;
                  font-weight: bold; margin: 16px 0;">
          Review &amp; Sign Contract
        </a>
        <p style="color: #6B7280; font-size: 13px;">
          This link expires in 72 hours. If you have any questions, reply to this email.
        </p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
        <p style="color: #9CA3AF; font-size: 12px;">
          ${branding.agencyName} · ${branding.address}
        </p>
      </div>
    `,
  });
}

export interface SendSignedCopiesParams {
  to: { email: string; name: string };
  contractNumber: string;
  signedPdfUrl: string;
  auditCertificateUrl: string;
}

export async function sendSignedCopies(params: SendSignedCopiesParams) {
  return sendEmail({
    to: params.to,
    subject: `Contract signed — ${params.contractNumber}`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
        <h2 style="color: #3FBB43;">Contract signed successfully</h2>
        <p>Hi ${params.to.name},</p>
        <p>
          <strong>${params.contractNumber}</strong> has been signed and completed.
        </p>
        <p>You can download the signed document and audit certificate below:</p>
        <a href="${params.signedPdfUrl}"
           style="display: inline-block; background: #3FBB43; color: #fff;
                  padding: 12px 28px; border-radius: 6px; text-decoration: none;
                  font-weight: bold; margin: 16px 0;">
          Download Signed PDF
        </a>
        <br />
        <a href="${params.auditCertificateUrl}"
           style="color: #3FBB43; font-size: 13px;">
          Download Audit Certificate
        </a>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
        <p style="color: #6B7280; font-size: 13px;">
          This is an automated confirmation of your electronic signature.
        </p>
        <p style="color: #9CA3AF; font-size: 12px;">
          ${branding.agencyName} · ${branding.address}
        </p>
      </div>
    `,
  });
}
