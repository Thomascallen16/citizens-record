import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { DisclosureBanner, EmptyNotice, KindChip, StatusChip, colors, formatDate } from "@/components/case-ui";
import { ScreenContainer } from "@/components/screen-container";
import { EvidenceRecord, useCaseData } from "@/lib/case-store";

export default function TimelineScreen() {
  const router = useRouter();
  const { records } = useCaseData();
  const events = useMemo(() => records.filter((record) => record.incidentDate || record.date).sort((a, b) => (a.incidentDate || a.date).localeCompare(b.incidentDate || b.date)), [records]);
  return <ScreenContainer style={styles.container}><FlatList data={events} keyExtractor={(record) => record.id} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}
    ListHeaderComponent={<View style={styles.header}><Text style={styles.kicker}>CHRONOLOGY WITH UNCERTAINTY</Text><Text style={styles.title}>Timeline reconstruction</Text><Text style={styles.subtitle}>Exact dates, approximate times, ranges, and conflicts stay visibly different. Tap an event for its source context.</Text><DisclosureBanner compact /></View>}
    renderItem={({ item, index }) => <TimelineRow record={item} first={index === 0} last={index === events.length - 1} onPress={() => router.push(`/record/${item.id}` as never)} />}
    ListEmptyComponent={<EmptyNotice title="No chronology entries yet" detail="Add an incident date or record date to place an item on this timeline." />}
  /></ScreenContainer>;
}

function TimelineRow({ record, first, last, onPress }: { record: EvidenceRecord; first: boolean; last: boolean; onPress: () => void }) {
  const date = record.incidentDate || record.date;
  const precisionColor = record.timePrecision === "CONFLICTING" ? colors.red : record.timePrecision === "EXACT" ? colors.teal : record.timePrecision === "APPROXIMATE" || record.timePrecision === "RANGE" ? colors.gold : colors.slate;
  return <View style={styles.row}><View style={styles.rail}><View style={[styles.line, first && styles.lineTransparent]} /><View style={[styles.dot, { backgroundColor: precisionColor }]}><MaterialIcons name={record.timePrecision === "CONFLICTING" ? "compare-arrows" : "event"} size={13} color={colors.white} /></View><View style={[styles.line, last && styles.lineTransparent]} /></View><Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.76 }]}><View style={styles.cardTop}><Text style={styles.date}>{formatDate(date)}</Text><Text style={[styles.precision, { color: precisionColor }]}>{record.timePrecision.replaceAll("_", " ")}</Text></View><Text style={styles.statement}>{record.statement}</Text><View style={styles.chipRow}><KindChip kind={record.kind} /><StatusChip status={record.status} /></View>{record.potentialDiscrepancy ? <Text style={styles.conflictText}>Potential discrepancy for review: {record.potentialDiscrepancy}</Text> : null}<Text numberOfLines={1} style={styles.source}>{record.source}</Text></Pressable></View>;
}

const styles = StyleSheet.create({ container: { backgroundColor: colors.paper }, content: { padding: 20, paddingBottom: 32 }, header: { gap: 11, marginBottom: 17 }, kicker: { color: colors.slate, fontSize: 10, lineHeight: 14, fontWeight: "800", letterSpacing: 1 }, title: { color: colors.charcoal, fontSize: 28, lineHeight: 34, letterSpacing: -0.6, fontWeight: "800" }, subtitle: { color: colors.slate, fontSize: 13, lineHeight: 19, marginTop: -5 }, row: { flexDirection: "row", alignItems: "stretch", minHeight: 154 }, rail: { width: 33, alignItems: "center" }, line: { width: 2, flex: 1, backgroundColor: "#B9CCE0" }, lineTransparent: { backgroundColor: "transparent" }, dot: { width: 25, height: 25, borderRadius: 10, alignItems: "center", justifyContent: "center" }, card: { flex: 1, marginBottom: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 13, gap: 7 }, cardTop: { flexDirection: "row", justifyContent: "space-between", gap: 8 }, date: { color: colors.navy, fontSize: 11, lineHeight: 15, letterSpacing: 0.2, fontWeight: "800" }, precision: { fontSize: 9, lineHeight: 14, fontWeight: "800", letterSpacing: 0.4 }, statement: { color: colors.charcoal, fontSize: 14, lineHeight: 19, fontWeight: "800" }, chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 7, alignItems: "center" }, conflictText: { color: colors.red, fontSize: 10, lineHeight: 15, fontWeight: "700", backgroundColor: "#FCE9E7", padding: 7, borderRadius: 9 }, source: { color: colors.slate, fontSize: 11, fontWeight: "600", marginTop: 1 } });
