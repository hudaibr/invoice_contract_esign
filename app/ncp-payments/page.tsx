"use client";

import { useState, useEffect, useCallback } from "react";
import { branding } from "@/lib/branding";
import { StatusBadge } from "@/components/esign/status-badge";
import { LogOut, Search, RefreshCw, Download, Calendar, X } from "lucide-react";
import { signOutAction } from "@/lib/actions";

interface NcpPayment {
  id: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  currencyCode: string;
  status: string;
  paypalCartId: string;
  paypalCaptureId: string;
  paidAt: string;
  createdAt: string;
}

interface ApiResponse {
  data: NcpPayment[];
  total: number;
  page: number;
  totalPages: number;
}

interface SyncResult {
  synced: number;
  skipped: number;
  errors: string[];
}

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "COMPLETED", label: "Completed" },
  { value: "REFUNDED", label: "Refunded" },
  { value: "PENDING", label: "Pending" },
  { value: "DENIED", label: "Denied" },
];

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function NcpPaymentsPage() {
  const [payments, setPayments] = useState<NcpPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncStartDate, setSyncStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 90);
    return d.toISOString().split("T")[0];
  });
  const [syncEndDate, setSyncEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter) params.set("status", statusFilter);
      if (dateFrom) params.set("dateFrom", dateFrom + "T00:00:00Z");
      if (dateTo) params.set("dateTo", dateTo + "T23:59:59Z");

      const res = await fetch(`/api/ncp-payments?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data: ApiResponse = await res.json();
      setPayments(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error("Fetch error:", err);
      setPayments([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchPayments, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchPayments]);

  const handleSync = async () => {
    setSyncLoading(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/ncp-payments/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: syncStartDate + "T00:00:00Z",
          endDate: syncEndDate + "T23:59:59Z",
        }),
      });
      const data: SyncResult = await res.json();
      setSyncResult(data);
      if (data.synced > 0) fetchPayments();
    } catch (err) {
      setSyncResult({ synced: 0, skipped: 0, errors: [err instanceof Error ? err.message : "Sync failed"] });
    } finally {
      setSyncLoading(false);
    }
  };

  const handleRefresh = () => {
    setPage(1);
    fetchPayments();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <main className="min-h-screen bg-neutral-50 py-10 px-4">
      <div className="container mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">NCP Payments Tracker</h1>
            <p className="text-sm text-neutral-500">{branding.agencyName} — Sales Team No-Code Payment Links</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a href="/invoices" className="text-sm text-[#3FBB43] hover:underline">Invoices</a>
            <a href="/contracts" className="text-sm text-[#3FBB43] hover:underline">Contracts</a>
            <a href="/contracts/status" className="text-sm text-[#3FBB43] hover:underline">Contract Status</a>
            <form action={signOutAction}>
              <button className="text-sm text-neutral-400 hover:text-red-500 flex items-center gap-1">
                <LogOut size={14} /> Sign Out
              </button>
            </form>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-neutral-200 p-4 mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
            <input
              type="text"
              placeholder="Search name, email, cart ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input w-full pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="input py-2 px-3 min-w-[160px]"
            >
              {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-500 whitespace-nowrap">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                className="input py-2 px-3 w-40"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-500 whitespace-nowrap">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                className="input py-2 px-3 w-40"
              />
            </div>
            {dateFrom || dateTo ? (
              <button
                onClick={() => { setDateFrom(""); setDateTo(""); setPage(1); }}
                className="text-xs text-neutral-500 hover:text-red-500 flex items-center gap-1"
              >
                <X size={14} /> Clear dates
              </button>
            ) : null}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-neutral-300 text-[#3FBB43] focus:ring-[#3FBB43]"
              />
              Auto-refresh (30s)
            </label>
            <button
              onClick={() => setShowSyncModal(true)}
              disabled={syncLoading}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#3FBB43] text-white hover:bg-[#2E8A32] transition"
            >
              <Download size={16} /> Sync Historical
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-xl border border-neutral-200">
          {loading ? (
            <div className="p-8 text-center text-sm text-neutral-400">Loading…</div>
          ) : payments.length === 0 ? (
            <div className="p-8 text-center text-sm text-neutral-400">No NCP payments found.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-100 text-left text-xs font-medium text-neutral-500 uppercase tracking-wide">
                      <th className="pb-3 px-4">Date</th>
                      <th className="pb-3 px-4">Customer</th>
                      <th className="pb-3 px-4">Email</th>
                      <th className="pb-3 px-4 text-right">Amount</th>
                      <th className="pb-3 px-4">Cart ID</th>
                      <th className="pb-3 px-4">Capture ID</th>
                      <th className="pb-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} className="border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer" onClick={() => copyToClipboard(p.paypalCaptureId)}>
                        <td className="py-3 px-4 text-sm text-neutral-900 whitespace-nowrap">{formatDateTime(p.paidAt)}</td>
                        <td className="py-3 px-4 text-sm font-medium text-neutral-900">{p.customerName}</td>
                        <td className="py-3 px-4 text-sm text-neutral-500 truncate max-w-[200px]">{p.customerEmail}</td>
                        <td className="py-3 px-4 text-sm font-semibold text-neutral-900 text-right">{formatCurrency(p.amount, p.currencyCode)}</td>
                        <td className="py-3 px-4 text-sm text-neutral-500 font-mono">{p.paypalCartId}</td>
                        <td className="py-3 px-4 text-sm text-neutral-500 font-mono truncate max-w-[140px]" title={p.paypalCaptureId}>{p.paypalCaptureId}</td>
                        <td className="py-3 px-4"><StatusBadge status={p.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="px-4 py-3 border-t border-neutral-100 flex items-center justify-between">
                  <p className="text-sm text-neutral-500">Page {page} of {totalPages} — {total} total</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 disabled:opacity-50 hover:bg-neutral-50"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 disabled:opacity-50 hover:bg-neutral-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sync Modal */}
        {showSyncModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowSyncModal(false)}>
            <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-semibold mb-4">Sync Historical Payments</h2>
              <p className="text-sm text-neutral-500 mb-6">
                Fetches PayPal Transaction Search API for PLB- cart IDs in the date range.
                Only imports payments not already in the database (deduplicated by Capture ID).
              </p>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={syncStartDate}
                    onChange={(e) => setSyncStartDate(e.target.value)}
                    className="input w-full"
                    max={syncEndDate}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1">End Date</label>
                  <input
                    type="date"
                    value={syncEndDate}
                    onChange={(e) => setSyncEndDate(e.target.value)}
                    className="input w-full"
                    min={syncStartDate}
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>
              {syncResult && (
                <div className="mb-4 p-3 rounded-lg bg-neutral-50 text-sm space-y-1">
                  <div className="font-medium">Result:</div>
                  <div className="text-green-700">✓ Synced: {syncResult.synced}</div>
                  <div className="text-neutral-700">⊘ Skipped (existing): {syncResult.skipped}</div>
                  {syncResult.errors.length > 0 && (
                    <div className="text-red-700">✗ Errors: {syncResult.errors.length}</div>
                  )}
                  {syncResult.errors.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs">Show errors</summary>
                      <ul className="mt-1 text-xs space-y-1">
                        {syncResult.errors.map((e, i) => <li key={i} className="text-red-600">{e}</li>)}
                      </ul>
                    </details>
                  )}
                </div>
              )}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => { setShowSyncModal(false); setSyncResult(null); }}
                  className="px-4 py-2 text-sm rounded-lg border border-neutral-200 hover:bg-neutral-50"
                >
                  Close
                </button>
                <button
                  onClick={handleSync}
                  disabled={syncLoading}
                  className="px-4 py-2 text-sm rounded-lg bg-[#3FBB43] text-white hover:bg-[#2E8A32] disabled:opacity-50"
                >
                  {syncLoading ? "Syncing…" : "Start Sync"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}