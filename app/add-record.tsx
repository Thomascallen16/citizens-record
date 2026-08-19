import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { DisclosureBanner, colors } from "@/components/case-ui";
import { ScreenContainer } from "@/components/screen-container";
import { EvidenceStatus, RecordKind, useCaseData } from "@/lib/case-store";

const kinds: RecordKind[] = ["SOURCE", "CLAIM", "QUESTION", "DATE", "MISSING_EVIDENCE", "CONTRADICTION", "PERSON", "AGENCY"];
const statuses: EvidenceStatus[] = ["PRIMARY_RECORD", "USER_REPORTED", "VERIFY", "SOURCE_UNAVAILABLE", "CONFLICTING"];

export default function AddRecordScreen() {
  const router = useRouter();
  const { addRecord } = useCaseData();
  const [kind, setKind] = useState<RecordKind>("SOURCE");
  const [status, setStatus] = useState<EvidenceStatus>("VERIFY");
  const [statement, setStatement] = useState("");
  const [source, setSource] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [people, setPeople] = useState("");
  const [passage, setPassage] = useState("");
  const [nextAction, setNextAction] = useState("");

  function save() {
    if (!statement.trim() || !source.trim()) {
      Alert.alert("Add a statement and source", "Describe a neutral statement or question, and record where it came from before saving.");
      return;
    }
    addRecord({ kind, status, statement: statement.trim(), source: source.trim(), location: location.trim(), date: date.trim(), people: people.trim() || "Not recorded", passage: passage.trim() || "No passage or summary recorded.", nextAction: nextAction.trim() || "Review the source, preserve its location, and define the next verification step.", confidence: status === "PRIMARY_RECORD" ? "High" : status === "VERIFY" ? "Needs review" : "Unverified" });
    router.back();
  }

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.topRow}><TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}><MaterialIcons name="arrow-back" size={21} color={colors.navy} /></TouchableOpacity><Text style={styles.topTitle}>New record</Text><View style={styles.topSpacer} /></View>
        <Text style={styles.title}>Capture what the source actually supports.</Text>
        <Text style={styles.subtitle}>Use neutral wording. If the item has not been verified, say so with its status rather than treating it as settled.</Text>
        <DisclosureBanner compact />

        <FormLabel label="Record category" hint="What is this entry?" />
        <Selector items={kinds} value={kind} onChange={setKind} />
        <FormLabel label="Verification status" hint="How should this be treated right now?" />
        <Selector items={statuses} value={status} onChange={setStatus} />
        <FormLabel label="Neutral statement or question" required />
        <TextInput value={statement} onChangeText={setStatement} multiline placeholder="Example: What original record verifies the reported hearing date?" placeholderTextColor="#8B97A5" style={[styles.input, styles.textarea]} textAlignVertical="top" />
        <FormLabel label="Source name" required />
        <TextInput value={source} onChangeText={setSource} placeholder="Example: Court calendar export, witness note, email" placeholderTextColor="#8B97A5" style={styles.input} returnKeyType="next" />
        <FormLabel label="Location or citation" hint="Page, entry, timestamp, URL, or file name" />
        <TextInput value={location} onChangeText={setLocation} placeholder="Example: Page 3, line 12" placeholderTextColor="#8B97A5" style={styles.input} returnKeyType="next" />
        <FormLabel label="Date" hint="Use YYYY-MM-DD when known" />
        <TextInput value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor="#8B97A5" style={styles.input} autoCapitalize="none" returnKeyType="next" />
        <FormLabel label="People or agency" />
        <TextInput value={people} onChangeText={setPeople} placeholder="Names/roles as recorded, or leave blank" placeholderTextColor="#8B97A5" style={styles.input} returnKeyType="next" />
        <FormLabel label="Passage or source summary" />
        <TextInput value={passage} onChangeText={setPassage} multiline placeholder="Quote or summarize the relevant passage. Keep it attributable to the source." placeholderTextColor="#8B97A5" style={[styles.input, styles.textarea]} textAlignVertical="top" />
        <FormLabel label="Next action" />
        <TextInput value={nextAction} onChangeText={setNextAction} multiline placeholder="Example: Request the original notice and keep the full docket header." placeholderTextColor="#8B97A5" style={[styles.input, styles.textarea]} textAlignVertical="top" />
        <TouchableOpacity onPress={save} activeOpacity={0.8} style={styles.saveButton}><Text style={styles.saveText}>Save local record</Text><MaterialIcons name="check" size={19} color={colors.white} /></TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}

function FormLabel({ label, hint, required }: { label: string; hint?: string; required?: boolean }) {
  return <View style={styles.labelRow}><Text style={styles.label}>{label}{required ? <Text style={styles.required}> *</Text> : null}</Text>{hint ? <Text style={styles.hint}>{hint}</Text> : null}</View>;
}

function Selector<T extends string>({ items, value, onChange }: { items: T[]; value: T; onChange: (next: T) => void }) {
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorRow}>{items.map((item) => { const active = item === value; return <TouchableOpacity key={item} onPress={() => onChange(item)} activeOpacity={0.76} style={[styles.selector, active && styles.selectorActive]}><Text style={[styles.selectorText, active && styles.selectorTextActive]}>{item.replaceAll("_", " ")}</Text></TouchableOpacity>; })}</ScrollView>;
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.paper }, content: { padding: 20, paddingBottom: 34, gap: 10 }, topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }, backButton: { width: 39, height: 39, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, justifyContent: "center", alignItems: "center" }, topTitle: { color: colors.navy, fontSize: 14, fontWeight: "800" }, topSpacer: { width: 39 },
  title: { color: colors.charcoal, fontSize: 26, lineHeight: 32, letterSpacing: -0.5, fontWeight: "800", marginTop: 8 }, subtitle: { color: colors.slate, fontSize: 13, lineHeight: 19, marginBottom: 5 }, labelRow: { gap: 2, marginTop: 9 }, label: { color: colors.charcoal, fontSize: 13, fontWeight: "800" }, required: { color: colors.red }, hint: { color: colors.slate, fontSize: 11, lineHeight: 15 },
  selectorRow: { paddingRight: 20, gap: 8 }, selector: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white }, selectorActive: { backgroundColor: colors.navy, borderColor: colors.navy }, selectorText: { color: colors.slate, fontSize: 10, fontWeight: "800", letterSpacing: 0.1 }, selectorTextActive: { color: colors.white },
  input: { minHeight: 47, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, color: colors.charcoal, paddingHorizontal: 13, paddingVertical: 12, fontSize: 13, lineHeight: 18 }, textarea: { minHeight: 88 }, saveButton: { minHeight: 52, marginTop: 12, borderRadius: 16, backgroundColor: colors.navy, justifyContent: "center", alignItems: "center", flexDirection: "row", gap: 8 }, saveText: { color: colors.white, fontSize: 14, fontWeight: "800" },
});
