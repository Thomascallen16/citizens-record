import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { DisclosureBanner, KindChip, SectionHeading, StatusChip, colors, formatDate } from "@/components/case-ui";
import { ScreenContainer } from "@/components/screen-container";
import { EvidenceRecord, useCaseData } from "@/lib/case-store";

type AlertItem = { id: string; title: string; body: string; tone: "warning" | "danger" | "info"; route: string };

function recordAlerts(records: EvidenceRecord[]): AlertItem[] {
  const alerts: AlertItem[] = [];
  records.forEach((record) => {
    if (record.potentialDiscrepancy) alerts.push({ id: `discrepancy-${record.id}`, title: "Potential discrepancy needs review", body: record.potentialDiscrepancy, tone: "danger", route: `/record/${record.id}` });
    else if (record.status === "SOURCE_UNAVAILABLE" || record.appearsMissing) alerts.push({ id: `missing-${record.id}`, title: "Expected item not yet located", body: record.itemName, tone: "warning", route: `/record/${record.id}` });
    else if (record.status === "VERIFY") alerts.push({ id: `verify-${record.id}`, title: "Source needs verification", body: record.nextAction, tone: "info", route: `/record/${record.id}` });
  });
  return alerts;
}

export default function TodayScreen() {
  const router = useRouter();
  const { caseProfile, records, discovery, scopeAcknowledged, acknowledgeScope, research, peopleProfiles } = useCaseData();
  const alerts = recordAlerts(records).slice(0, 4);
  const upcoming = records.filter((record) => record.date && record.date >= "2026-08-19").sort((a, b) => a.date.localeCompare(b.date)).slice(0, 2);
  const openDiscovery = discovery.filter((task) => !["REVIEWED", "RECEIVED"].includes(task.state));
  const criticalDiscovery = openDiscovery.filter((task) => task.priority === "Critical" || task.priority === "High").length;

  if (!scopeAcknowledged) {
    return <ScreenContainer edges={["top", "bottom", "left", "right"]} style={styles.scopeScreen}>
      <View style={styles.scopeMark}><MaterialIcons name="travel-explore" size={34} color={colors.white} /></View>
      <Text style={styles.scopeBrand}>CaseCompass</Text>
      <Text style={styles.scopeTitle}>A private, source-first workspace for your own review.</Text>
      <Text style={styles.scopeBody}>Organize records, identify unanswered questions, track expected materials, and preserve where each statement came from.</Text>
      <View style={styles.scopeNotice}><MaterialIcons name="gavel" size={19} color={colors.navy} /><Text style={styles.scopeNoticeText}>CaseCompass is not a lawyer or law firm. It does not represent you, make legal decisions, authenticate evidence, or tell you what to file.</Text></View>
      <Text style={styles.scopeFootnote}>Use official and authorized sources where possible. Treat user-reported material, AI output, and missing items as leads that need review.</Text>
      <TouchableOpacity onPress={acknowledgeScope} activeOpacity={0.82} style={styles.primaryButton}><Text style={styles.primaryButtonText}>I understand — open workspace</Text><MaterialIcons name="arrow-forward" size={19} color={colors.white} /></TouchableOpacity>
    </ScreenContainer>;
  }

  return <ScreenContainer style={styles.container}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.topRow}><View style={styles.brandRow}><View style={styles.miniMark}><MaterialIcons name="travel-explore" size={18} color={colors.white} /></View><Text style={styles.brand}>CaseCompass</Text></View><TouchableOpacity onPress={() => router.push("/privacy" as never)} activeOpacity={0.7} style={styles.settingsButton}><MaterialIcons name="shield" size={19} color={colors.navy} /></TouchableOpacity></View>
      <Text style={styles.kicker}>CASE INTELLIGENCE DASHBOARD</Text>
      <Text style={styles.title}>{caseProfile.label}</Text>
      <Text style={styles.caseMeta}>{caseProfile.court} · {caseProfile.caseNumber}</Text>
      <DisclosureBanner compact />

      <View style={styles.metricGrid}>
        <Metric icon="event" label="Upcoming dates" value={String(upcoming.length)} tone="blue" />
        <Metric icon="assignment-late" label="Open discovery" value={String(openDiscovery.length)} tone="gold" />
        <Metric icon="compare-arrows" label="Review flags" value={String(alerts.length)} tone="red" />
        <Metric icon="manage-search" label="Research topics" value={String(research.length)} tone="teal" />
      </View>

      <TouchableOpacity onPress={() => router.push("/add-record" as never)} activeOpacity={0.82} style={styles.addButton}><View style={styles.addIcon}><MaterialIcons name="add" size={20} color={colors.white} /></View><View style={styles.addTextBox}><Text style={styles.addTitle}>Capture a source or case question</Text><Text style={styles.addSubtitle}>Add evidence, a date, a claim, an expected item, or a verification question.</Text></View><MaterialIcons name="arrow-forward" size={20} color={colors.white} /></TouchableOpacity>

      <SectionHeading title="Intelligence alerts" />
      {alerts.length ? <View style={styles.stack}>{alerts.map((alert) => <AlertCard key={alert.id} alert={alert} onPress={() => router.push(alert.route as never)} />)}</View> : <View style={styles.emptyCard}><MaterialIcons name="task-alt" size={21} color={colors.teal} /><Text style={styles.emptyCardText}>No high-visibility source or discrepancy flags are currently recorded.</Text></View>}

      <SectionHeading title="Court and case watch" />
      <View style={styles.watchCard}>
        <WatchRow icon="event" label="Upcoming court dates" value={upcoming.length ? upcoming.map((item) => formatDate(item.date)).join(" · ") : "No verified date recorded"} onPress={() => router.push("./timeline")} />
        <WatchRow icon="rule" label="Bond / supervision conditions" value={caseProfile.supervisionConditions} onPress={() => router.push("/settings" as never)} />
        <WatchRow icon="priority-high" label="High-priority discovery" value={`${criticalDiscovery} item${criticalDiscovery === 1 ? "" : "s"} need attention`} onPress={() => router.push("./queue")} last />
      </View>

      <SectionHeading title="Workspace tools" />
      <View style={styles.toolGrid}>
        <Tool icon="fact-check" title="Evidence" detail={`${records.length} records`} onPress={() => router.push("./evidence")} />
        <Tool icon="menu-book" title="Research" detail="Sources & questions" onPress={() => router.push("/research" as never)} />
        <Tool icon="description" title="Records requests" detail="Editable drafts" onPress={() => router.push("/records-requests" as never)} />
        <Tool icon="groups" title="People" detail={`${peopleProfiles.length} profiles`} onPress={() => router.push("/people" as never)} />
        <Tool icon="folder-copy" title="Filing workspace" detail="Source-linked drafts" onPress={() => router.push("/filings" as never)} />
        <Tool icon="smart-toy" title="Workspace assistant" detail="Grounded local review" onPress={() => router.push("/assistant" as never)} />
      </View>
    </ScrollView>
  </ScreenContainer>;
}

