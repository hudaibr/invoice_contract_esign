"use client";

import { useState, useEffect } from "react";
import { branding } from "@/lib/branding";
import { SignaturePad } from "@/components/esign/signature-pad";
import { signContractAction } from "./actions";
import type { SignatureType } from "@/lib/contract/types";

interface Props {
  token: string;
  contractNumber: string;
  contractPdfUrl: string;
  clientName: string;
  clientEmail: string;
}

function detectBrowser() {
  const ua = navigator.userAgent;
  const os = /Windows/i.test(ua) ? "Windows"
    : /Mac/i.test(ua) ? "macOS"
    : /Linux/i.test(ua) ? "Linux"
    : /Android/i.test(ua) ? "Android"
    : /iOS|iPhone|iPad|iPod/i.test(ua) ? "iOS"
    : "Unknown";
  const browser = /Chrome/i.test(ua) && !/Edge/i.test(ua) ? "Chrome"
    : /Firefox/i.test(ua) ? "Firefox"
    : /Safari/i.test(ua) ? "Safari"
    : /Edge/i.test(ua) ? "Edge"
    : /Opera|OPR/i.test(ua) ? "Opera"
    : "Unknown";
  const device = /Mobile|Android|iPhone|iPad|iPod/i.test(ua) ? "Mobile" : "Desktop";
  return { os, browser, device };
}

export function SigningForm({
  token,
  contractNumber,
  contractPdfUrl,
  clientName,
  clientEmail,
}: Props) {
  const [showPdf, setShowPdf] = useState(true);
  const [signatureDataUrl, setSignatureDataUrl] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [consentElectronic, setConsentElectronic] = useState(false);
  const [legallyBinding, setLegallyBinding] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [status, setStatus] = useState<
    { type: "idle" } | { type: "signing" } | { type: "done"; signedPdfUrl: string; auditUrl: string } | { type: "error"; message: string }
  >({ type: "idle" });

  const allChecked = reviewed && consentElectronic && legallyBinding && authorized;
  const hasSignature = signatureDataUrl.length > 0;

  async function handleSign() {
    if (!allChecked || !hasSignature) return;

    const info = detectBrowser();

    setStatus({ type: "signing" });

    const result = await signContractAction({
      token,
      signatureDataUrl,
      consent: {
        reviewed,
        consentToElectronic: consentElectronic,
        legallyBinding,
        authorized,
        consentedAt: new Date().toISOString(),
      },
      signerInfo: {
        signerName: clientName,
        signerEmail: clientEmail,
        signatureType: "drawn" as SignatureType,
        ipAddress: "",
        userAgent: navigator.userAgent,
        browser: info.browser,
        operatingSystem: info.os,
        device: info.device,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
      },
    });

    if (result.success) {
      setStatus({
        type: "done",
        signedPdfUrl: result.signedPdfUrl,
        auditUrl: result.auditCertificateUrl,
      });
    } else {
      setStatus({ type: "error", message: result.error ?? "Something went wrong." });
    }
  }

  if (status.type === "done") {
    return (
      <main className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl border border-neutral-200 p-8 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <span className="text-green-600 text-2xl font-bold">✓</span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900">Contract Signed</h1>
          <p className="text-sm text-neutral-500">
            <strong>{contractNumber}</strong> has been signed successfully.
          </p>
          <div className="flex flex-col gap-2 pt-4">
            <a
              href={status.signedPdfUrl}
              target="_blank"
              className="rounded-lg bg-[#3FBB43] text-white py-2.5 text-sm font-medium text-center hover:bg-[#2E8A32] transition"
            >
              Download Signed PDF
            </a>
            <a
              href={status.auditUrl}
              target="_blank"
              className="rounded-lg border border-neutral-300 text-neutral-700 py-2.5 text-sm font-medium text-center hover:bg-neutral-50 transition"
            >
              Download Audit Certificate
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="lg:grid lg:grid-cols-2 gap-0 h-screen">
        {/* Left: PDF Viewer */}
        {showPdf && (
          <div className="h-screen overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-4">
              <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm">
                <iframe
                  src={contractPdfUrl}
                  className="w-full aspect-[210/297] max-h-full"
                  title="Contract"
                />
              </div>
            </div>
          </div>
        )}

        {/* Right: Form */}
        <div className="overflow-y-auto p-4 lg:p-6 space-y-4">
          {/* Header */}
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-neutral-900">
                  Sign Contract
                </h1>
                <p className="text-sm text-neutral-500">{contractNumber}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowPdf(!showPdf)}
                  className="text-xs text-[#3FBB43] hover:underline font-medium"
                >
                  {showPdf ? "Hide PDF" : "View PDF"}
                </button>
                {branding.logoUrl ? (
                  <img src={branding.logoUrl} alt={branding.agencyName} className="h-8 w-auto" />
                ) : (
                  <p className="font-semibold text-neutral-900 text-sm">{branding.agencyName}</p>
                )}
              </div>
            </div>
          </div>

          {/* Consent */}
          <div className="bg-white rounded-xl border border-neutral-200 p-4 space-y-3">
            <h2 className="text-sm font-medium text-neutral-700">Consent</h2>
            <label className="flex items-start gap-3 text-sm cursor-pointer">
              <input type="checkbox" checked={reviewed} onChange={(e) => setReviewed(e.target.checked)} className="mt-0.5" />
              <span className="text-neutral-900">I have reviewed this agreement.</span>
            </label>
            <label className="flex items-start gap-3 text-sm cursor-pointer">
              <input type="checkbox" checked={consentElectronic} onChange={(e) => setConsentElectronic(e.target.checked)} className="mt-0.5" />
              <span className="text-neutral-900">I consent to use electronic signatures.</span>
            </label>
            <label className="flex items-start gap-3 text-sm cursor-pointer">
              <input type="checkbox" checked={legallyBinding} onChange={(e) => setLegallyBinding(e.target.checked)} className="mt-0.5" />
              <span className="text-neutral-900">I understand this signature is legally binding.</span>
            </label>
            <label className="flex items-start gap-3 text-sm cursor-pointer">
              <input type="checkbox" checked={authorized} onChange={(e) => setAuthorized(e.target.checked)} className="mt-0.5" />
              <span className="text-neutral-900">I am authorized to sign.</span>
            </label>
          </div>

          {/* Signature */}
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <h2 className="text-sm font-medium text-neutral-700 mb-3">Signature</h2>
            <SignaturePad onSave={setSignatureDataUrl} />
          </div>

          {/* Sign Button */}
          <button
            onClick={handleSign}
            disabled={!allChecked || !hasSignature || status.type === "signing"}
            className="w-full rounded-lg bg-neutral-900 text-white py-3 text-sm font-medium hover:bg-neutral-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {status.type === "signing" ? "Signing\u2026" : "I Agree \u2014 Sign Contract"}
          </button>

          {status.type === "error" && (
            <p className="text-sm text-red-600 text-center">{status.message}</p>
          )}

          {/* Footer */}
          <p className="text-xs text-neutral-400 text-center pb-4">
            {branding.agencyName} · {branding.address}
          </p>
        </div>
      </div>
    </main>
  );
}
