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
  const datedRecords = useMemo(() => records.filter((record) => record.date).sort((a, b) => a.date.localeCompare(b.date)), [records]);

  return (
    <ScreenContainer style={styles.container}>
      <FlatList
        data={datedRecords}
        keyExtractor={(record) => record.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<View style={styles.header}><Text style={styles.kicker}>ORDER OF EVENTS</Text><Text style={styles.title}>Timeline</Text><Text style={styles.subtitle}>A chronology is a review aid. Each event retains its source and verification status.</Text><DisclosureBanner compact /></View>}
        renderItem={({ item, index }) => <TimelineRow record={item} first={index === 0} last={index === datedRecords.length - 1} onPress={() => router.push(`/record/${item.id}` as never)} />}
        ListEmptyComponent={<EmptyNotice title="No dates are recorded" detail="Add a date to a source-linked record to place it on the chronology." />}
      />
    </ScreenContainer>
  );
}

function TimelineRow({ record, first, last, onPress }: { record: EvidenceRecord; first: boolean; last: boolean; onPress: () => void }) {
  return (
    <View style={styles.row}>
      <View style={styles.rail}><View style={[styles.line, first && styles.lineTransparent]} /><View style={styles.dot}><MaterialIcons name="event" size={13} color={colors.white} /></View><View style={[styles.line, last && styles.lineTransparent]} /></View>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.76 }]}>
        <Text style={styles.date}>{formatDate(record.date)}</Text>
        <Text style={styles.statement}>{record.statement}</Text>
        <View style={styles.chipRow}><KindChip kind={record.kind} /><StatusChip status={record.status} /></View>
        <Text numberOfLines={1} style={styles.source}>{record.source}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.paper }, content: { padding: 20, paddingBottom: 32 }, header: { gap: 11, marginBottom: 17 }, kicker: { color: colors.slate, fontSize: 10, lineHeight: 14, fontWeight: "800", letterSpacing: 1 },
  title: { color: colors.charcoal, fontSize: 28, lineHeight: 34, letterSpacing: -0.6, fontWeight: "800" }, subtitle: { color: colors.slate, fontSize: 13, lineHeight: 19, marginTop: -5 },
  row: { flexDirection: "row", alignItems: "stretch", minHeight: 142 }, rail: { width: 33, alignItems: "center" }, line: { width: 2, flex: 1, backgroundColor: "#B9CCE0" }, lineTransparent: { backgroundColor: "transparent" }, dot: { width: 25, height: 25, borderRadius: 10, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center" },
  card: { flex: 1, marginBottom: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 13, gap: 7 }, date: { color: colors.navy, fontSize: 11, lineHeight: 15, letterSpacing: 0.2, fontWeight: "800" },
  statement: { color: colors.charcoal, fontSize: 14, lineHeight: 19, fontWeight: "800" }, chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 7, alignItems: "center" }, source: { color: colors.slate, fontSize: 11, fontWeight: "600", marginTop: 1 },
});
