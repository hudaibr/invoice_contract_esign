"use client";

import { useState, useEffect } from "react";
import { branding } from "@/lib/branding";
import { LogOut, RefreshCw, CreditCard, Trash2, Download, Eye, X } from "lucide-react";
import { signOutAction } from "@/lib/actions";

interface LocalInvoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  totalAmount: number;
  currencyCode: string;
  invoiceData: Record<string, unknown>;
  createdAt: string;
}

export default function InvoicesStatusPage() {
  const [invoices, setInvoices] = useState<LocalInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<LocalInvoice | null>(null);

  async function fetchInvoices() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/invoices");
      if (!res.ok) throw new Error("Failed to load");
      setInvoices(await res.json());
    } catch {
      setError("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchInvoices(); }, []);

  async function deleteInvoice(id: string) {
    try {
      await fetch(`/api/invoices?id=${id}`, { method: "DELETE" });
      setMsg("Deleted");
      fetchInvoices();
    } catch {
      setMsg("Delete failed");
    }
  }

  async function sendPaypal(inv: LocalInvoice) {
    setSendingId(inv.id);
    setMsg("");
    try {
      const res = await fetch("/api/paypal/invoice/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inv.invoiceData),
      });
      if (res.ok) {
        setMsg("PayPal invoice sent!");
      } else {
        const err = await res.json();
        setMsg(err.error ?? "Failed");
      }
    } catch {
      setMsg("Network error");
    } finally {
      setSendingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 py-10 px-4">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">My Invoices</h1>
            <p className="text-sm text-neutral-500">{branding.agencyName}</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={fetchInvoices} className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900">
              <RefreshCw size={14} /> Refresh
            </button>
            <a href="/invoices" className="text-sm text-[#3FBB43] hover:underline">New Invoice</a>
            <a href="/paypal/status" className="text-sm text-[#3FBB43] hover:underline">PayPal</a>
            <form action={signOutAction}>
              <button className="text-sm text-neutral-400 hover:text-red-500 flex items-center gap-1">
                <LogOut size={14} /> Sign Out
              </button>
            </form>
          </div>
        </div>

        {msg && (
          <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-700 text-center">{msg}</div>
        )}

        {loading ? (
          <div className="text-center py-20 text-sm text-neutral-400">Loading...</div>
        ) : error ? (
          <div className="text-center py-20 text-sm text-red-500">{error}</div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-20 text-sm text-neutral-400">
            No invoices yet. Create one from the Invoice Generator.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50">
                    <th className="text-left px-4 py-3 font-medium text-neutral-600">Invoice</th>
                    <th className="text-left px-4 py-3 font-medium text-neutral-600">Client</th>
                    <th className="text-left px-4 py-3 font-medium text-neutral-600">Amount</th>
                    <th className="text-left px-4 py-3 font-medium text-neutral-600">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-neutral-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-neutral-50 hover:bg-neutral-50">
                      <td className="px-4 py-3 font-medium">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3">
                        <div>{inv.clientName}</div>
                        <div className="text-xs text-neutral-400">{inv.clientEmail}</div>
                      </td>
                      <td className="px-4 py-3">{inv.currencyCode} {inv.totalAmount.toFixed(2)}</td>
                      <td className="px-4 py-3 text-xs text-neutral-400">
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => setSelectedInvoice(inv)} className="p-1 text-neutral-400 hover:text-blue-600" title="View">
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => sendPaypal(inv)}
                            disabled={sendingId === inv.id}
                            className="p-1 text-neutral-400 hover:text-[#0070BA] disabled:opacity-40"
                            title="Send via PayPal"
                          >
                            <CreditCard size={14} />
                          </button>
                          <button onClick={() => deleteInvoice(inv.id)} className="p-1 text-neutral-400 hover:text-red-600" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-xl border border-neutral-200 w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-xl">
              <div className="flex items-center justify-between p-4 border-b border-neutral-100">
                <h2 className="font-bold text-neutral-900">{selectedInvoice.invoiceNumber}</h2>
                <button onClick={() => setSelectedInvoice(null)} className="p-1 text-neutral-400 hover:text-neutral-900">
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 space-y-3 text-sm">
                <div className="flex justify-between border-b border-neutral-50 pb-2">
                  <span className="text-neutral-500">Client</span>
                  <span className="font-medium text-neutral-900 text-right max-w-[60%]">{selectedInvoice.clientName}</span>
                </div>
                <div className="flex justify-between border-b border-neutral-50 pb-2">
                  <span className="text-neutral-500">Email</span>
                  <span className="font-medium text-neutral-900 text-right max-w-[60%]">{selectedInvoice.clientEmail}</span>
                </div>
                {selectedInvoice.clientPhone && (
                  <div className="flex justify-between border-b border-neutral-50 pb-2">
                    <span className="text-neutral-500">Phone</span>
                    <span className="font-medium text-neutral-900 text-right max-w-[60%]">{selectedInvoice.clientPhone}</span>
                  </div>
                )}
                <div className="flex justify-between border-b border-neutral-50 pb-2">
                  <span className="text-neutral-500">Amount</span>
                  <span className="font-medium text-neutral-900">{selectedInvoice.currencyCode} {selectedInvoice.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-b border-neutral-50 pb-2">
                  <span className="text-neutral-500">Created</span>
                  <span className="font-medium text-neutral-900">{new Date(selectedInvoice.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => { sendPaypal(selectedInvoice); setSelectedInvoice(null); }}
                    disabled={sendingId === selectedInvoice.id}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#0070BA] text-white py-2 text-sm font-medium hover:bg-[#005a94] transition disabled:opacity-40"
                  >
                    <CreditCard size={14} /> Send via PayPal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
