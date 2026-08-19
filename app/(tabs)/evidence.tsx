import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { DisclosureBanner, EmptyNotice, KindChip, StatusChip, colors, formatDate } from "@/components/case-ui";
import { ScreenContainer } from "@/components/screen-container";
import { EvidenceRecord, EvidenceStatus, useCaseData } from "@/lib/case-store";

type Filter = "All" | EvidenceStatus;

const filters: Filter[] = ["All", "PRIMARY_RECORD", "VERIFY", "USER_REPORTED", "CONFLICTING", "SOURCE_UNAVAILABLE", "RESEARCH_TOPIC"];

export default function EvidenceScreen() {
  const router = useRouter();
  const { records } = useCaseData();
  const [filter, setFilter] = useState<Filter>("All");
  const filteredRecords = useMemo(() => (filter === "All" ? records : records.filter((record) => record.status === filter)), [filter, records]);

  return (
    <ScreenContainer style={styles.container}>
      <FlatList
        data={filteredRecords}
        keyExtractor={(record) => record.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View><Text style={styles.kicker}>SOURCE-TRACEABLE WORKSPACE</Text><Text style={styles.title}>Evidence matrix</Text></View>
              <TouchableOpacity onPress={() => router.push("/add-record" as never)} activeOpacity={0.78} style={styles.addCircle}><MaterialIcons name="add" size={23} color={colors.white} /></TouchableOpacity>
            </View>
            <Text style={styles.subtitle}>Each entry stays connected to its source, status, and next verification step.</Text>
            <DisclosureBanner compact />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {filters.map((item) => {
                const selected = item === filter;
                const label = item === "All" ? "All records" : item.replaceAll("_", " ");
                return <TouchableOpacity key={item} onPress={() => setFilter(item)} activeOpacity={0.76} style={[styles.filter, selected && styles.filterActive]}><Text style={[styles.filterText, selected && styles.filterTextActive]}>{label}</Text></TouchableOpacity>;
              })}
            </ScrollView>
            <Text style={styles.resultText}>{filteredRecords.length} record{filteredRecords.length === 1 ? "" : "s"} shown</Text>
          </View>
        }
        renderItem={({ item }) => <EvidenceRow record={item} onPress={() => router.push(`/record/${item.id}` as never)} />}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={<EmptyNotice title="No records in this view" detail="Change the filter or add a source, question, claim, date, or evidence gap." />}
        ListFooterComponent={<TouchableOpacity onPress={() => router.push("/add-record" as never)} activeOpacity={0.8} style={styles.footerButton}><MaterialIcons name="add" size={19} color={colors.navy} /><Text style={styles.footerText}>Add a record to this matrix</Text></TouchableOpacity>}
      />
    </ScreenContainer>
  );
}

function EvidenceRow({ record, onPress }: { record: EvidenceRecord; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={styles.cardTop}><KindChip kind={record.kind} /><StatusChip status={record.status} /></View>
      <Text style={styles.statement}>{record.statement}</Text>
      <View style={styles.sourceRow}><MaterialIcons name="description" size={15} color={colors.slate} /><Text numberOfLines={1} style={styles.source}>{record.source}{record.location ? ` · ${record.location}` : ""}</Text></View>
      <View style={styles.nextAction}><MaterialIcons name="arrow-forward" size={15} color={colors.navy} /><Text numberOfLines={2} style={styles.nextActionText}>{record.nextAction || "Open this record to add a verification action."}</Text></View>
      <Text style={styles.date}>{formatDate(record.date)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.paper }, content: { padding: 20, paddingBottom: 32 }, header: { gap: 13, marginBottom: 16 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }, kicker: { fontSize: 10, lineHeight: 14, letterSpacing: 0.9, color: colors.slate, fontWeight: "800" },
  title: { color: colors.charcoal, fontSize: 28, lineHeight: 34, fontWeight: "800", letterSpacing: -0.6 }, subtitle: { color: colors.slate, fontSize: 13, lineHeight: 19, marginTop: -5 },
  addCircle: { height: 43, width: 43, alignItems: "center", justifyContent: "center", backgroundColor: colors.navy, borderRadius: 15 },
  filterRow: { gap: 8, paddingRight: 20 }, filter: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white }, filterActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  filterText: { color: colors.slate, fontSize: 11, fontWeight: "800", letterSpacing: 0.1 }, filterTextActive: { color: colors.white }, resultText: { color: colors.slate, fontSize: 11, fontWeight: "700", marginTop: -4 },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 17, padding: 14, gap: 10 }, cardPressed: { opacity: 0.76 }, cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  statement: { color: colors.charcoal, fontSize: 15, lineHeight: 21, fontWeight: "800" }, sourceRow: { flexDirection: "row", alignItems: "center", gap: 6 }, source: { flex: 1, color: colors.slate, fontSize: 11, lineHeight: 15, fontWeight: "600" },
  nextAction: { flexDirection: "row", gap: 6, alignItems: "flex-start", borderTopWidth: 1, borderTopColor: "#EDF0F3", paddingTop: 9 }, nextActionText: { color: colors.navy, fontSize: 11, lineHeight: 16, fontWeight: "700", flex: 1 }, date: { color: colors.slate, fontSize: 10, fontWeight: "700" },
  footerButton: { marginTop: 18, minHeight: 48, borderRadius: 15, borderWidth: 1, borderColor: "#B9CCE0", backgroundColor: colors.blue, alignItems: "center", justifyContent: "center", gap: 7, flexDirection: "row" }, footerText: { color: colors.navy, fontSize: 13, fontWeight: "800" },
});
