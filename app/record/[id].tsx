import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { DisclosureBanner, KindChip, StatusChip, colors, formatDate } from "@/components/case-ui";
import { ScreenContainer } from "@/components/screen-container";
import { EvidenceStatus, useCaseData } from "@/lib/case-store";

export default function RecordDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { records, updateRecordStatus } = useCaseData();
  const record = records.find((entry) => entry.id === id);

  if (!record) {
    return <ScreenContainer edges={["top", "bottom", "left", "right"]} style={styles.empty}><MaterialIcons name="find-in-page" size={36} color={colors.slate} /><Text style={styles.emptyTitle}>This record is not available</Text><TouchableOpacity onPress={() => router.back()} style={styles.backToMatrix}><Text style={styles.backToMatrixText}>Return to evidence</Text></TouchableOpacity></ScreenContainer>;
  }

  const canMarkPrimary = record.status !== "PRIMARY_RECORD";
  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.topRow}><TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backButton}><MaterialIcons name="arrow-back" size={21} color={colors.navy} /></TouchableOpacity><Text style={styles.topTitle}>Record detail</Text><View style={styles.topSpacer} /></View>
        <View style={styles.chips}><KindChip kind={record.kind} /><StatusChip status={record.status} /></View>
        <Text style={styles.title}>{record.statement}</Text>
        <DisclosureBanner compact />
        <Section icon="description" title="Source"><Detail label="Source" value={record.source} /><Detail label="Location" value={record.location || "Location not recorded"} /><Detail label="Passage / summary" value={record.passage} /></Section>
        <Section icon="event" title="Context"><Detail label="Date" value={formatDate(record.date)} /><Detail label="People or agency" value={record.people} /><Detail label="Confidence" value={record.confidence} /></Section>
        <Section icon="task-alt" title="Next review step"><Text style={styles.nextAction}>{record.nextAction}</Text></Section>
        {canMarkPrimary ? <TouchableOpacity onPress={() => updateRecordStatus(record.id, "PRIMARY_RECORD" as EvidenceStatus)} activeOpacity={0.8} style={styles.confirmButton}><MaterialIcons name="verified" size={19} color={colors.white} /><Text style={styles.confirmText}>Mark as primary record after review</Text></TouchableOpacity> : <View style={styles.confirmedNotice}><MaterialIcons name="verified" size={18} color={colors.teal} /><Text style={styles.confirmedText}>This item is labeled as a primary record. Confirm the source and completeness before relying on it.</Text></View>}
        <Text style={styles.note}>Changing a status records your own review step. It does not independently authenticate a document or determine what a court will accept.</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

function Section({ icon, title, children }: { icon: "description" | "event" | "task-alt"; title: string; children: React.ReactNode }) {
  return <View style={styles.section}><View style={styles.sectionHeading}><MaterialIcons name={icon} size={18} color={colors.navy} /><Text style={styles.sectionTitle}>{title}</Text></View>{children}</View>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <View style={styles.detail}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.paper }, content: { padding: 20, paddingBottom: 34, gap: 16 }, topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, backButton: { width: 39, height: 39, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, justifyContent: "center", alignItems: "center" }, topTitle: { color: colors.navy, fontSize: 14, fontWeight: "800" }, topSpacer: { width: 39 },
  chips: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 3 }, title: { color: colors.charcoal, fontSize: 24, lineHeight: 31, letterSpacing: -0.4, fontWeight: "800" }, section: { borderRadius: 17, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, overflow: "hidden" }, sectionHeading: { flexDirection: "row", gap: 7, alignItems: "center", paddingHorizontal: 14, paddingVertical: 11, backgroundColor: "#F2F5F7", borderBottomWidth: 1, borderBottomColor: colors.border }, sectionTitle: { color: colors.navy, fontSize: 13, fontWeight: "800" },
  detail: { paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: "#EDF0F3", gap: 3 }, detailLabel: { color: colors.slate, fontSize: 10, fontWeight: "800", letterSpacing: 0.5, textTransform: "uppercase" }, detailValue: { color: colors.charcoal, fontSize: 13, lineHeight: 19, fontWeight: "600" }, nextAction: { padding: 14, color: colors.charcoal, fontSize: 13, lineHeight: 19, fontWeight: "600" },
  confirmButton: { minHeight: 52, borderRadius: 16, backgroundColor: colors.navy, justifyContent: "center", alignItems: "center", flexDirection: "row", gap: 8 }, confirmText: { color: colors.white, fontSize: 13, fontWeight: "800" }, confirmedNotice: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 13, borderRadius: 15, backgroundColor: "#DDF4EE", borderWidth: 1, borderColor: "#B5E1D7" }, confirmedText: { flex: 1, color: colors.teal, fontSize: 12, lineHeight: 17, fontWeight: "700" }, note: { color: colors.slate, fontSize: 11, lineHeight: 16, textAlign: "center", paddingHorizontal: 6 },
  empty: { backgroundColor: colors.paper, padding: 24, alignItems: "center", justifyContent: "center", gap: 11 }, emptyTitle: { color: colors.charcoal, fontSize: 16, fontWeight: "800" }, backToMatrix: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.navy }, backToMatrixText: { color: colors.white, fontSize: 13, fontWeight: "800" },
});
