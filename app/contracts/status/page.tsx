"use client";

import { useState, useEffect } from "react";
import { branding } from "@/lib/branding";
import { StatusBadge } from "@/components/esign/status-badge";
import { AuditTimeline } from "@/components/esign/audit-timeline";
import { LogOut, RefreshCw } from "lucide-react";
import { signOutAction } from "@/lib/actions";

interface Contract {
  id: string;
  contractNumber: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
  pdfUrl: string | null;
  signedPdfUrl: string | null;
  auditCertificateUrl: string | null;
  contractData: Record<string, unknown> | null;
}

interface ContractWithEvents extends Contract {
  events: { event: string; timestamp: string }[];
}

const TABS = [
  { key: "", label: "All" },
  { key: "pending_client", label: "Pending" },
  { key: "client_viewing", label: "Viewing" },
  { key: "completed", label: "Completed" },
  { key: "draft", label: "Draft" },
  { key: "expired", label: "Expired" },
  { key: "cancelled", label: "Cancelled" },
];

export default function ContractStatusPage() {
  const [filter, setFilter] = useState("");
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedEvents, setExpandedEvents] = useState<{ event: string; timestamp: string }[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchContracts() {
    setLoading(true);
    try {
      const res = await fetch("/api/esign/status/list");
      const data = await res.json();
      setContracts(data.contracts ?? []);
    } catch {
      setContracts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchContracts();
  }, []);

  async function toggleTimeline(contractId: string) {
    if (expandedId === contractId) {
      setExpandedId(null);
      setExpandedEvents([]);
      return;
    }
    try {
      const res = await fetch(`/api/esign/status/${contractId}`);
      const data = await res.json();
      setExpandedId(contractId);
      setExpandedEvents(data.events ?? []);
    } catch {
      setExpandedEvents([]);
    }
  }

  const filtered = filter
    ? contracts.filter((c) => c.status === filter)
    : contracts;

  return (
    <main className="min-h-screen bg-neutral-50 py-10 px-4">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Contract Status</h1>
            <p className="text-sm text-neutral-500">{branding.agencyName}</p>
          </div>
          <div className="flex items-center gap-4">
            <a href="/contracts" className="text-sm text-[#3FBB43] hover:underline">
              Generator →
            </a>
            <a href="/ncp-payments" className="text-sm text-[#3FBB43] hover:underline">
              NCP Payments
            </a>
            <form action={signOutAction}>
              <button className="text-sm text-neutral-400 hover:text-red-500 flex items-center gap-1">
                <LogOut size={14} /> Sign Out
              </button>
            </form>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`px-3 py-1.5 text-sm rounded-lg transition ${
                filter === t.key
                  ? "bg-neutral-900 text-white"
                  : "bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300"
              }`}
            >
              {t.label}
            </button>
          ))}
          <button
            onClick={fetchContracts}
            className="ml-auto px-3 py-1.5 text-sm rounded-lg bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300 flex items-center gap-1"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center text-sm text-neutral-400">
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center text-sm text-neutral-400">
            No contracts found.
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((c) => (
              <div key={c.id} className="bg-white rounded-xl border border-neutral-200">
                <button
                  onClick={() => toggleTimeline(c.id)}
                  className="w-full flex items-center gap-4 px-5 py-3 text-left hover:bg-neutral-50 transition rounded-xl"
                >
                  <span className="font-mono text-sm text-neutral-900 min-w-[160px]">
                    {c.contractNumber}
                  </span>
                  <span className="text-sm text-neutral-500 flex-1 truncate">
                    {(c.contractData?.clientName as string) ?? "—"}
                  </span>
                  <StatusBadge status={c.status} />
                  <span className="text-xs text-neutral-400 min-w-[140px] text-right">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                </button>

                {expandedId === c.id && (
                  <div className="border-t border-neutral-100 px-5 py-4">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">
                          Audit Timeline
                        </h3>
                        <AuditTimeline events={expandedEvents} />
                      </div>
                      <div>
                        <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">
                          Documents
                        </h3>
                        <div className="space-y-2">
                          {c.pdfUrl && (
                            <a href={c.pdfUrl} target="_blank" className="block text-sm text-[#3FBB43] hover:underline">
                              View Unsigned PDF ↗
                            </a>
                          )}
                          {c.signedPdfUrl && (
                            <a href={c.signedPdfUrl} target="_blank" className="block text-sm text-[#3FBB43] hover:underline">
                              View Signed PDF ↗
                            </a>
                          )}
                          {c.auditCertificateUrl && (
                            <a href={c.auditCertificateUrl} target="_blank" className="block text-sm text-[#3FBB43] hover:underline">
                              View Audit Certificate ↗
                            </a>
                          )}
                          {!c.pdfUrl && !c.signedPdfUrl && (
                            <p className="text-sm text-neutral-400">No documents available.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
