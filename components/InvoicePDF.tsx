import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { branding } from "@/lib/branding";
import type { InvoiceData } from "@/lib/types";

const c = branding.colors;

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, color: c.text, fontFamily: "Helvetica" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30 },
  logo: { width: 130, height: 55, objectFit: "contain" },
  agencyName: { fontSize: 16, fontWeight: 700, color: c.text },
  tagline: { fontSize: 9, color: c.muted, marginTop: 2 },
  invoiceTitle: { fontSize: 24, fontWeight: 700, color: c.primary, textAlign: "right" },
  invoiceMeta: { fontSize: 9, color: c.muted, textAlign: "right", marginTop: 4 },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 8, color: c.muted, textTransform: "uppercase", marginBottom: 4, letterSpacing: 0.5 },
  billToName: { fontSize: 11, fontWeight: 700 },
  billToLine: { fontSize: 9, color: c.muted, marginTop: 1 },
  table: { marginTop: 10, borderTop: `1pt solid ${c.border}` },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottom: `1pt solid ${c.border}`,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottom: `1pt solid ${c.border}`,
  },
  colDesc: { flex: 4 },
  colQty: { flex: 1, textAlign: "right" },
  colRate: { flex: 1.5, textAlign: "right" },
  colAmount: { flex: 1.5, textAlign: "right" },
  thText: { fontSize: 8, color: c.muted, textTransform: "uppercase", letterSpacing: 0.5 },
  totalsBlock: { marginTop: 16, alignItems: "flex-end" },
  totalsRow: { flexDirection: "row", width: 200, justifyContent: "space-between", paddingVertical: 3 },
  totalsLabel: { color: c.muted },
  grandTotalRow: {
    flexDirection: "row",
    width: 200,
    justifyContent: "space-between",
    paddingTop: 8,
    marginTop: 4,
    borderTop: `1pt solid ${c.border}`,
  },
  grandTotalLabel: { fontSize: 11, fontWeight: 700 },
  grandTotalValue: { fontSize: 11, fontWeight: 700, color: c.primary },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    paddingTop: 12,
    borderTop: `1pt solid ${c.border}`,
  },
  footerNote: { fontSize: 8, color: c.muted, textAlign: "center" },
  footerContact: { fontSize: 8, color: c.muted, textAlign: "center", marginTop: 3 },
});

function money(n: number) {
  return `${branding.currency.symbol}${n.toFixed(2)}`;
}

export function InvoicePDF({ data }: { data: InvoiceData }) {
  const subtotal = data.lineItems.reduce((sum, li) => sum + li.quantity * li.rate, 0);
  const taxAmount = subtotal * (data.taxRate / 100);
  const total = subtotal + taxAmount;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            {branding.logoUrl ? (
              <Image src={branding.logoUrl} style={styles.logo} />
            ) : (
              <Text style={styles.agencyName}>{branding.agencyName}</Text>
            )}
            <Text style={styles.tagline}>{branding.tagline}</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceMeta}>#{data.invoiceNumber}</Text>
            <Text style={styles.invoiceMeta}>Issued: {data.issueDate}</Text>
            <Text style={styles.invoiceMeta}>Due: {data.dueDate}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Bill To</Text>
          <Text style={styles.billToName}>{data.clientName}</Text>
          {data.clientEmail ? <Text style={styles.billToLine}>{data.clientEmail}</Text> : null}
          {data.clientPhone ? <Text style={styles.billToLine}>{data.clientPhone}</Text> : null}
          {data.clientAddress ? <Text style={styles.billToLine}>{data.clientAddress}</Text> : null}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.colDesc, styles.thText]}>Description</Text>
            <Text style={[styles.colQty, styles.thText]}>Qty</Text>
            <Text style={[styles.colRate, styles.thText]}>Rate</Text>
            <Text style={[styles.colAmount, styles.thText]}>Amount</Text>
          </View>
          {data.lineItems.map((li) => (
            <View style={styles.tableRow} key={li.id}>
              <Text style={styles.colDesc}>{li.description}</Text>
              <Text style={styles.colQty}>{li.quantity}</Text>
              <Text style={styles.colRate}>{money(li.rate)}</Text>
              <Text style={styles.colAmount}>{money(li.quantity * li.rate)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text>{money(subtotal)}</Text>
          </View>
          {data.taxRate > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Sales Tax ({data.taxRate}%)</Text>
              <Text>{money(taxAmount)}</Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total Due</Text>
            <Text style={styles.grandTotalValue}>{money(total)}</Text>
          </View>
        </View>

        {data.paymentMethod ? (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionLabel}>Payment Method</Text>
            <Text style={styles.billToLine}>{data.paymentMethod}</Text>
          </View>
        ) : null}

        {data.notes ? (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionLabel}>Notes</Text>
            <Text style={styles.billToLine}>{data.notes}</Text>
          </View>
        ) : null}

        <View style={styles.footer}>
          <Text style={styles.footerNote}>{branding.invoice.footerNote}</Text>
          <Text style={styles.footerContact}>
            {branding.agencyName} · {branding.email} · {branding.phone} · {branding.website}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
