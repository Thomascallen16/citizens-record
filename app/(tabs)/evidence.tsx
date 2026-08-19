import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { DisclosureBanner, EmptyNotice, KindChip, StatusChip, colors, formatDate } from "@/components/case-ui";
import { ScreenContainer } from "@/components/screen-container";
import { EvidenceRecord, useCaseData } from "@/lib/case-store";

type Filter = "ALL" | "VERIFY" | "MISSING" | "DISCREPANCY" | "PRIMARY" | "CLAIM";
const filters: Array<{ id: Filter; label: string }> = [{ id: "ALL", label: "All records" }, { id: "VERIFY", label: "Needs review" }, { id: "MISSING", label: "Expected / missing" }, { id: "DISCREPANCY", label: "Potential discrepancies" }, { id: "PRIMARY", label: "Primary records" }, { id: "CLAIM", label: "Claims" }];

export default function EvidenceScreen() {
  const router = useRouter();
  const { records } = useCaseData();
  const [filter, setFilter] = useState<Filter>("ALL");
  const filtered = useMemo(() => records.filter((record) => {
    if (filter === "ALL") return true;
    if (filter === "VERIFY") return record.status === "VERIFY" || record.status === "USER_REPORTED";
    if (filter === "MISSING") return record.appearsMissing || record.status === "SOURCE_UNAVAILABLE" || record.kind === "MISSING_EVIDENCE";
    if (filter === "DISCREPANCY") return Boolean(record.potentialDiscrepancy) || record.status === "CONFLICTING" || record.timePrecision === "CONFLICTING";
    if (filter === "PRIMARY") return record.status === "PRIMARY_RECORD";
    return record.kind === "CLAIM";
  }), [filter, records]);

  return <ScreenContainer style={styles.container}>
    <FlatList data={filtered} keyExtractor={(record) => record.id} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}
      ListHeaderComponent={<View style={styles.header}><View style={styles.titleRow}><View><Text style={styles.kicker}>SOURCE-TRACEABLE REVIEW</Text><Text style={styles.title}>Evidence intelligence</Text></View><TouchableOpacity onPress={() => router.push("/add-record" as never)} activeOpacity={0.78} style={styles.addCircle}><MaterialIcons name="add" size={23} color={colors.white} /></TouchableOpacity></View><Text style={styles.subtitle}>Track custody, receipt, reliability questions, related people, and potential discrepancies without converting them into conclusions.</Text><DisclosureBanner compact /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>{filters.map((item) => <TouchableOpacity key={item.id} onPress={() => setFilter(item.id)} activeOpacity={0.76} style={[styles.filter, item.id === filter && styles.filterActive]}><Text style={[styles.filterText, item.id === filter && styles.filterTextActive]}>{item.label}</Text></TouchableOpacity>)}</ScrollView><Text style={styles.resultText}>{filtered.length} source-linked item{filtered.length === 1 ? "" : "s"} in this view</Text></View>}
      renderItem={({ item }) => <EvidenceRow record={item} onPress={() => router.push(`/record/${item.id}` as never)} />}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      ListEmptyComponent={<EmptyNotice title="No records in this view" detail="Add a source, case question, expected material, claim, date, or discrepancy review item." />}
      ListFooterComponent={<TouchableOpacity onPress={() => router.push("/add-record" as never)} activeOpacity={0.8} style={styles.footerButton}><MaterialIcons name="add" size={19} color={colors.navy} /><Text style={styles.footerText}>Add source-linked evidence</Text></TouchableOpacity>}
    />
  </ScreenContainer>;
}

