import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

type TimingInstruction = {
  mealRelation: "PRE_MEAL" | "WITH_MEAL" | "POST_MEAL";
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
  dosage?: string;
};

type PrescriptionMedicine = {
  id: string;
  medicineName: string;
  dosage?: string | null;
  frequency?: string | null;
  duration?: string | null;
  timingInstructions?: TimingInstruction[] | null;
  genericName?: string | null;
  drugMetadata?: unknown;
  medexBrandId?: string | null;
  medexSlug?: string | null;
  medexUrl?: string | null;
};

export interface PrescriptionPDFData {
  id: string;
  doctorName: string;
  doctorSpecialization?: string;
  organizationName: string;
  organizationLogo?: string | null;
  date: string;
  patientName?: string;
  patientAge?: number;
  patientGender?: string;
  medicines: PrescriptionMedicine[];
  items?: Array<{
    id: string;
    category: string;
    value: string;
  }>;
  clinicalNotes?: {
    patientStatedIssues?: string;
    doctorDiscovery?: string;
  };
}

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
    color: "#17211e",
    fontSize: 10,
    lineHeight: 1.45,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 14,
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#0f3b34",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandMark: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0f3b34",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  brandMarkText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f3b34",
  },
  brandSubtitle: {
    fontSize: 9.5,
    color: "#4a5852",
    marginTop: 2,
  },
  orgLogo: {
    width: 42,
    height: 42,
    objectFit: "contain",
  },
  headerRight: {
    alignItems: "flex-end",
  },
  refBadge: {
    fontSize: 8.5,
    color: "#4a5852",
    textTransform: "uppercase",
    fontWeight: "bold",
  },
  refValue: {
    fontSize: 11,
    color: "#0f3b34",
    fontWeight: "bold",
    marginTop: 2,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  infoCard: {
    width: "49%",
    padding: 10,
    borderRadius: 6,
    backgroundColor: "#f7f8f6",
    borderWidth: 1,
    borderColor: "#d9e5de",
    marginBottom: 8,
  },
  label: {
    fontSize: 8,
    color: "#4a5852",
    textTransform: "uppercase",
    marginBottom: 2,
    fontWeight: "bold",
  },
  value: {
    fontSize: 10.5,
    color: "#17211e",
  },
  sectionTitle: {
    fontSize: 11.5,
    fontWeight: "bold",
    color: "#0f3b34",
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  sectionBox: {
    padding: 10,
    backgroundColor: "#f7f8f6",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#d9e5de",
    marginBottom: 12,
  },
  table: {
    width: "100%",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#0f3b34",
    borderRadius: 4,
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    fontSize: 7.8,
    color: "#ffffff",
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e6eee9",
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: "flex-start",
  },
  medicineName: {
    fontSize: 9.2,
    fontWeight: "bold",
    color: "#17211e",
  },
  medicineMeta: {
    fontSize: 8.2,
    color: "#4a5852",
    marginTop: 2,
  },
  cell: {
    fontSize: 8.8,
    color: "#17211e",
  },
  mutedCell: {
    fontSize: 8.3,
    color: "#4a5852",
  },
  medicineCol: { width: "27%" },
  dosageCol: { width: "14%" },
  freqCol: { width: "17%" },
  durCol: { width: "14%" },
  timingCol: { width: "28%" },
  pill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "#e7f3ee",
    color: "#0f3b34",
    fontSize: 7.5,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  noteCard: {
    padding: 10,
    borderRadius: 6,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d9e5de",
    marginBottom: 8,
  },
  noteHeading: {
    fontSize: 8,
    textTransform: "uppercase",
    color: "#4a5852",
    fontWeight: "bold",
    marginBottom: 4,
  },
  noteBody: {
    fontSize: 9,
    color: "#17211e",
  },
  signatureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#d9e5de",
  },
  signatureBlock: {
    width: "48%",
  },
  signatureLine: {
    width: 150,
    borderBottomWidth: 1,
    borderBottomColor: "#17211e",
    marginTop: 22,
    marginBottom: 4,
  },
  signatureCaption: {
    fontSize: 8,
    color: "#4a5852",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    borderTopWidth: 1,
    borderTopColor: "#d9e5de",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: "#66736f",
  },
});

function formatTiming(timing?: TimingInstruction | null) {
  if (!timing) return "No timing set";
  const relationMap: Record<TimingInstruction["mealRelation"], string> = {
    PRE_MEAL: "Before",
    WITH_MEAL: "With",
    POST_MEAL: "After",
  };
  const meal = timing.mealType.replace("_", " ");
  return `${relationMap[timing.mealRelation]} ${meal}${timing.dosage ? ` (${timing.dosage})` : ""}`;
}

