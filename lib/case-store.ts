import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useSyncExternalStore } from "react";

export type RecordKind =
  | "FACT"
  | "CLAIM"
  | "SOURCE"
  | "CONTRADICTION"
  | "MISSING_EVIDENCE"
  | "DATE"
  | "PERSON"
  | "AGENCY"
  | "LEGAL_AUTHORITY"
  | "QUESTION";

export type EvidenceStatus =
  | "PRIMARY_RECORD"
  | "USER_REPORTED"
  | "RESEARCH_TOPIC"
  | "VERIFY"
  | "SOURCE_UNAVAILABLE"
  | "CONFLICTING";

export type DiscoveryState = "TODO" | "REQUESTED" | "RECEIVED" | "NEEDS_REVIEW";

export type EvidenceRecord = {
  id: string;
  kind: RecordKind;
  statement: string;
  source: string;
  location: string;
  date: string;
  people: string;
  confidence: "High" | "Needs review" | "Unverified";
  passage: string;
  status: EvidenceStatus;
  nextAction: string;
};

export type DiscoveryTask = {
  id: string;
  title: string;
  question: string;
  custodian: string;
  handlingNote: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  state: DiscoveryState;
  linkedRecordId?: string;
};

export type CaseProfile = {
  label: string;
  court: string;
  caseNumber: string;
};

type CaseState = {
  scopeAcknowledged: boolean;
  caseProfile: CaseProfile;
  records: EvidenceRecord[];
  discovery: DiscoveryTask[];
};

const STORAGE_KEY = "casecompass-local-workspace-v1";

const initialState: CaseState = {
  scopeAcknowledged: false,
  caseProfile: {
    label: "Fictional demo workspace",
    court: "Add court when verified",
    caseNumber: "Not entered",
  },
  records: [
    {
      id: "demo-source-1",
      kind: "SOURCE",
      statement: "A fictional sample docket entry is available for comparison.",
      source: "Fictional demo docket index",
      location: "Entry 04",
      date: "2026-08-10",
      people: "Not verified",
      confidence: "Needs review",
      passage: "Demo material only — replace with a source you can identify and retain.",
      status: "VERIFY",
      nextAction: "Compare against the official docket header before relying on any date or caption.",
    },
    {
      id: "demo-claim-1",
      kind: "CLAIM",
      statement: "A hearing date is reported in a user-created note.",
      source: "User-reported demo note",
      location: "Notebook page 1",
      date: "2026-08-12",
      people: "Not verified",
      confidence: "Unverified",
      passage: "Reported date: August 12. No primary record has been attached.",
      status: "USER_REPORTED",
      nextAction: "Obtain a file-stamped notice, docket entry, or official calendar record.",
    },
    {
      id: "demo-gap-1",
      kind: "MISSING_EVIDENCE",
      statement: "The source record for the reported hearing date has not been added.",
      source: "CaseCompass fictional demo",
      location: "Verification queue",
      date: "",
      people: "Not applicable",
      confidence: "Unverified",
      passage: "Absence of a record is an acquisition question, not a conclusion about what occurred.",
      status: "SOURCE_UNAVAILABLE",
      nextAction: "Record which office controls the item and how you will request or review it.",
    },
  ],
  discovery: [
    {
      id: "demo-task-1",
      title: "Verify court and case identifier",
      question: "What exact case number, caption, and current posture appear on the official docket header?",
      custodian: "Court clerk or authorized public docket source",
      handlingNote: "Preserve the full docket header and access date with the record.",
      priority: "Critical",
      state: "TODO",
      linkedRecordId: "demo-source-1",
    },
    {
      id: "demo-task-2",
      title: "Locate the hearing notice",
      question: "Which primary record verifies the reported hearing date and time?",
      custodian: "Court clerk or authorized records source",
      handlingNote: "Keep the original file or complete official export, not only a handwritten summary.",
      priority: "High",
      state: "TODO",
      linkedRecordId: "demo-claim-1",
    },
  ],
};

let state = initialState;
let hasHydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function save(next: CaseState) {
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
}

function update(updater: (previous: CaseState) => CaseState) {
  state = updater(state);
  save(state);
  emit();
}

async function hydrate() {
  if (hasHydrated) return;
  hasHydrated = true;
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as CaseState;
      if (parsed.records && parsed.discovery && parsed.caseProfile) {
        state = parsed;
        emit();
      }
    }
  } catch {
    // The workspace remains usable with its explicitly fictional local demo data.
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

export function useCaseData() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    void hydrate();
  }, []);

  return {
    ...snapshot,
    acknowledgeScope: () => update((previous) => ({ ...previous, scopeAcknowledged: true })),
    addRecord: (record: Omit<EvidenceRecord, "id">) => {
      const newRecord = { ...record, id: `record-${Date.now()}` };
      update((previous) => ({ ...previous, records: [newRecord, ...previous.records] }));
      return newRecord;
    },
    updateRecordStatus: (recordId: string, status: EvidenceStatus) =>
      update((previous) => ({
        ...previous,
        records: previous.records.map((record) => (record.id === recordId ? { ...record, status } : record)),
      })),
    updateDiscoveryState: (taskId: string, taskState: DiscoveryState) =>
      update((previous) => ({
        ...previous,
        discovery: previous.discovery.map((task) => (task.id === taskId ? { ...task, state: taskState } : task)),
      })),
    saveCaseProfile: (caseProfile: CaseProfile) => update((previous) => ({ ...previous, caseProfile })),
  };
}

export const statusLabel = (status: EvidenceStatus) => status.replaceAll("_", " ");
export const kindLabel = (kind: RecordKind) => kind.replaceAll("_", " ");
export const discoveryStateLabel = (taskState: DiscoveryState) => taskState.replaceAll("_", " ");
export const nextDiscoveryState = (taskState: DiscoveryState): DiscoveryState => {
  const transitions: Record<DiscoveryState, DiscoveryState> = {
    TODO: "REQUESTED",
    REQUESTED: "NEEDS_REVIEW",
    NEEDS_REVIEW: "RECEIVED",
    RECEIVED: "TODO",
  };
  return transitions[taskState];
};
