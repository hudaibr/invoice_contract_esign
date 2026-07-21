"use client";

import { useState, useEffect } from "react";
import { branding } from "@/lib/branding";
import { LogOut, RefreshCw, Bell, Trash2, XCircle, Send, Download, List, Eye, X } from "lucide-react";
import { signOutAction } from "@/lib/actions";

interface PaypalInvoice {
  id: string;
  paypalInvoiceId: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  totalAmount: number;
  currencyCode: string;
  status: string;
  paypalLink: string | null;
  createdAt: string;
  paidAt: string | null;
  paidAmount: number | null;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-neutral-100 text-neutral-600",
  SENT: "bg-blue-100 text-blue-700",
  PAID: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-yellow-100 text-yellow-700",
  DRAFT_ERROR: "bg-orange-100 text-orange-700",
};

export default function PaypalStatusPage() {
  const [invoices, setInvoices] = useState<PaypalInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [paypalList, setPaypalList] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<Record<string, unknown> | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  async function fetchInvoices() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/paypal/invoice/status");
      if (!res.ok) throw new Error("Failed to load");
      setInvoices(await res.json());
    } catch {
      setError("Failed to load PayPal invoices");
    } finally {
      setLoading(false);
    }
  }

  async function fetchFromPaypal() {
    setPaypalList(true);
    setError("");
    try {
      const res = await fetch("/api/paypal/invoice/status?list=paypal");
      if (!res.ok) throw new Error("Failed to load from PayPal");
      const data = await res.json();
      const items: PaypalInvoice[] = (data.items || []).map((inv: Record<string, unknown>) => {
        const detail = inv.detail as Record<string, unknown> | undefined;
        const amount = inv.amount as Record<string, unknown> | undefined;
        const recipient = (inv.primary_recipients as Array<Record<string, unknown>> | undefined)?.[0];
        const billingInfo = recipient?.billing_info as Record<string, unknown> | undefined;
        const nameObj = billingInfo?.name as Record<string, unknown> | undefined;
        return {
          id: inv.id as string,
          paypalInvoiceId: inv.id as string,
          invoiceNumber: (detail?.invoice_number as string) || "",
          clientName: (nameObj?.given_name as string) || "",
          clientEmail: (billingInfo?.email_address as string) || "",
          totalAmount: Number((amount?.value as string) || 0),
          currencyCode: (amount?.currency_code as string) || "USD",
          status: inv.status as string,
          paypalLink: `https://www.paypal.com/invoices/payerView/details/${inv.id}`,
          createdAt: (detail?.invoice_date as string) || "",
          paidAt: null,
          paidAmount: null,
        };
      });
      setInvoices(items);
    } catch {
      setError("Failed to load from PayPal");
    } finally {
      setPaypalList(false);
    }
  }

  async function doAction(action: string, paypalInvoiceId: string) {
    setActionMsg("");
    try {
      const res = await fetch(`/api/paypal/invoice/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paypalInvoiceId }),
      });
      if (res.ok) {
        setActionMsg(`${action} successful`);
        fetchInvoices();
      } else {
        const err = await res.json();
        setActionMsg(`${action} failed: ${err.error}`);
      }
    } catch {
      setActionMsg(`${action} failed`);
    }
  }

  async function setupReminders() {
    setActionMsg("");
    try {
      const res = await fetch("/api/paypal/invoice/reminders", { method: "POST" });
      if (res.ok) {
        setActionMsg("Auto reminders enabled");
      } else {
        const err = await res.json();
        setActionMsg(`Reminders setup failed: ${err.error}`);
      }
    } catch {
      setActionMsg("Reminders setup failed");
    }
  }

  async function showDetails(paypalInvoiceId: string) {
    setSelectedId(paypalInvoiceId);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const res = await fetch(`/api/paypal/invoice/status?paypalInvoiceId=${paypalInvoiceId}`);
      if (res.ok) setDetailData(await res.json());
    } catch { /* ignore */ }
    finally { setDetailLoading(false); }
  }

  useEffect(() => { fetchInvoices(); }, []);

  return (
    <main className="min-h-screen bg-neutral-50 py-10 px-4">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">PayPal Invoices</h1>
            <p className="text-sm text-neutral-500">{branding.agencyName}</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={fetchFromPaypal} disabled={paypalList} className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900">
              <List size={14} /> {paypalList ? "Syncing..." : "Sync from PayPal"}
            </button>
            <button onClick={setupReminders} className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900">
              <Bell size={14} /> Auto Reminders
            </button>
            <button onClick={fetchInvoices} className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900">
              <RefreshCw size={14} /> Refresh
            </button>
            <a href="/invoices" className="text-sm text-[#3FBB43] hover:underline">Invoices</a>
            <form action={signOutAction}>
              <button className="text-sm text-neutral-400 hover:text-red-500 flex items-center gap-1">
                <LogOut size={14} /> Sign Out
              </button>
            </form>
          </div>
        </div>

        {actionMsg && (
          <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-700 text-center">
            {actionMsg}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-sm text-neutral-400">Loading...</div>
        ) : error ? (
          <div className="text-center py-20 text-sm text-red-500">{error}</div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-20 text-sm text-neutral-400">
            No PayPal invoices yet. Send one from the Invoice Generator.
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
                    <th className="text-left px-4 py-3 font-medium text-neutral-600">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-neutral-600">Sent</th>
                    <th className="text-left px-4 py-3 font-medium text-neutral-600">Paid</th>
                    <th className="text-left px-4 py-3 font-medium text-neutral-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-neutral-50 hover:bg-neutral-50">
                      <td className="px-4 py-3 font-medium">
                        <div>{inv.invoiceNumber}</div>
                        <a href={inv.paypalLink ?? "#"} target="_blank" className="text-[10px] text-[#0070BA] hover:underline">
                          {inv.paypalInvoiceId.slice(0, 18)}...
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <div>{inv.clientName}</div>
                        <div className="text-xs text-neutral-400">{inv.clientEmail}</div>
                      </td>
                      <td className="px-4 py-3">
                        {inv.currencyCode} {inv.totalAmount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[inv.status] || "bg-neutral-100 text-neutral-600"}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-neutral-400">
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-xs text-neutral-400">
                        {inv.paidAt ? new Date(inv.paidAt).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          <button onClick={() => showDetails(inv.paypalInvoiceId)} className="p-1 text-neutral-400 hover:text-blue-600" title="View Details">
                            <Eye size={14} />
                          </button>
                          {inv.paypalLink && (
                            <a href={inv.paypalLink} target="_blank" className="p-1 text-neutral-400 hover:text-[#0070BA]" title="View on PayPal">
                              <Send size={14} />
                            </a>
                          )}
                          <button onClick={() => doAction("cancel", inv.paypalInvoiceId)} className="p-1 text-neutral-400 hover:text-red-600" title="Cancel">
                            <XCircle size={14} />
                          </button>
                          <button onClick={() => doAction("remind", inv.paypalInvoiceId)} className="p-1 text-neutral-400 hover:text-blue-600" title="Send Reminder">
                            <Bell size={14} />
                          </button>
                          <button onClick={() => doAction("delete", inv.paypalInvoiceId)} className="p-1 text-neutral-400 hover:text-red-600" title="Delete">
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

        {/* Detail Panel */}
        {selectedId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-xl border border-neutral-200 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-xl">
              <div className="flex items-center justify-between p-4 border-b border-neutral-100">
                <h2 className="font-bold text-neutral-900">Invoice Details</h2>
                <button onClick={() => { setSelectedId(null); setDetailData(null); }} className="p-1 text-neutral-400 hover:text-neutral-900">
                  <X size={18} />
                </button>
              </div>
              {detailLoading ? (
                <div className="p-8 text-center text-sm text-neutral-400">Loading...</div>
              ) : detailData ? (
                <div className="p-4 space-y-3 text-sm">
                  {(() => {
                    const d = detailData.detail as Record<string, unknown> | undefined;
                    const amt = detailData.amount as Record<string, unknown> | undefined;
                    const recipients = detailData.primary_recipients as Array<Record<string, unknown>> | undefined;
                    const billing = recipients?.[0]?.billing_info as Record<string, unknown> | undefined;
                    const payerName = billing?.name as Record<string, unknown> | undefined;
                    const paymentTerm = d?.payment_term as Record<string, unknown> | undefined;
                    const items = detailData.items as Array<Record<string, unknown>> | undefined;

                    const fields: [string, string | undefined][] = [
                      ["ID", selectedId],
                      ["Status", detailData.status as string],
                      ["Invoice Number", d?.invoice_number as string],
                      ["Reference", d?.reference as string],
                      ["Currency", amt?.currency_code as string],
                      ["Total", amt?.value as string],
                      ["Date", d?.invoice_date as string],
                      ["Due Date", paymentTerm?.due_date as string],
                      ["Client", payerName?.given_name as string],
                      ["Client Email", billing?.email_address as string],
                      ["Created", detailData.create_time as string],
                      ["Paid Date", d?.paid_date as string],
                    ];

                    return (
                      <>
                        {fields.map(([label, value]) =>
                          value ? (
                            <div key={label} className="flex justify-between border-b border-neutral-50 pb-2">
                              <span className="text-neutral-500">{label}</span>
                              <span className="font-medium text-neutral-900 text-right max-w-[60%] break-all">{value}</span>
                            </div>
                          ) : null
                        )}
                        {items && items.length > 0 && (
                          <>
                            <div className="font-bold text-neutral-900 pt-2">Line Items</div>
                            {items.map((item, i) => {
                              const unitAmt = item.unit_amount as Record<string, unknown> | undefined;
                              return (
                                <div key={i} className="flex justify-between text-xs border-b border-neutral-50 pb-1">
                                  <span>{item.name as string} × {item.quantity as string}</span>
                                  <span className="font-medium">{unitAmt?.currency_code as string} {unitAmt?.value as string}</span>
                                </div>
                              );
                            })}
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="p-8 text-center text-sm text-red-500">Failed to load details</div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
