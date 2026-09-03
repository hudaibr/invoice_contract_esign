interface Props {
  status: string;
}

const styles: Record<string, { bg: string; text: string; label: string }> = {
  COMPLETED: { bg: "bg-green-50", text: "text-green-700", label: "Completed" },
  PAYMENT: { bg: "bg-green-50", text: "text-green-700", label: "Payment" },
  REFUNDED: { bg: "bg-amber-50", text: "text-amber-700", label: "Refunded" },
  PARTIALLY_REFUNDED: { bg: "bg-amber-50", text: "text-amber-700", label: "Partial Refund" },
  PENDING: { bg: "bg-blue-50", text: "text-blue-700", label: "Pending" },
  DENIED: { bg: "bg-red-50", text: "text-red-700", label: "Denied" },
  FAILED: { bg: "bg-red-50", text: "text-red-700", label: "Failed" },
  VOIDED: { bg: "bg-neutral-100", text: "text-neutral-500", label: "Voided" },
};

export function NcpStatusBadge({ status }: Props) {
  const key = status.toUpperCase();
  const s = styles[key] ?? { bg: "bg-neutral-100", text: "text-neutral-600", label: status };
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}