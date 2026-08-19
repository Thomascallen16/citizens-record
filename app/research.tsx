import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { DisclosureBanner, colors } from "@/components/case-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useCaseData } from "@/lib/case-store";

export default function ResearchScreen() {
  const router = useRouter();
  const { addRecord } = useCaseData();
  const [question, setQuestion] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [sourcePath, setSourcePath] = useState("");

  function saveTopic() {
    if (!question.trim()) { Alert.alert("Add a research question", "Phrase the topic as a neutral question before saving it to the workspace."); return; }
    addRecord({ kind: "LEGAL_AUTHORITY", status: "RESEARCH_TOPIC", statement: question.trim(), source: sourcePath.trim() || "No authority verified yet", location: jurisdiction.trim() || "Jurisdiction not recorded", date: "", people: "Not applicable", confidence: "Unverified", passage: "Research topic only. Confirm current primary authority and the exact procedural posture before relying on it.", nextAction: "Locate and verify the current primary authority and applicable court rules.", });
    router.back();
  }

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}><TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backButton}><MaterialIcons name="arrow-back" size={21} color={colors.navy} /></TouchableOpacity><Text style={styles.topTitle}>Research notebook</Text><View style={styles.topSpacer} /></View>
        <View style={styles.heroIcon}><MaterialIcons name="menu-book" size={26} color={colors.navy} /></View>
        <Text style={styles.title}>Keep legal topics as questions until verified.</Text>
        <Text style={styles.subtitle}>This notebook helps you track where to look. It does not validate a rule, deadline, legal theory, or filing strategy.</Text>
        <DisclosureBanner compact />
        <Text style={styles.label}>Neutral research question</Text>
        <TextInput value={question} onChangeText={setQuestion} placeholder="Example: What current rule governs this type of request in this court?" placeholderTextColor="#8B97A5" multiline style={[styles.input, styles.textarea]} textAlignVertical="top" />
        <Text style={styles.label}>Jurisdiction or court, if known</Text>
        <TextInput value={jurisdiction} onChangeText={setJurisdiction} placeholder="Example: State / county / court" placeholderTextColor="#8B97A5" style={styles.input} returnKeyType="next" />
        <Text style={styles.label}>Possible primary source path</Text>
        <TextInput value={sourcePath} onChangeText={setSourcePath} placeholder="Official rules site, statute, opinion, or court order" placeholderTextColor="#8B97A5" style={styles.input} returnKeyType="done" />
        <View style={styles.reminder}><MaterialIcons name="visibility" size={18} color={colors.gold} /><Text style={styles.reminderText}>Record both helpful and limiting authority. Do not rely on a citation until you have reviewed the current source in its proper jurisdiction.</Text></View>
        <TouchableOpacity onPress={saveTopic} activeOpacity={0.8} style={styles.saveButton}><Text style={styles.saveText}>Save research topic</Text><MaterialIcons name="bookmark-add" size={18} color={colors.white} /></TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.paper }, content: { padding: 20, paddingBottom: 34, gap: 11 }, topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }, backButton: { width: 39, height: 39, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, justifyContent: "center", alignItems: "center" }, topTitle: { color: colors.navy, fontSize: 14, fontWeight: "800" }, topSpacer: { width: 39 }, heroIcon: { width: 51, height: 51, borderRadius: 17, justifyContent: "center", alignItems: "center", backgroundColor: colors.blue, marginTop: 6 }, title: { color: colors.charcoal, fontSize: 25, lineHeight: 31, letterSpacing: -0.4, fontWeight: "800" }, subtitle: { color: colors.slate, fontSize: 13, lineHeight: 19, marginBottom: 2 }, label: { marginTop: 9, color: colors.charcoal, fontSize: 13, fontWeight: "800" }, input: { minHeight: 47, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, color: colors.charcoal, paddingHorizontal: 13, paddingVertical: 12, fontSize: 13, lineHeight: 18 }, textarea: { minHeight: 94 }, reminder: { flexDirection: "row", gap: 8, alignItems: "flex-start", backgroundColor: "#FFF1D6", borderRadius: 14, borderWidth: 1, borderColor: "#F0D19D", padding: 12, marginTop: 4 }, reminderText: { flex: 1, color: colors.gold, fontSize: 12, lineHeight: 17, fontWeight: "700" }, saveButton: { minHeight: 52, borderRadius: 16, backgroundColor: colors.navy, justifyContent: "center", alignItems: "center", flexDirection: "row", gap: 8, marginTop: 4 }, saveText: { color: colors.white, fontSize: 14, fontWeight: "800" },
});
