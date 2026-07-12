interface Event {
  event: string;
  timestamp: string;
}

interface Props {
  events: Event[];
}

const eventLabels: Record<string, string> = {
  contract_created: "Contract Created",
  contract_sent: "Contract Sent",
  email_delivered: "Email Delivered",
  signing_link_opened: "Signing Link Opened",
  document_viewed: "Document Viewed",
  consent_accepted: "Consent Accepted",
  signature_started: "Signature Started",
  signature_completed: "Signature Completed",
  pdf_generated: "PDF Generated",
  company_signed: "Company Signed",
  audit_certificate_generated: "Audit Certificate Generated",
  completion_email_sent: "Completion Email Sent",
  contract_completed: "Contract Completed",
  contract_expired: "Contract Expired",
  contract_cancelled: "Contract Cancelled",
};

export function AuditTimeline({ events }: Props) {
  if (events.length === 0) {
    return <p className="text-sm text-neutral-400">No events recorded.</p>;
  }

  return (
    <div className="space-y-0">
      {events.map((e, i) => {
        const ts = e.timestamp.replace("T", " ").slice(0, 19);
        const label = eventLabels[e.event] ?? e.event;
        const isLast = i === events.length - 1;
        return (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-2.5 h-2.5 rounded-full bg-[#3FBB43] ring-2 ring-white mt-1.5" />
              {!isLast && <div className="w-px flex-1 bg-neutral-200" />}
            </div>
            <div className={`pb-4 ${isLast ? "" : ""}`}>
              <p className="text-sm text-neutral-700">{label}</p>
              <p className="text-xs text-neutral-400">{ts}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
