import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { branding } from "@/lib/branding";
import type { ContractData } from "@/lib/types";

const c = branding.colors;

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, color: c.text, fontFamily: "Helvetica", lineHeight: 1.5 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  logo: { width: 120, height: 50, objectFit: "contain" },
  agencyName: { fontSize: 14, fontWeight: 700 },
  title: { fontSize: 18, fontWeight: 700, color: c.primary, textAlign: "right" },
  meta: { fontSize: 9, color: c.muted, textAlign: "right", marginTop: 3 },
  divider: { borderBottom: `1pt solid ${c.border}`, marginVertical: 16 },
  partiesRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  partyBlock: { width: "48%" },
  partyLabel: { fontSize: 8, color: c.muted, textTransform: "uppercase", marginBottom: 4 },
  partyName: { fontSize: 11, fontWeight: 700 },
  partyLine: { fontSize: 9, color: c.muted, marginTop: 1 },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: c.primaryDark, marginTop: 14, marginBottom: 4 },
  body: { fontSize: 9.5, color: c.text },
  keyValueRow: { flexDirection: "row", marginTop: 3 },
  keyLabel: { width: 130, fontSize: 9.5, color: c.muted },
  keyValue: { fontSize: 9.5, flex: 1 },
  signaturesRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 40 },
  sigBlock: { width: "45%" },
  sigLine: { borderBottom: `1pt solid ${c.text}`, height: 30, marginBottom: 4 },
  sigLabel: { fontSize: 8, color: c.muted },
  auditBox: {
    marginTop: 16,
    padding: 8,
    backgroundColor: "#F9FAFB",
    border: `1pt solid ${c.border}`,
  },
  auditTitle: { fontSize: 7, color: c.muted, textTransform: "uppercase", marginBottom: 3, letterSpacing: 0.5 },
  auditLine: { fontSize: 7, color: c.muted },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    paddingTop: 10,
    borderTop: `1pt solid ${c.border}`,
  },
  footerText: { fontSize: 7, color: c.muted, textAlign: "center" },
});

export function ContractPDF({ data }: { data: ContractData }) {
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
          </View>
          <View>
            <Text style={styles.title}>SERVICE AGREEMENT</Text>
            <Text style={styles.meta}>#{data.contractNumber}</Text>
            <Text style={styles.meta}>Date: {data.date}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.partiesRow}>
          <View style={styles.partyBlock}>
            <Text style={styles.partyLabel}>Service Provider</Text>
            <Text style={styles.partyName}>{branding.agencyName}</Text>
            <Text style={styles.partyLine}>{branding.address}</Text>
            <Text style={styles.partyLine}>{branding.email} · {branding.phone}</Text>
          </View>
          <View style={styles.partyBlock}>
            <Text style={styles.partyLabel}>Client</Text>
            <Text style={styles.partyName}>{data.clientName}</Text>
            {data.clientCompany ? <Text style={styles.partyLine}>{data.clientCompany}</Text> : null}
            <Text style={styles.partyLine}>{data.clientEmail}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>1. Project</Text>
        <View style={styles.keyValueRow}>
          <Text style={styles.keyLabel}>Project Title</Text>
          <Text style={styles.keyValue}>{data.projectTitle}</Text>
        </View>
        <Text style={styles.body}>{data.scope}</Text>

        <Text style={styles.sectionTitle}>2. Deliverables</Text>
        <Text style={styles.body}>{data.deliverables}</Text>

        <Text style={styles.sectionTitle}>3. Timeline</Text>
        <Text style={styles.body}>{data.timeline}</Text>

        <Text style={styles.sectionTitle}>4. Payment</Text>
        <View style={styles.keyValueRow}>
          <Text style={styles.keyLabel}>Total Price</Text>
          <Text style={styles.keyValue}>
            {branding.currency.symbol}
            {data.price.toFixed(2)} {branding.currency.code}
          </Text>
        </View>
        <View style={styles.keyValueRow}>
          <Text style={styles.keyLabel}>Payment Method</Text>
          <Text style={styles.keyValue}>{data.paymentMethod}</Text>
        </View>
        <View style={styles.keyValueRow}>
          <Text style={styles.keyLabel}>Payment Terms</Text>
          <Text style={styles.keyValue}>{data.paymentTerms}</Text>
        </View>

        <Text style={styles.sectionTitle}>5. Revisions & Usage Rights</Text>
        <Text style={styles.body}>
          This agreement includes {data.revisionRounds} round(s) of revisions. Additional revisions beyond this
          scope may incur extra charges to be agreed upon separately.
        </Text>
        <Text style={[styles.body, { marginTop: 4 }]}>{data.usageRights}</Text>

        {data.additionalTerms ? (
          <>
            <Text style={styles.sectionTitle}>6. Additional Terms</Text>
            <Text style={styles.body}>{data.additionalTerms}</Text>
          </>
        ) : null}

        <Text style={[styles.body, { marginTop: 14, color: c.muted, fontSize: 8 }]}>
          This agreement is governed by the laws of {branding.contract.jurisdiction}. By signing below, both
          parties agree to the terms outlined in this document.
        </Text>

        <View style={styles.signaturesRow}>
          <View style={styles.sigBlock}>
            <View style={styles.sigLine} />
            <Text style={styles.sigLabel}>{branding.agencyName} — Authorized Signature</Text>
            <Text style={styles.sigLabel}>Date: {data.date}</Text>
          </View>
          <View style={styles.sigBlock}>
            <View style={styles.sigLine} />
            <Text style={styles.sigLabel}>{data.clientName} — Client Signature</Text>
            <Text style={styles.sigLabel}>Date: {"{{Signed Date;role=Client;type=date}}"}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Contract #{data.contractNumber} · Generated {data.date} · {branding.agencyName}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