function Metric({ icon, label, value, tone }: { icon: "event" | "assignment-late" | "compare-arrows" | "manage-search"; label: string; value: string; tone: "blue" | "gold" | "red" | "teal" }) {
  const palette = { blue: { bg: colors.blue, color: colors.navy }, gold: { bg: "#FFF1D6", color: colors.gold }, red: { bg: "#FCE9E7", color: colors.red }, teal: { bg: "#DDF4EE", color: colors.teal } }[tone];
  return <View style={styles.metric}><View style={[styles.metricIcon, { backgroundColor: palette.bg }]}><MaterialIcons name={icon} size={17} color={palette.color} /></View><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

function AlertCard({ alert, onPress }: { alert: AlertItem; onPress: () => void }) {
  const tone = alert.tone === "danger" ? { bg: "#FCE9E7", color: colors.red, icon: "warning-amber" as const } : alert.tone === "warning" ? { bg: "#FFF1D6", color: colors.gold, icon: "search" as const } : { bg: colors.blue, color: colors.navy, icon: "info-outline" as const };
  return <TouchableOpacity onPress={onPress} activeOpacity={0.78} style={styles.alertCard}><View style={[styles.alertIcon, { backgroundColor: tone.bg }]}><MaterialIcons name={tone.icon} size={18} color={tone.color} /></View><View style={styles.alertTextBox}><Text style={[styles.alertTitle, { color: tone.color }]}>{alert.title}</Text><Text style={styles.alertBody} numberOfLines={2}>{alert.body}</Text></View><MaterialIcons name="chevron-right" size={21} color={colors.slate} /></TouchableOpacity>;
}

function WatchRow({ icon, label, value, onPress, last }: { icon: "event" | "rule" | "priority-high"; label: string; value: string; onPress: () => void; last?: boolean }) {
  return <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={[styles.watchRow, last && styles.watchRowLast]}><MaterialIcons name={icon} size={18} color={colors.navy} /><View style={styles.watchTextBox}><Text style={styles.watchLabel}>{label}</Text><Text style={styles.watchValue} numberOfLines={2}>{value}</Text></View><MaterialIcons name="chevron-right" size={20} color={colors.slate} /></TouchableOpacity>;
}

function Tool({ icon, title, detail, onPress }: { icon: "fact-check" | "menu-book" | "description" | "groups" | "folder-copy" | "smart-toy"; title: string; detail: string; onPress: () => void }) {
  return <TouchableOpacity onPress={onPress} activeOpacity={0.76} style={styles.tool}><MaterialIcons name={icon} size={21} color={colors.navy} /><Text style={styles.toolTitle}>{title}</Text><Text style={styles.toolDetail} numberOfLines={1}>{detail}</Text></TouchableOpacity>;
}

const styles = StyleSheet.create({
  scopeScreen: { padding: 25, justifyContent: "center", backgroundColor: colors.paper }, scopeMark: { width: 64, height: 64, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: colors.navy, marginBottom: 20 }, scopeBrand: { fontSize: 14, fontWeight: "800", color: colors.navy, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 12 }, scopeTitle: { fontSize: 30, lineHeight: 38, letterSpacing: -0.7, color: colors.charcoal, fontWeight: "800", marginBottom: 14 }, scopeBody: { fontSize: 16, lineHeight: 24, color: colors.slate, marginBottom: 24 }, scopeNotice: { backgroundColor: colors.blue, borderWidth: 1, borderColor: "#C7D9E8", borderRadius: 18, padding: 16, flexDirection: "row", gap: 10, alignItems: "flex-start" }, scopeNoticeText: { flex: 1, fontSize: 13, lineHeight: 19, color: colors.navy, fontWeight: "600" }, scopeFootnote: { fontSize: 12, lineHeight: 18, color: colors.slate, marginVertical: 20 }, primaryButton: { backgroundColor: colors.navy, minHeight: 54, borderRadius: 16, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }, primaryButtonText: { color: colors.white, fontSize: 15, fontWeight: "800" },
  container: { backgroundColor: colors.paper }, content: { padding: 20, paddingBottom: 34, gap: 18 }, topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, brandRow: { flexDirection: "row", alignItems: "center", gap: 8 }, miniMark: { width: 31, height: 31, borderRadius: 10, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center" }, brand: { fontSize: 16, fontWeight: "800", color: colors.navy }, settingsButton: { width: 38, height: 38, borderRadius: 13, justifyContent: "center", alignItems: "center", borderColor: colors.border, borderWidth: 1, backgroundColor: colors.white }, kicker: { fontSize: 10, fontWeight: "800", letterSpacing: 1.05, color: colors.slate, marginBottom: -13 }, title: { fontSize: 27, lineHeight: 33, letterSpacing: -0.5, color: colors.charcoal, fontWeight: "800", marginBottom: -14 }, caseMeta: { fontSize: 12, lineHeight: 17, color: colors.slate, fontWeight: "600", marginBottom: -8 },
  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 }, metric: { width: "48.8%", minHeight: 105, backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 12, justifyContent: "space-between" }, metricIcon: { width: 31, height: 31, borderRadius: 10, alignItems: "center", justifyContent: "center" }, metricValue: { color: colors.charcoal, fontSize: 22, lineHeight: 25, fontWeight: "800", marginTop: 4 }, metricLabel: { color: colors.slate, fontSize: 10, lineHeight: 14, fontWeight: "700" },
  addButton: { flexDirection: "row", alignItems: "center", gap: 11, padding: 14, borderRadius: 18, backgroundColor: colors.navy }, addIcon: { width: 32, height: 32, borderRadius: 11, backgroundColor: "#2C5275", alignItems: "center", justifyContent: "center" }, addTextBox: { flex: 1 }, addTitle: { color: colors.white, fontSize: 14, lineHeight: 19, fontWeight: "800" }, addSubtitle: { color: "#D9E6F0", fontSize: 11, lineHeight: 15, marginTop: 2 }, stack: { gap: 9 }, alertCard: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 16, borderColor: colors.border, borderWidth: 1, backgroundColor: colors.white }, alertIcon: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center", alignSelf: "flex-start" }, alertTextBox: { flex: 1 }, alertTitle: { fontSize: 12, lineHeight: 16, fontWeight: "800" }, alertBody: { color: colors.slate, fontSize: 11, lineHeight: 16, marginTop: 2 }, emptyCard: { flexDirection: "row", gap: 8, alignItems: "center", borderRadius: 15, backgroundColor: "#DDF4EE", padding: 13, borderWidth: 1, borderColor: "#B5E1D7" }, emptyCardText: { color: colors.teal, fontSize: 12, lineHeight: 17, fontWeight: "700", flex: 1 },
  watchCard: { backgroundColor: colors.white, borderRadius: 17, borderColor: colors.border, borderWidth: 1, overflow: "hidden" }, watchRow: { flexDirection: "row", padding: 13, gap: 10, alignItems: "center", borderBottomColor: "#EDF0F3", borderBottomWidth: 1 }, watchRowLast: { borderBottomWidth: 0 }, watchTextBox: { flex: 1 }, watchLabel: { color: colors.charcoal, fontSize: 12, lineHeight: 16, fontWeight: "800" }, watchValue: { color: colors.slate, fontSize: 11, lineHeight: 16, marginTop: 1 }, toolGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 }, tool: { width: "48.8%", minHeight: 112, padding: 13, backgroundColor: colors.white, borderRadius: 16, borderColor: colors.border, borderWidth: 1, justifyContent: "space-between" }, toolTitle: { color: colors.charcoal, fontSize: 13, lineHeight: 17, fontWeight: "800", marginTop: 9 }, toolDetail: { color: colors.slate, fontSize: 10, lineHeight: 14, fontWeight: "600", marginTop: 2 },
});
