import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { DisclosureBanner, KindChip, SectionHeading, StatusChip, colors, formatDate } from "@/components/case-ui";
import { ScreenContainer } from "@/components/screen-container";
import { EvidenceRecord, useCaseData } from "@/lib/case-store";

function RecordPreview({ record, onPress }: { record: EvidenceRecord; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.76} style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <KindChip kind={record.kind} />
        <MaterialIcons name="chevron-right" size={21} color={colors.slate} />
      </View>
      <Text style={styles.recordStatement} numberOfLines={2}>{record.statement}</Text>
      <View style={styles.recordMeta}>
        <StatusChip status={record.status} />
        <Text style={styles.sourceText} numberOfLines={1}>{record.source}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function TodayScreen() {
  const router = useRouter();
  const { caseProfile, records, discovery, scopeAcknowledged, acknowledgeScope } = useCaseData();
  const openTasks = discovery.filter((task) => task.state !== "RECEIVED");
  const firstTask = openTasks[0];

  if (!scopeAcknowledged) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]} style={styles.scopeScreen}>
        <View style={styles.scopeIcon}><MaterialIcons name="folder-shared" size={35} color={colors.white} /></View>
        <Text style={styles.scopeBrand}>CaseCompass</Text>
        <Text style={styles.scopeTitle}>Build your case record, one source at a time.</Text>
        <Text style={styles.scopeBody}>
          Keep documents, neutral questions, dates, and missing-record tasks organized in one local workspace.
        </Text>
        <View style={styles.scopeNotice}>
          <MaterialIcons name="gavel" size={20} color={colors.navy} />
          <Text style={styles.scopeNoticeText}>
            CaseCompass is an organization and research tool. It is not a law firm, does not act as your attorney, and cannot tell you what to file or how your case will turn out.
          </Text>
        </View>
        <Text style={styles.scopeFootnote}>Use official sources where possible. Mark uncertainty instead of turning a report or missing item into a fact.</Text>
        <TouchableOpacity onPress={acknowledgeScope} activeOpacity={0.82} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>I understand — open workspace</Text>
          <MaterialIcons name="arrow-forward" size={19} color={colors.white} />
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.brandRow}>
            <View style={styles.miniMark}><MaterialIcons name="folder-shared" size={17} color={colors.white} /></View>
            <Text style={styles.brand}>CaseCompass</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/settings" as never)} activeOpacity={0.7} style={styles.settingsButton}>
            <MaterialIcons name="tune" size={20} color={colors.navy} />
          </TouchableOpacity>
        </View>

        <Text style={styles.kicker}>LOCAL WORKSPACE</Text>
        <Text style={styles.title}>{caseProfile.label}</Text>
        <Text style={styles.caseMeta}>{caseProfile.court} · {caseProfile.caseNumber}</Text>
        <DisclosureBanner compact />

        <View style={styles.metricsRow}>
          <View style={styles.metric}><Text style={styles.metricValue}>{records.length}</Text><Text style={styles.metricLabel}>records</Text></View>
          <View style={styles.metricDivider} />
          <View style={styles.metric}><Text style={styles.metricValue}>{openTasks.length}</Text><Text style={styles.metricLabel}>open tasks</Text></View>
          <View style={styles.metricDivider} />
          <View style={styles.metric}><Text style={styles.metricValue}>{records.filter((record) => record.status === "PRIMARY_RECORD").length}</Text><Text style={styles.metricLabel}>primary sources</Text></View>
        </View>

        <TouchableOpacity onPress={() => router.push("/add-record" as never)} activeOpacity={0.82} style={styles.addButton}>
          <View style={styles.addIcon}><MaterialIcons name="add" size={20} color={colors.white} /></View>
          <View style={styles.addTextBox}><Text style={styles.addTitle}>Add a record</Text><Text style={styles.addSubtitle}>Save a source, claim, question, date, or evidence gap</Text></View>
          <MaterialIcons name="arrow-forward" size={20} color={colors.white} />
        </TouchableOpacity>

        {firstTask ? (
          <>
            <SectionHeading title="Focus today" />
            <TouchableOpacity onPress={() => router.push("./queue")} activeOpacity={0.78} style={styles.focusCard}>
              <View style={styles.priorityDot}><MaterialIcons name="priority-high" size={18} color={colors.red} /></View>
              <View style={styles.focusTextBox}>
                <Text style={styles.focusEyebrow}>{firstTask.priority.toUpperCase()} PRIORITY · {firstTask.state.replaceAll("_", " ")}</Text>
                <Text style={styles.focusTitle}>{firstTask.title}</Text>
                <Text style={styles.focusBody} numberOfLines={2}>{firstTask.question}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={23} color={colors.slate} />
            </TouchableOpacity>
          </>
        ) : null}

        <View style={styles.sectionWithAction}>
          <SectionHeading title="Recent records" />
          <TouchableOpacity onPress={() => router.push("./evidence")} activeOpacity={0.7}><Text style={styles.linkText}>View all</Text></TouchableOpacity>
        </View>
        <View style={styles.recordList}>
          {records.slice(0, 3).map((record) => (
            <RecordPreview key={record.id} record={record} onPress={() => router.push(`/record/${record.id}` as never)} />
          ))}
        </View>

        <SectionHeading title="Research, carefully" />
        <TouchableOpacity onPress={() => router.push("/research" as never)} activeOpacity={0.78} style={styles.researchCard}>
          <View style={styles.researchIcon}><MaterialIcons name="menu-book" size={21} color={colors.navy} /></View>
          <View style={styles.researchTextBox}>
            <Text style={styles.researchTitle}>Start a research topic</Text>
            <Text style={styles.researchBody}>Capture a question and source path. Confirm current authority and court rules before relying on it.</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={colors.navy} />
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scopeScreen: { padding: 25, justifyContent: "center", backgroundColor: colors.paper },
  scopeIcon: { width: 64, height: 64, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: colors.navy, marginBottom: 20 },
  scopeBrand: { fontSize: 15, fontWeight: "800", color: colors.navy, letterSpacing: 0.7, textTransform: "uppercase", marginBottom: 12 },
  scopeTitle: { fontSize: 31, lineHeight: 38, letterSpacing: -0.7, color: colors.charcoal, fontWeight: "800", marginBottom: 14 },
  scopeBody: { fontSize: 16, lineHeight: 24, color: colors.slate, marginBottom: 24 },
  scopeNotice: { backgroundColor: colors.blue, borderWidth: 1, borderColor: "#C7D9E8", borderRadius: 18, padding: 16, flexDirection: "row", gap: 10, alignItems: "flex-start" },
  scopeNoticeText: { flex: 1, fontSize: 13, lineHeight: 19, color: colors.navy, fontWeight: "600" },
  scopeFootnote: { fontSize: 12, lineHeight: 18, color: colors.slate, marginVertical: 20 },
  primaryButton: { backgroundColor: colors.navy, minHeight: 54, borderRadius: 16, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  primaryButtonText: { color: colors.white, fontSize: 15, fontWeight: "800" },
  container: { backgroundColor: colors.paper },
  content: { padding: 20, paddingBottom: 34, gap: 20 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  miniMark: { width: 31, height: 31, borderRadius: 10, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center" },
  brand: { fontSize: 16, fontWeight: "800", color: colors.navy, letterSpacing: -0.2 },
  settingsButton: { width: 38, height: 38, borderRadius: 13, justifyContent: "center", alignItems: "center", borderColor: colors.border, borderWidth: 1, backgroundColor: colors.white },
  kicker: { fontSize: 10, fontWeight: "800", letterSpacing: 1.1, color: colors.slate, marginBottom: -14 },
  title: { fontSize: 27, lineHeight: 33, letterSpacing: -0.5, color: colors.charcoal, fontWeight: "800", marginBottom: -15 },
  caseMeta: { fontSize: 12, lineHeight: 17, color: colors.slate, fontWeight: "600", marginBottom: -10 },
  metricsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingVertical: 14 },
  metric: { flex: 1, alignItems: "center" },
  metricValue: { color: colors.navy, fontSize: 20, lineHeight: 24, fontWeight: "800" },
  metricLabel: { color: colors.slate, fontSize: 10, lineHeight: 14, fontWeight: "700", marginTop: 2 },
  metricDivider: { width: 1, height: 30, backgroundColor: colors.border },
  addButton: { flexDirection: "row", alignItems: "center", gap: 11, padding: 14, borderRadius: 18, backgroundColor: colors.navy },
  addIcon: { width: 32, height: 32, borderRadius: 11, backgroundColor: "#2C5275", alignItems: "center", justifyContent: "center" },
  addTextBox: { flex: 1 },
  addTitle: { color: colors.white, fontSize: 15, lineHeight: 19, fontWeight: "800" },
  addSubtitle: { color: "#D9E6F0", fontSize: 11, lineHeight: 15, marginTop: 2 },
  focusCard: { flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 17, padding: 14 },
  priorityDot: { width: 34, height: 34, borderRadius: 12, justifyContent: "center", alignItems: "center", backgroundColor: "#FCE9E7", alignSelf: "flex-start" },
  focusTextBox: { flex: 1 },
  focusEyebrow: { color: colors.red, fontSize: 9, lineHeight: 13, letterSpacing: 0.5, fontWeight: "800" },
  focusTitle: { color: colors.charcoal, fontSize: 15, lineHeight: 20, fontWeight: "800", marginTop: 2 },
  focusBody: { color: colors.slate, fontSize: 12, lineHeight: 17, marginTop: 3 },
  sectionWithAction: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: -10 },
  linkText: { color: colors.navy, fontWeight: "800", fontSize: 12 },
  recordList: { gap: 9 },
  recordCard: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, padding: 14, borderRadius: 16, gap: 8 },
  recordHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  recordStatement: { color: colors.charcoal, fontSize: 14, lineHeight: 19, fontWeight: "700" },
  recordMeta: { flexDirection: "row", gap: 8, alignItems: "center" },
  sourceText: { flex: 1, color: colors.slate, fontSize: 11, fontWeight: "600" },
  researchCard: { flexDirection: "row", gap: 11, alignItems: "center", backgroundColor: colors.blue, padding: 14, borderRadius: 17, borderWidth: 1, borderColor: "#C7D9E8" },
  researchIcon: { width: 35, height: 35, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  researchTextBox: { flex: 1 },
  researchTitle: { color: colors.navy, fontSize: 14, lineHeight: 19, fontWeight: "800" },
  researchBody: { color: colors.navy, fontSize: 11, lineHeight: 16, marginTop: 2 },
});