function formatTimingList(timings?: TimingInstruction[] | null) {
  if (!timings || timings.length === 0) return "As directed";
  return timings.map(formatTiming).join("; ");
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function PrescriptionPDF({ prescription }: { prescription: PrescriptionPDFData }) {
  const formattedDate = formatDate(prescription.date);
  const ageLine =
    prescription.patientAge != null
      ? `${prescription.patientAge} years${prescription.patientGender ? ` · ${prescription.patientGender}` : ""}`
      : prescription.patientGender || "Not recorded";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>Rx</Text>
            </View>
            <View>
              <Text style={styles.brandTitle}>PersoCare Prescription</Text>
              <Text style={styles.brandSubtitle}>Professional prescription summary and medication guide</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            {prescription.organizationLogo ? (
              <Image src={prescription.organizationLogo} style={styles.orgLogo} />
            ) : null}
            <Text style={styles.refBadge}>Reference</Text>
            <Text style={styles.refValue}>#{prescription.id.slice(-8).toUpperCase()}</Text>
            <Text style={styles.brandSubtitle}>{formattedDate}</Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Text style={styles.label}>Prescribing Doctor</Text>
            <Text style={styles.value}>Dr. {prescription.doctorName}</Text>
            {prescription.doctorSpecialization ? (
              <Text style={styles.medicineMeta}>{prescription.doctorSpecialization}</Text>
            ) : null}
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.label}>Patient</Text>
            <Text style={styles.value}>{prescription.patientName || "Patient"}</Text>
            <Text style={styles.medicineMeta}>{ageLine}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.label}>Organization</Text>
            <Text style={styles.value}>{prescription.organizationName}</Text>
            <Text style={styles.medicineMeta}>Issued by PersoCare clinical workflow</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.label}>Prescription Date</Text>
            <Text style={styles.value}>{formattedDate}</Text>
            <Text style={styles.medicineMeta}>Document ID #{prescription.id.slice(-8).toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>Medicines</Text>
          {prescription.medicines?.length ? (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.medicineCol]}>Medicine</Text>
                <Text style={[styles.tableHeaderText, styles.dosageCol]}>Dosage</Text>
                <Text style={[styles.tableHeaderText, styles.freqCol]}>Frequency</Text>
                <Text style={[styles.tableHeaderText, styles.durCol]}>Duration</Text>
                <Text style={[styles.tableHeaderText, styles.timingCol]}>Timing</Text>
              </View>

              {prescription.medicines.map((med, index) => (
                <View key={med.id || index} style={styles.tableRow}>
                  <View style={styles.medicineCol}>
                    <Text style={styles.medicineName}>{med.medicineName}</Text>
                    {med.genericName ? <Text style={styles.medicineMeta}>{med.genericName}</Text> : null}
                  </View>
                  <Text style={[styles.cell, styles.dosageCol]}>{med.dosage || "—"}</Text>
                  <Text style={[styles.cell, styles.freqCol]}>{med.frequency || "—"}</Text>
                  <Text style={[styles.cell, styles.durCol]}>{med.duration || "—"}</Text>
                  <View style={styles.timingCol}>
                    <Text style={styles.cell}>{formatTimingList(med.timingInstructions)}</Text>
                    {med.medexUrl ? <Text style={styles.medicineMeta}>MedEx linked</Text> : null}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.mutedCell}>No medications listed in this prescription.</Text>
          )}
        </View>

        {prescription.items && prescription.items.length > 0 ? (
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>Additional Instructions</Text>
            {prescription.items.map((item, index) => (
              <View key={item.id || index} style={styles.noteCard}>
                <Text style={styles.pill}>{item.category}</Text>
                <Text style={[styles.noteBody, { marginTop: 6 }]}>{item.value}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {prescription.clinicalNotes?.patientStatedIssues || prescription.clinicalNotes?.doctorDiscovery ? (
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>Clinical Notes</Text>
            {prescription.clinicalNotes.patientStatedIssues ? (
              <View style={styles.noteCard}>
                <Text style={styles.noteHeading}>Patient Stated Issues</Text>
                <Text style={styles.noteBody}>{prescription.clinicalNotes.patientStatedIssues}</Text>
              </View>
            ) : null}
            {prescription.clinicalNotes.doctorDiscovery ? (
              <View style={styles.noteCard}>
                <Text style={styles.noteHeading}>Doctor's Findings</Text>
                <Text style={styles.noteBody}>{prescription.clinicalNotes.doctorDiscovery}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>Signature</Text>
          <View style={styles.signatureRow}>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureCaption}>Doctor signature and seal</Text>
            </View>
            <View style={styles.signatureBlock}>
              <Text style={styles.noteHeading}>Disclaimer</Text>
              <Text style={styles.noteBody}>
                This prescription is issued for the named patient only. Medication use should follow the
                prescribing physician&apos;s instructions. In case of adverse effects or uncertainty, seek
                immediate medical advice.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text>Generated securely by PersoCare Digital Health Ecosystem</Text>
          <Text>Reference #{prescription.id.slice(-8).toUpperCase()}</Text>
        </View>
      </Page>
    </Document>
  );
}