function EvidenceRow({ record, onPress }: { record: EvidenceRecord; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.76 }]}>
    <View style={styles.cardTop}><KindChip kind={record.kind} /><StatusChip status={record.status} /></View>
    <Text style={styles.itemName}>{record.itemName}</Text><Text style={styles.statement} numberOfLines={2}>{record.statement}</Text>
    <View style={styles.metaRow}><MaterialIcons name="source" size={15} color={colors.slate} /><Text numberOfLines={1} style={styles.meta}>{record.source}{record.location ? ` · ${record.location}` : ""}</Text></View>
    <View style={styles.badgeRow}><Badge label={record.requested ? "Requested" : "Not requested"} active={record.requested} /><Badge label={record.disclosed ? "Disclosed" : "Not disclosed"} active={record.disclosed} /><Badge label={record.custodian === "Not recorded" ? "Custodian needed" : record.custodian} active={record.custodian !== "Not recorded"} /></View>
    {record.potentialDiscrepancy ? <View style={styles.discrepancy}><MaterialIcons name="compare-arrows" size={15} color={colors.red} /><Text numberOfLines={2} style={styles.discrepancyText}>Potential discrepancy for review: {record.potentialDiscrepancy}</Text></View> : null}
    <View style={styles.cardFooter}><Text style={styles.date}>{record.incidentDate ? `Incident: ${formatDate(record.incidentDate)}` : "Incident date not recorded"}</Text><Text style={styles.time}>{record.timePrecision.replaceAll("_", " ")}</Text></View>
  </Pressable>;
}

function Badge({ label, active }: { label: string; active: boolean }) { return <View style={[styles.badge, active && styles.badgeActive]}><Text numberOfLines={1} style={[styles.badgeText, active && styles.badgeTextActive]}>{label}</Text></View>; }

const styles = StyleSheet.create({
  container: { backgroundColor: colors.paper }, content: { padding: 20, paddingBottom: 32 }, header: { gap: 13, marginBottom: 16 }, titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }, kicker: { fontSize: 10, lineHeight: 14, letterSpacing: 0.9, color: colors.slate, fontWeight: "800" }, title: { color: colors.charcoal, fontSize: 28, lineHeight: 34, fontWeight: "800", letterSpacing: -0.6 }, subtitle: { color: colors.slate, fontSize: 13, lineHeight: 19, marginTop: -5 }, addCircle: { height: 43, width: 43, alignItems: "center", justifyContent: "center", backgroundColor: colors.navy, borderRadius: 15 }, filterRow: { gap: 8, paddingRight: 20 }, filter: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white }, filterActive: { backgroundColor: colors.navy, borderColor: colors.navy }, filterText: { color: colors.slate, fontSize: 11, fontWeight: "800" }, filterTextActive: { color: colors.white }, resultText: { color: colors.slate, fontSize: 11, fontWeight: "700", marginTop: -4 }, card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 17, padding: 14, gap: 8 }, cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }, itemName: { color: colors.navy, fontSize: 11, lineHeight: 15, fontWeight: "800", letterSpacing: 0.2 }, statement: { color: colors.charcoal, fontSize: 14, lineHeight: 20, fontWeight: "800" }, metaRow: { flexDirection: "row", alignItems: "center", gap: 6 }, meta: { flex: 1, color: colors.slate, fontSize: 11, lineHeight: 15, fontWeight: "600" }, badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 }, badge: { maxWidth: "100%", paddingHorizontal: 7, paddingVertical: 4, borderRadius: 999, backgroundColor: "#EEF1F4" }, badgeActive: { backgroundColor: colors.blue }, badgeText: { fontSize: 9, fontWeight: "800", color: colors.slate }, badgeTextActive: { color: colors.navy }, discrepancy: { flexDirection: "row", gap: 6, alignItems: "flex-start", backgroundColor: "#FCE9E7", borderRadius: 10, padding: 8 }, discrepancyText: { flex: 1, color: colors.red, fontSize: 10, lineHeight: 15, fontWeight: "700" }, cardFooter: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#EDF0F3", paddingTop: 8, gap: 8 }, date: { color: colors.slate, fontSize: 10, fontWeight: "700" }, time: { color: colors.navy, fontSize: 10, fontWeight: "800" }, footerButton: { marginTop: 18, minHeight: 48, borderRadius: 15, borderWidth: 1, borderColor: "#B9CCE0", backgroundColor: colors.blue, alignItems: "center", justifyContent: "center", gap: 7, flexDirection: "row" }, footerText: { color: colors.navy, fontSize: 13, fontWeight: "800" },
});
