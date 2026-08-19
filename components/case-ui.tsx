import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { EvidenceStatus, RecordKind, kindLabel, statusLabel } from "@/lib/case-store";

const palette = {
  navy: "#16324F",
  paper: "#F7F4EE",
  charcoal: "#1F2933",
  slate: "#667085",
  teal: "#127A6A",
  gold: "#A25B00",
  red: "#B42318",
  blue: "#E8F0F7",
  border: "#D7DEE7",
  white: "#FFFFFF",
};

export function getStatusTone(status: EvidenceStatus) {
  if (status === "PRIMARY_RECORD") return { background: "#DDF4EE", color: palette.teal, icon: "verified" as const };
  if (status === "CONFLICTING") return { background: "#FCE9E7", color: palette.red, icon: "warning-amber" as const };
  if (status === "SOURCE_UNAVAILABLE") return { background: "#FCE9E7", color: palette.red, icon: "folder-off" as const };
  if (status === "VERIFY") return { background: "#FFF1D6", color: palette.gold, icon: "manage-search" as const };
  if (status === "RESEARCH_TOPIC") return { background: "#E8F0F7", color: palette.navy, icon: "menu-book" as const };
  return { background: "#EEF1F4", color: palette.slate, icon: "edit-note" as const };
}

export function StatusChip({ status }: { status: EvidenceStatus }) {
  const tone = getStatusTone(status);
  return (
    <View style={[styles.chip, { backgroundColor: tone.background }]}>
      <MaterialIcons name={tone.icon} size={14} color={tone.color} />
      <Text style={[styles.chipText, { color: tone.color }]}>{statusLabel(status)}</Text>
    </View>
  );
}

export function KindChip({ kind }: { kind: RecordKind }) {
  return (
    <View style={styles.kindChip}>
      <Text style={styles.kindText}>{kindLabel(kind)}</Text>
    </View>
  );
}

export function DisclosureBanner({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.disclosure, compact && styles.disclosureCompact]}>
      <MaterialIcons name="info-outline" size={18} color={palette.navy} />
      <Text style={styles.disclosureText}>
        CaseCompass organizes records and research leads. It is not a law firm and does not provide legal advice.
      </Text>
    </View>
  );
}

export function SectionHeading({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action}
    </View>
  );
}

export function EmptyNotice({ title, detail }: { title: string; detail: string }) {
  return (
    <View style={styles.emptyNotice}>
      <MaterialIcons name="folder-open" size={28} color={palette.slate} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{detail}</Text>
    </View>
  );
}

export function formatDate(date: string) {
  if (!date) return "Date not recorded";
  const parsed = new Date(`${date}T12:00:00`);
  return Number.isNaN(parsed.getTime())
    ? "Date needs review"
    : parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export const colors = palette;

const styles = StyleSheet.create({
  chip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999, alignSelf: "flex-start" },
  chipText: { fontSize: 10, lineHeight: 13, fontWeight: "800", letterSpacing: 0.4 },
  kindChip: { backgroundColor: "#E8F0F7", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, alignSelf: "flex-start" },
  kindText: { color: palette.navy, fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  disclosure: { flexDirection: "row", gap: 8, backgroundColor: palette.blue, borderWidth: 1, borderColor: "#C7D9E8", padding: 12, borderRadius: 14, alignItems: "flex-start" },
  disclosureCompact: { paddingVertical: 9 },
  disclosureText: { flex: 1, color: palette.navy, fontSize: 12, lineHeight: 17, fontWeight: "600" },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  sectionTitle: { color: palette.charcoal, fontSize: 18, lineHeight: 24, fontWeight: "800" },
  emptyNotice: { alignItems: "center", backgroundColor: palette.white, borderWidth: 1, borderColor: palette.border, borderRadius: 18, padding: 26, gap: 8 },
  emptyTitle: { color: palette.charcoal, fontSize: 16, fontWeight: "800" },
  emptyText: { color: palette.slate, fontSize: 13, lineHeight: 19, textAlign: "center" },
});
