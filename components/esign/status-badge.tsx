interface Props {
  status: string;
}

const styles: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: "bg-neutral-100", text: "text-neutral-600", label: "Draft" },
  pending_client: { bg: "bg-amber-50", text: "text-amber-700", label: "Pending Signature" },
  client_viewing: { bg: "bg-blue-50", text: "text-blue-700", label: "Client Viewing" },
  client_signed: { bg: "bg-purple-50", text: "text-purple-700", label: "Client Signed" },
  completed: { bg: "bg-green-50", text: "text-green-700", label: "Completed" },
  expired: { bg: "bg-red-50", text: "text-red-700", label: "Expired" },
  cancelled: { bg: "bg-neutral-100", text: "text-neutral-500", label: "Cancelled" },
};

export function StatusBadge({ status }: Props) {
  const s = styles[status] ?? { bg: "bg-neutral-100", text: "text-neutral-600", label: status };
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}
