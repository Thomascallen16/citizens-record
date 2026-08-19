import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { DisclosureBanner, EmptyNotice, colors } from "@/components/case-ui";
import { ScreenContainer } from "@/components/screen-container";
import { DiscoveryTask, discoveryStateLabel, nextDiscoveryState, useCaseData } from "@/lib/case-store";

export default function QueueScreen() {
  const router = useRouter();
  const { discovery, updateDiscoveryState } = useCaseData();
  const ordered = [...discovery].sort((a, b) => ({ Critical: 0, High: 1, Medium: 2, Low: 3 }[a.priority] - { Critical: 0, High: 1, Medium: 2, Low: 3 }[b.priority]));

  return (
    <ScreenContainer style={styles.container}>
      <FlatList
        data={ordered}
        keyExtractor={(task) => task.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<View style={styles.header}><Text style={styles.kicker}>MISSING-MATERIAL TRACKER</Text><Text style={styles.title}>Discovery queue</Text><Text style={styles.subtitle}>Track what needs to be obtained or reviewed. A missing item is not proof of what it would show.</Text><DisclosureBanner compact /></View>}
        renderItem={({ item }) => <QueueCard task={item} onOpen={() => item.linkedRecordId ? router.push(`/record/${item.linkedRecordId}` as never) : undefined} onAdvance={() => updateDiscoveryState(item.id, nextDiscoveryState(item.state))} />}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={<EmptyNotice title="Your queue is clear" detail="When a record is missing or needs verification, capture the exact material and the question it could resolve." />}
      />
    </ScreenContainer>
  );
}

function QueueCard({ task, onOpen, onAdvance }: { task: DiscoveryTask; onOpen?: () => void; onAdvance: () => void }) {
  const tone = task.priority === "Critical" ? { color: colors.red, bg: "#FCE9E7" } : task.priority === "High" ? { color: colors.gold, bg: "#FFF1D6" } : { color: colors.navy, bg: colors.blue };
  const isDone = task.state === "RECEIVED";
  return (
    <View style={[styles.card, isDone && styles.cardDone]}>
      <View style={styles.cardTop}><View style={[styles.priority, { backgroundColor: tone.bg }]}><Text style={[styles.priorityText, { color: tone.color }]}>{task.priority.toUpperCase()}</Text></View><Text style={styles.state}>{discoveryStateLabel(task.state)}</Text></View>
      <Text style={styles.taskTitle}>{task.title}</Text>
      <Text style={styles.question}>{task.question}</Text>
      <View style={styles.detailRow}><MaterialIcons name="account-balance" size={15} color={colors.slate} /><Text style={styles.detailText}>{task.custodian}</Text></View>
      <View style={styles.note}><MaterialIcons name="sticky-note-2" size={15} color={colors.navy} /><Text style={styles.noteText}>{task.handlingNote}</Text></View>
      <View style={styles.actionRow}>
        {onOpen ? <Pressable onPress={onOpen} style={({ pressed }) => [styles.secondaryButton, pressed && { opacity: 0.7 }]}><Text style={styles.secondaryText}>Open linked record</Text></Pressable> : <View />}
        <Pressable onPress={onAdvance} style={({ pressed }) => [styles.stateButton, isDone && styles.stateButtonDone, pressed && { opacity: 0.75 }]}><Text style={[styles.stateButtonText, isDone && styles.stateButtonTextDone]}>{isDone ? "Reopen task" : `Mark ${discoveryStateLabel(nextDiscoveryState(task.state)).toLowerCase()}`}</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.paper }, content: { padding: 20, paddingBottom: 32 }, header: { gap: 11, marginBottom: 17 }, kicker: { color: colors.slate, fontSize: 10, lineHeight: 14, fontWeight: "800", letterSpacing: 1 },
  title: { color: colors.charcoal, fontSize: 28, lineHeight: 34, letterSpacing: -0.6, fontWeight: "800" }, subtitle: { color: colors.slate, fontSize: 13, lineHeight: 19, marginTop: -5 },
  card: { padding: 14, gap: 10, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 17 }, cardDone: { opacity: 0.65 }, cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, priority: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 }, priorityText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 }, state: { fontSize: 10, color: colors.slate, fontWeight: "800", letterSpacing: 0.3 },
  taskTitle: { fontSize: 15, lineHeight: 20, color: colors.charcoal, fontWeight: "800" }, question: { color: colors.slate, fontSize: 12, lineHeight: 17 }, detailRow: { flexDirection: "row", gap: 6, alignItems: "center" }, detailText: { flex: 1, color: colors.slate, fontSize: 11, lineHeight: 15, fontWeight: "600" },
  note: { flexDirection: "row", gap: 7, borderTopWidth: 1, borderColor: "#EDF0F3", paddingTop: 9 }, noteText: { flex: 1, color: colors.navy, fontSize: 11, lineHeight: 16, fontWeight: "700" }, actionRow: { flexDirection: "row", justifyContent: "space-between", gap: 8, marginTop: 2 }, secondaryButton: { justifyContent: "center", paddingHorizontal: 4 }, secondaryText: { color: colors.navy, fontWeight: "800", fontSize: 11 },
  stateButton: { paddingHorizontal: 10, paddingVertical: 9, borderRadius: 10, backgroundColor: colors.navy }, stateButtonDone: { backgroundColor: "#E8F0F7", borderWidth: 1, borderColor: "#B9CCE0" }, stateButtonText: { color: colors.white, fontSize: 10, fontWeight: "800" }, stateButtonTextDone: { color: colors.navy },
});
