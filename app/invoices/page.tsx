"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { branding } from "@/lib/branding";
import type { InvoiceData, InvoiceLineItem } from "@/lib/types";
import { Plus, Trash2, Download, LogOut } from "lucide-react";
import { signOutAction } from "@/lib/actions";
import { logToCRM } from "@/lib/crm";

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  { ssr: false, loading: () => <button className="btn-primary" disabled>Loading PDF engine…</button> }
);

import { InvoicePDF } from "@/components/InvoicePDF";

const PDFPreview = dynamic(
  () => import("@/components/PDFPreview"),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full text-sm text-neutral-400">Loading preview…</div> }
);

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function InvoicesPage() {
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${new Date().getFullYear()}-001`);
  const [issueDate, setIssueDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState(addDays(todayISO(), branding.invoice.defaultDueDays));
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Paypal");
  const [notes, setNotes] = useState("");
  const [taxRate, setTaxRate] = useState(branding.invoice.defaultTaxRate);
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    { id: uid(), description: "", quantity: 1, rate: 0 },
  ]);

  const subtotal = lineItems.reduce((s, li) => s + li.quantity * li.rate, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const invoiceData: InvoiceData = {
    invoiceNumber,
    issueDate,
    dueDate,
    clientName: clientName || "Client Name",
    clientEmail,
    clientPhone,
    clientAddress,
    lineItems,
    taxRate,
    notes,
    paymentMethod,
  };

  function updateLine(id: string, patch: Partial<InvoiceLineItem>) {
    setLineItems((items) => items.map((li) => (li.id === id ? { ...li, ...patch } : li)));
  }

  function addLine() {
    setLineItems((items) => [...items, { id: uid(), description: "", quantity: 1, rate: 0 }]);
  }

  function removeLine(id: string) {
    setLineItems((items) => (items.length > 1 ? items.filter((li) => li.id !== id) : items));
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
              <h1 className="text-2xl font-bold text-neutral-900">Invoice Generator</h1>
              <p className="text-sm text-neutral-500">{branding.agencyName}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="/contracts" className="text-sm text-[#3FBB43] hover:underline">
              Go to Contracts →
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
              <Field label="Invoice #">
                <input className="input" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
              </Field>
              <Field label="Sales Tax (%)">
                <input
                  type="number"
                  className="input"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                />
              </Field>
              <Field label="Issue Date">
                <input
                  type="date"
                  className="input"
                  value={issueDate}
                  onChange={(e) => {
                    setIssueDate(e.target.value);
                    setDueDate(addDays(e.target.value, branding.invoice.defaultDueDays));
                  }}
                />
              </Field>
              <Field label="Due Date">
                <input type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </Field>
            </div>

            <div className="border-t border-neutral-100 pt-4 space-y-4">
              <Field label="Client Name">
                <input className="input" value={clientName} onChange={(e) => setClientName(e.target.value)} />
              </Field>
              <Field label="Client Email">
                <input className="input" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
              </Field>
              <Field label="Client Phone">
                <input className="input" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />
              </Field>
              <Field label="Client Address (optional)">
                <textarea className="input" rows={2} value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} />
              </Field>
            </div>

            <div className="border-t border-neutral-100 pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-700">Line Items</span>
                <button onClick={addLine} className="text-xs flex items-center gap-1 text-[#3FBB43] hover:underline">
                  <Plus size={14} /> Add item
                </button>
              </div>
              <div className="space-y-2">
                {lineItems.map((li) => (
                  <div key={li.id} className="rounded-lg border border-neutral-100 p-2 space-y-2">
                    <input
                      className="input w-full"
                      placeholder="Description"
                      value={li.description}
                      onChange={(e) => updateLine(li.id, { description: e.target.value })}
                    />
                    <div className="flex gap-2 items-center">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-neutral-400 leading-none mb-0.5">Qty</span>
                        <input
                          type="number"
                          className="input w-20"
                          value={li.quantity}
                          onChange={(e) => updateLine(li.id, { quantity: Number(e.target.value) })}
                        />
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-neutral-400 leading-none mb-0.5">Price ($)</span>
                        <input
                          type="number"
                          className="input w-24"
                          value={li.rate}
                          onChange={(e) => updateLine(li.id, { rate: Number(e.target.value) })}
                          onFocus={(e) => e.target.select()}
                        />
                      </div>
                      <button onClick={() => removeLine(li.id)} className="ml-auto p-2 text-neutral-400 hover:text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-neutral-100 pt-4 space-y-4">
              <Field label="Payment Method">
                <input className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} />
              </Field>
              <Field label="Notes">
                <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </Field>
            </div>

            <div className="border-t border-neutral-100 pt-4 flex justify-between text-sm">
              <span className="text-neutral-500">Total Due</span>
              <span className="font-semibold text-[#3FBB43]">
                {branding.currency.symbol}
                {total.toFixed(2)}
              </span>
            </div>

            <div onClick={() => logToCRM({
              type: "Invoice",
              status: "Downloaded",
              subtotal: subtotal.toFixed(2),
              taxAmount: taxAmount.toFixed(2),
              total: total.toFixed(2),
              ...invoiceData,
              lineItems: JSON.stringify(lineItems),
            })}>
              <PDFDownloadLink
                document={<InvoicePDF data={invoiceData} />}
                fileName={`${invoiceNumber || "invoice"}.pdf`}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#3FBB43] text-white py-2.5 text-sm font-medium hover:bg-[#2E8A32] transition"
              >
                {({ loading }) => (
                  <>
                    <Download size={16} /> {loading ? "Preparing PDF…" : "Download Invoice PDF"}
                  </>
                )}
              </PDFDownloadLink>
            </div>
          </div>

          {/* PREVIEW */}
          <div>
            <div className="bg-white p-6 rounded-xl border border-neutral-200">
              <h2 className="text-xl font-semibold mb-1 text-neutral-900">Invoice Preview</h2>
              <p className="text-sm text-neutral-500 mb-6">This is how your invoice will look. Update the form to see changes.</p>
              <div className="flex justify-center">
                <PDFPreview doc={<InvoicePDF data={invoiceData} />} />
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
