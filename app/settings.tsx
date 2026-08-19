import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { DisclosureBanner, colors } from "@/components/case-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useCaseData } from "@/lib/case-store";

export default function SettingsScreen() {
  const router = useRouter();
  const { caseProfile, saveCaseProfile } = useCaseData();
  const [label, setLabel] = useState(caseProfile.label);
  const [court, setCourt] = useState(caseProfile.court);
  const [caseNumber, setCaseNumber] = useState(caseProfile.caseNumber);
  const [jurisdiction, setJurisdiction] = useState(caseProfile.jurisdiction);
  const [supervisionConditions, setSupervisionConditions] = useState(caseProfile.supervisionConditions);
  useEffect(() => { setLabel(caseProfile.label); setCourt(caseProfile.court); setCaseNumber(caseProfile.caseNumber); setJurisdiction(caseProfile.jurisdiction); setSupervisionConditions(caseProfile.supervisionConditions); }, [caseProfile]);
  function save() { saveCaseProfile({ label: label.trim() || "Untitled local workspace", court: court.trim() || "Court not recorded", caseNumber: caseNumber.trim() || "Case identifier not recorded", jurisdiction: jurisdiction.trim() || "Jurisdiction not recorded", supervisionConditions: supervisionConditions.trim() || "No condition source added" }); Alert.alert("Saved locally", "These workspace labels are stored on this device in the MVP."); }
  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}><TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backButton}><MaterialIcons name="arrow-back" size={21} color={colors.navy} /></TouchableOpacity><Text style={styles.topTitle}>Workspace settings</Text><View style={styles.topSpacer} /></View>
        <Text style={styles.title}>Case identity, carefully recorded.</Text>
        <Text style={styles.subtitle}>Enter labels only after checking the official caption, court, and case identifier. Leave uncertainty visible until resolved.</Text>
        <DisclosureBanner compact />
        <Text style={styles.label}>Workspace label</Text><TextInput value={label} onChangeText={setLabel} style={styles.input} placeholder="Example: Smith matter" placeholderTextColor="#8B97A5" returnKeyType="next" />
        <Text style={styles.label}>Court</Text><TextInput value={court} onChangeText={setCourt} style={styles.input} placeholder="Court name" placeholderTextColor="#8B97A5" returnKeyType="next" />
        <Text style={styles.label}>Case identifier</Text><TextInput value={caseNumber} onChangeText={setCaseNumber} style={styles.input} placeholder="Case number" placeholderTextColor="#8B97A5" returnKeyType="next" />
        <Text style={styles.label}>Jurisdiction</Text><TextInput value={jurisdiction} onChangeText={setJurisdiction} style={styles.input} placeholder="State, county, or jurisdiction" placeholderTextColor="#8B97A5" returnKeyType="next" />
        <Text style={styles.label}>Bond or supervision conditions</Text><TextInput value={supervisionConditions} onChangeText={setSupervisionConditions} style={[styles.input, { minHeight: 82 }]} placeholder="Record the source and terms after verification" placeholderTextColor="#8B97A5" multiline textAlignVertical="top" returnKeyType="done" />
        <TouchableOpacity onPress={save} activeOpacity={0.8} style={styles.saveButton}><Text style={styles.saveText}>Save workspace labels</Text><MaterialIcons name="save" size={18} color={colors.white} /></TouchableOpacity>
        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Privacy and export limits</Text>
        <View style={styles.infoCard}><MaterialIcons name="phone-android" size={20} color={colors.navy} /><Text style={styles.infoText}>This MVP stores its workspace on the current device. It does not provide cloud sync, account sharing, automated filing, electronic service, or a live court-record search.</Text></View>
        <View style={styles.warningCard}><MaterialIcons name="warning-amber" size={20} color={colors.gold} /><Text style={styles.warningText}>Before sharing records, redact unneeded personal identifiers and independently review court rules, formatting, signature, and service requirements.</Text></View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.paper }, content: { padding: 20, paddingBottom: 34, gap: 11 }, topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }, backButton: { width: 39, height: 39, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, justifyContent: "center", alignItems: "center" }, topTitle: { color: colors.navy, fontSize: 14, fontWeight: "800" }, topSpacer: { width: 39 }, title: { color: colors.charcoal, fontSize: 25, lineHeight: 31, letterSpacing: -0.4, fontWeight: "800", marginTop: 6 }, subtitle: { color: colors.slate, fontSize: 13, lineHeight: 19, marginBottom: 2 }, label: { marginTop: 9, color: colors.charcoal, fontSize: 13, fontWeight: "800" }, input: { minHeight: 47, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, color: colors.charcoal, paddingHorizontal: 13, paddingVertical: 12, fontSize: 13, lineHeight: 18 }, saveButton: { minHeight: 52, borderRadius: 16, backgroundColor: colors.navy, justifyContent: "center", alignItems: "center", flexDirection: "row", gap: 8, marginTop: 6 }, saveText: { color: colors.white, fontSize: 14, fontWeight: "800" }, divider: { height: 1, backgroundColor: colors.border, marginVertical: 10 }, sectionTitle: { color: colors.charcoal, fontSize: 17, lineHeight: 23, fontWeight: "800" }, infoCard: { flexDirection: "row", gap: 9, backgroundColor: colors.blue, borderColor: "#C7D9E8", borderWidth: 1, borderRadius: 15, padding: 13, alignItems: "flex-start" }, infoText: { flex: 1, color: colors.navy, fontSize: 12, lineHeight: 17, fontWeight: "700" }, warningCard: { flexDirection: "row", gap: 9, backgroundColor: "#FFF1D6", borderColor: "#F0D19D", borderWidth: 1, borderRadius: 15, padding: 13, alignItems: "flex-start" }, warningText: { flex: 1, color: colors.gold, fontSize: 12, lineHeight: 17, fontWeight: "700" },
});
