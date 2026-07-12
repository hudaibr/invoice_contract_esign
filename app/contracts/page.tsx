"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { branding } from "@/lib/branding";
import type { ContractData } from "@/lib/types";
import { ContractPDF } from "@/components/ContractPDF";
import { Download, Send, LogOut } from "lucide-react";
import { signOutAction } from "@/lib/actions";
import { logToCRM } from "@/lib/crm";

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  { ssr: false, loading: () => <button className="btn-primary" disabled>Loading PDF engine…</button> }
);

const PDFPreview = dynamic(
  () => import("@/components/PDFPreview"),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full text-sm text-neutral-400">Loading preview…</div> }
);

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

type SendStatus =
  | { state: "idle" }
  | { state: "sending" }
  | { state: "sent"; signingUrl: string; contractId: string }
  | { state: "error"; message: string };

export default function ContractsPage() {
  const [contractNumber, setContractNumber] = useState(`CTR-${new Date().getFullYear()}-001`);
  const [date] = useState(todayISO());
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [scope, setScope] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [timeline, setTimeline] = useState("");
  const [price, setPrice] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("PayPal");
  const [paymentTerms, setPaymentTerms] = useState(branding.contract.defaultPaymentTerms);
  const [revisionRounds, setRevisionRounds] = useState(branding.contract.defaultRevisionRounds);
  const [usageRights, setUsageRights] = useState(
    "Full commercial usage rights transfer to the client upon receipt of final payment. The agency retains the right to display the work in its portfolio unless otherwise agreed in writing."
  );
  const [additionalTerms, setAdditionalTerms] = useState("");
  const [sendStatus, setSendStatus] = useState<SendStatus>({ state: "idle" });

  const contractData: ContractData = {
    contractNumber,
    date,
    clientName: clientName || "Client Name",
    clientEmail,
    clientCompany,
    projectTitle,
    scope,
    deliverables,
    timeline,
    price,
    paymentMethod,
    paymentTerms,
    revisionRounds,
    usageRights,
    additionalTerms,
  };

  async function handleSendForSignature() {
    if (!clientEmail) {
      alert("Add the client's email before sending for signature.");
      return;
    }
    setSendStatus({ state: "sending" });
    try {
      const res = await fetch("/api/esign/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractData }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSendStatus({ state: "error", message: data.error || "Something went wrong." });
        return;
      }
      setSendStatus({ state: "sent", signingUrl: data.signingUrl, contractId: data.contractId });
      logToCRM({
        type: "Contract",
        status: "Sent for Signature",
        ...contractData,
      });
    } catch (err) {
      setSendStatus({ state: "error", message: "Network error. Please try again." });
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 py-10 px-4">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            {branding.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={branding.logoUrl} alt={branding.agencyName} className="h-10 object-contain" />
            ) : null}
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Contract Generator</h1>
              <p className="text-sm text-neutral-500">{branding.agencyName}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="/invoices" className="text-sm text-[#3FBB43] hover:underline">
              Invoices
            </a>
            <a href="/contracts/status" className="text-sm text-[#3FBB43] hover:underline">
              Contract Status
            </a>
            <form action={signOutAction}>
              <button className="text-sm text-neutral-400 hover:text-red-500 flex items-center gap-1">
                <LogOut size={14} /> Sign Out
              </button>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* FORM */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Contract #">
                <input className="input" value={contractNumber} onChange={(e) => setContractNumber(e.target.value)} />
              </Field>
              <Field label="Date">
                <input className="input" value={date} disabled />
              </Field>
            </div>

            <div className="border-t border-neutral-100 pt-4 space-y-4">
              <Field label="Client Name">
                <input className="input" value={clientName} onChange={(e) => setClientName(e.target.value)} />
              </Field>
              <Field label="Client Company (optional)">
                <input className="input" value={clientCompany} onChange={(e) => setClientCompany(e.target.value)} />
              </Field>
              <Field label="Client Email">
                <input className="input" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
              </Field>
            </div>

            <div className="border-t border-neutral-100 pt-4 space-y-4">
              <Field label="Project Title">
                <input className="input" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} />
              </Field>
              <Field label="Scope of Work">
                <textarea className="input" rows={3} value={scope} onChange={(e) => setScope(e.target.value)} />
              </Field>
              <Field label="Deliverables">
                <textarea className="input" rows={2} value={deliverables} onChange={(e) => setDeliverables(e.target.value)} />
              </Field>
              <Field label="Timeline">
                <input className="input" value={timeline} onChange={(e) => setTimeline(e.target.value)} placeholder="e.g. 3 weeks from signing, delivered in 2 milestones" />
              </Field>
            </div>

            <div className="border-t border-neutral-100 pt-4 grid grid-cols-2 gap-4">
              <Field label={`Price (${branding.currency.code})`}>
                <input type="number" className="input" value={price} onChange={(e) => setPrice(Number(e.target.value))} onFocus={(e) => e.target.select()} />
              </Field>
              <Field label="Payment Method">
                <input className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} />
              </Field>
              <Field label="Payment Terms">
                <input className="input" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} />
              </Field>
              <Field label="Revision Rounds">
                <input type="number" className="input" value={revisionRounds} onChange={(e) => setRevisionRounds(Number(e.target.value))} />
              </Field>
            </div>

            <div className="border-t border-neutral-100 pt-4 space-y-4">
              <Field label="Usage Rights">
                <textarea className="input" rows={2} value={usageRights} onChange={(e) => setUsageRights(e.target.value)} />
              </Field>
              <Field label="Additional Terms (optional)">
                <textarea className="input" rows={2} value={additionalTerms} onChange={(e) => setAdditionalTerms(e.target.value)} />
              </Field>
            </div>

            <div className="border-t border-neutral-100 pt-4 space-y-2">
              <button
                onClick={handleSendForSignature}
                disabled={sendStatus.state === "sending"}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-neutral-900 text-white py-2.5 text-sm font-medium hover:bg-neutral-800 transition disabled:opacity-50"
              >
                <Send size={16} />
                {sendStatus.state === "sending" ? "Sending for Signature…" : "Send for Signature"}
              </button>

              {sendStatus.state === "sent" && (
                <p className="text-xs text-green-600">
                  ✓ Sent — {clientName || "the client"} will receive a signing email.
                </p>
              )}
              {sendStatus.state === "error" && (
                <p className="text-xs text-red-600">✗ {sendStatus.message}</p>
              )}

              <div onClick={() => logToCRM({
                type: "Contract",
                status: "Downloaded",
                ...contractData,
              })}>
                <PDFDownloadLink
                  document={<ContractPDF data={contractData} />}
                  fileName={`${contractNumber || "contract"}.pdf`}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-neutral-300 text-neutral-700 py-2.5 text-sm font-medium hover:bg-neutral-50 transition"
                >
                  {({ loading }) => (
                    <>
                      <Download size={16} /> {loading ? "Preparing PDF…" : "Download Unsigned PDF Copy"}
                    </>
                  )}
                </PDFDownloadLink>
              </div>
            </div>
          </div>

          {/* PREVIEW */}
          <div>
            <div className="bg-white p-6 rounded-xl border border-neutral-200">
              <h2 className="text-xl font-semibold mb-1 text-neutral-900">Contract Preview</h2>
              <p className="text-sm text-neutral-500 mb-6">This is how your contract will look. Update the form to see changes.</p>
              <div className="flex justify-center">
                <PDFPreview doc={<ContractPDF data={contractData} />} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-neutral-500 mb-1">{label}</span>
      {children}
    </label>
  );
}
