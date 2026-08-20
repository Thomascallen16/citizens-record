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

export type DiscoveryState = "EXPECTED" | "REQUESTED" | "RECEIVED" | "REVIEWED" | "POSSIBLY_MISSING";
export type TimePrecision = "EXACT" | "APPROXIMATE" | "RANGE" | "CONFLICTING" | "UNSPECIFIED";
export type Priority = "Critical" | "High" | "Medium" | "Low";

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
  itemName: string;
  createdDate: string;
  receivedDate: string;
  incidentDate: string;
  custodian: string;
  fileHash: string;
  chainOfCustody: string;
  relatedPeople: string[];
  relatedEvents: string[];
  relatedAllegations: string[];
  requested: boolean;
  disclosed: boolean;
  appearsMissing: boolean;
  reliabilityConcerns: string;
  authenticationQuestions: string;
  potentialDiscrepancy: string;
  userNotes: string;
  timePrecision: TimePrecision;
};

export type DiscoveryTask = {
  id: string;
  title: string;
  category: string;
  question: string;
  custodian: string;
  handlingNote: string;
  priority: Priority;
  state: DiscoveryState;
  linkedRecordId?: string;
  requestDate: string;
  receivedDate: string;
  reviewDate: string;
  requestReference: string;
  followUp: string;
};

export type ResearchItem = {
  id: string;
  question: string;
  category: "STATUTE" | "COURT_RULE" | "CASE_LAW" | "GOVERNMENT" | "PUBLIC_RECORD" | "POLICY" | "NEWS" | "OTHER";
  title: string;
  publisher: string;
  url: string;
  accessDate: string;
  publicationDate: string;
  quotation: string;
  summary: string;
  status: "TOPIC" | "SOURCE_REVIEWED" | "VERIFY";
};

export type PersonProfile = {
  id: string;
  name: string;
  role: "DEFENDANT" | "ATTORNEY" | "PROSECUTOR" | "JUDGE" | "OFFICER" | "WITNESS" | "EXPERT" | "INVESTIGATOR" | "AGENCY" | "OTHER";
  relationship: string;
  sourceNote: string;
  relatedRecordIds: string[];
  openQuestion: string;
};

export type RecordsRequest = {
  id: string;
  jurisdiction: string;
  agency: string;
  subject: string;
  dateRange: string;
  categories: string[];
  requestDate: string;
  responseDeadline: string;
  referenceNumber: string;
  fees: string;
  status: "DRAFT" | "SENT" | "EXTENDED" | "PRODUCED" | "DENIED" | "FOLLOW_UP";
};

export type FilingDraft = {
  id: string;
  title: string;
  type: "MOTION" | "RESPONSE" | "EXHIBIT" | "AFFIDAVIT" | "NOTICE" | "CORRESPONDENCE" | "MEMORANDUM" | "OTHER";
  statement: string;
  supportRecordIds: string[];
  status: "DRAFT" | "REVIEW";
};

export type CaseProfile = {
  label: string;
  court: string;
  caseNumber: string;
  jurisdiction: string;
  supervisionConditions: string;
};

type CaseState = {
  version: 2;
  scopeAcknowledged: boolean;
  caseProfile: CaseProfile;
  records: EvidenceRecord[];
  discovery: DiscoveryTask[];
  research: ResearchItem[];
  peopleProfiles: PersonProfile[];
  recordsRequests: RecordsRequest[];
  filingDrafts: FilingDraft[];
  localOnly: boolean;
  biometricGateEnabled: boolean;
};

const STORAGE_KEY = "casecompass-local-workspace-v2";
const OLD_STORAGE_KEY = "casecompass-local-workspace-v1";

const today = "2026-08-19";

function evidenceDefaults(partial: Partial<EvidenceRecord>): EvidenceRecord {
  const statement = partial.statement ?? "Untitled record";
  const date = partial.date ?? "";
  return {
    id: partial.id ?? `record-${Date.now()}`,
    kind: partial.kind ?? "SOURCE",
    statement,
    source: partial.source ?? "Source not recorded",
    location: partial.location ?? "",
    date,
    people: partial.people ?? "Not recorded",
    confidence: partial.confidence ?? "Unverified",
    passage: partial.passage ?? "No passage or source summary recorded.",
    status: partial.status ?? "VERIFY",
    nextAction: partial.nextAction ?? "Review the original source and identify the next verification step.",
    itemName: partial.itemName ?? statement.slice(0, 72),
    createdDate: partial.createdDate ?? "",
    receivedDate: partial.receivedDate ?? "",
    incidentDate: partial.incidentDate ?? date,
    custodian: partial.custodian ?? "Not recorded",
    fileHash: partial.fileHash ?? "",
    chainOfCustody: partial.chainOfCustody ?? "",
    relatedPeople: partial.relatedPeople ?? (partial.people ? [partial.people] : []),
    relatedEvents: partial.relatedEvents ?? [],
    relatedAllegations: partial.relatedAllegations ?? [],
    requested: partial.requested ?? false,
    disclosed: partial.disclosed ?? false,
    appearsMissing: partial.appearsMissing ?? partial.status === "SOURCE_UNAVAILABLE",
    reliabilityConcerns: partial.reliabilityConcerns ?? "",
    authenticationQuestions: partial.authenticationQuestions ?? "",
    potentialDiscrepancy: partial.potentialDiscrepancy ?? "",
    userNotes: partial.userNotes ?? "",
    timePrecision: partial.timePrecision ?? "UNSPECIFIED",
  };
}

function discoveryDefaults(partial: Partial<DiscoveryTask> & { state?: string }): DiscoveryTask {
  const oldState = partial.state as string | undefined;
  const state: DiscoveryState = oldState === "TODO" ? "EXPECTED" : oldState === "NEEDS_REVIEW" ? "REVIEWED" : oldState === "REQUESTED" || oldState === "RECEIVED" || oldState === "POSSIBLY_MISSING" || oldState === "EXPECTED" || oldState === "REVIEWED" ? oldState : "EXPECTED";
  return {
    id: partial.id ?? `discovery-${Date.now()}`,
    title: partial.title ?? "Untitled discovery item",
    category: partial.category ?? "Other expected material",
    question: partial.question ?? "What original record is needed and what question could it resolve?",
    custodian: partial.custodian ?? "Custodian not recorded",
    handlingNote: partial.handlingNote ?? "Preserve the original record, metadata, and full context when available.",
    priority: partial.priority ?? "Medium",
    state,
    linkedRecordId: partial.linkedRecordId,
    requestDate: partial.requestDate ?? "",
    receivedDate: partial.receivedDate ?? "",
    reviewDate: partial.reviewDate ?? "",
    requestReference: partial.requestReference ?? "",
    followUp: partial.followUp ?? "",
  };
}

const initialState: CaseState = {
  version: 2,
  scopeAcknowledged: false,
  caseProfile: {
    label: "Fictional demo workspace",
    court: "Add court when verified",
    caseNumber: "Not entered",
    jurisdiction: "Jurisdiction not recorded",
    supervisionConditions: "No condition source added",
  },
  records: [
    evidenceDefaults({
      id: "demo-source-1", kind: "SOURCE", itemName: "Fictional docket index", statement: "A fictional sample docket entry is available for comparison.", source: "Fictional demo docket index", location: "Entry 04", date: "2026-08-10", incidentDate: "2026-08-10", people: "Not verified", confidence: "Needs review", passage: "Demo material only — replace with a source you can identify and retain.", status: "VERIFY", nextAction: "Compare against the official docket header before relying on any date or caption.", custodian: "Court clerk or authorized docket source", requested: true, timePrecision: "EXACT", authenticationQuestions: "Is this the complete docket header for the correct matter?",
    }),
    evidenceDefaults({
      id: "demo-claim-1", kind: "CLAIM", itemName: "Reported hearing date", statement: "A hearing date is reported in a user-created note.", source: "User-reported demo note", location: "Notebook page 1", date: "2026-08-12", incidentDate: "2026-08-12", people: "Not verified", confidence: "Unverified", passage: "Reported date: August 12. No primary record has been attached.", status: "USER_REPORTED", nextAction: "Obtain a file-stamped notice, docket entry, or official calendar record.", reliabilityConcerns: "The date appears only in a user-created note.", potentialDiscrepancy: "Potential date discrepancy: compare this reported date with the official calendar or notice.", timePrecision: "CONFLICTING",
    }),
    evidenceDefaults({
      id: "demo-gap-1", kind: "MISSING_EVIDENCE", itemName: "Source record for hearing date", statement: "The source record for the reported hearing date has not been added.", source: "Pro Se Compass fictional demo", location: "Verification queue", date: "", people: "Not applicable", confidence: "Unverified", passage: "Absence of a record is an acquisition question, not a conclusion about what occurred.", status: "SOURCE_UNAVAILABLE", nextAction: "Record which office controls the item and how you will request or review it.", appearsMissing: true, timePrecision: "UNSPECIFIED",
    }),
  ],
  discovery: [
    discoveryDefaults({ id: "demo-task-1", title: "Verify court and case identifier", category: "Court docket / case header", question: "What exact case number, caption, and current posture appear on the official docket header?", custodian: "Court clerk or authorized public docket source", handlingNote: "Preserve the full docket header and access date with the record.", priority: "Critical", state: "EXPECTED", linkedRecordId: "demo-source-1" }),
    discoveryDefaults({ id: "demo-task-2", title: "Locate the hearing notice", category: "Court notice / calendar", question: "Which primary record verifies the reported hearing date and time?", custodian: "Court clerk or authorized records source", handlingNote: "Keep the original file or complete official export, not only a handwritten summary.", priority: "High", state: "EXPECTED", linkedRecordId: "demo-claim-1" }),
  ],
  research: [],
  peopleProfiles: [],
  recordsRequests: [],
  filingDrafts: [],
  localOnly: true,
  biometricGateEnabled: false,
};

let state = initialState;
let hasHydrated = false;
const listeners = new Set<() => void>();

function emit() { listeners.forEach((listener) => listener()); }
function save(next: CaseState) { void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined); }
function update(updater: (previous: CaseState) => CaseState) { state = updater(state); save(state); emit(); }

function normalizeState(input: Partial<CaseState>): CaseState {
  return {
    version: 2,
    scopeAcknowledged: Boolean(input.scopeAcknowledged),
    caseProfile: { ...initialState.caseProfile, ...(input.caseProfile ?? {}) },
    records: Array.isArray(input.records) ? input.records.map((record) => evidenceDefaults(record)) : initialState.records,
    discovery: Array.isArray(input.discovery) ? input.discovery.map((task) => discoveryDefaults(task)) : initialState.discovery,
    research: Array.isArray(input.research) ? input.research : [],
    peopleProfiles: Array.isArray(input.peopleProfiles) ? input.peopleProfiles : [],
    recordsRequests: Array.isArray(input.recordsRequests) ? input.recordsRequests : [],
    filingDrafts: Array.isArray(input.filingDrafts) ? input.filingDrafts : [],
    localOnly: input.localOnly ?? true,
    biometricGateEnabled: input.biometricGateEnabled ?? false,
  };
}

async function hydrate() {
  if (hasHydrated) return;
  hasHydrated = true;
  try {
    const saved = (await AsyncStorage.getItem(STORAGE_KEY)) ?? (await AsyncStorage.getItem(OLD_STORAGE_KEY));
    if (saved) { state = normalizeState(JSON.parse(saved) as Partial<CaseState>); save(state); emit(); }
  } catch {
    // A local workspace with clearly fictional demo data remains available when storage is unavailable.
  }
}

function subscribe(listener: () => void) { listeners.add(listener); return () => listeners.delete(listener); }
function getSnapshot() { return state; }

export function getWorkspaceExport() { return JSON.stringify(state, null, 2); }

export function useCaseData() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  useEffect(() => { void hydrate(); }, []);
  return {
    ...snapshot,
    acknowledgeScope: () => update((previous) => ({ ...previous, scopeAcknowledged: true })),
    addRecord: (record: Partial<EvidenceRecord> & Pick<EvidenceRecord, "kind" | "statement" | "source" | "status">) => { const newRecord = evidenceDefaults({ ...record, id: `record-${Date.now()}` }); update((previous) => ({ ...previous, records: [newRecord, ...previous.records] })); return newRecord; },
    updateRecord: (recordId: string, changes: Partial<EvidenceRecord>) => update((previous) => ({ ...previous, records: previous.records.map((record) => record.id === recordId ? evidenceDefaults({ ...record, ...changes }) : record) })),
    updateRecordStatus: (recordId: string, status: EvidenceStatus) => update((previous) => ({ ...previous, records: previous.records.map((record) => record.id === recordId ? { ...record, status } : record) })),
    addDiscovery: (task: Omit<DiscoveryTask, "id">) => { const newTask = discoveryDefaults({ ...task, id: `discovery-${Date.now()}` }); update((previous) => ({ ...previous, discovery: [newTask, ...previous.discovery] })); return newTask; },
    updateDiscoveryState: (taskId: string, taskState: DiscoveryState) => update((previous) => ({ ...previous, discovery: previous.discovery.map((task) => task.id === taskId ? { ...task, state: taskState, requestDate: taskState === "REQUESTED" && !task.requestDate ? today : task.requestDate, receivedDate: taskState === "RECEIVED" && !task.receivedDate ? today : task.receivedDate, reviewDate: taskState === "REVIEWED" && !task.reviewDate ? today : task.reviewDate } : task) })),
    saveCaseProfile: (caseProfile: CaseProfile) => update((previous) => ({ ...previous, caseProfile })),
    addResearch: (item: Omit<ResearchItem, "id">) => { const next = { ...item, id: `research-${Date.now()}` }; update((previous) => ({ ...previous, research: [next, ...previous.research] })); return next; },
    addPerson: (person: Omit<PersonProfile, "id">) => { const next = { ...person, id: `person-${Date.now()}` }; update((previous) => ({ ...previous, peopleProfiles: [next, ...previous.peopleProfiles] })); return next; },
    addRecordsRequest: (request: Omit<RecordsRequest, "id">) => { const next = { ...request, id: `request-${Date.now()}` }; update((previous) => ({ ...previous, recordsRequests: [next, ...previous.recordsRequests] })); return next; },
    addFilingDraft: (draft: Omit<FilingDraft, "id">) => { const next = { ...draft, id: `filing-${Date.now()}` }; update((previous) => ({ ...previous, filingDrafts: [next, ...previous.filingDrafts] })); return next; },
    setBiometricGateEnabled: (enabled: boolean) => update((previous) => ({ ...previous, biometricGateEnabled: enabled })),
    clearCaseData: () => update((previous) => ({ ...initialState, scopeAcknowledged: previous.scopeAcknowledged, localOnly: previous.localOnly, biometricGateEnabled: previous.biometricGateEnabled })),
  };
}

export const statusLabel = (status: EvidenceStatus) => status.replaceAll("_", " ");
export const kindLabel = (kind: RecordKind) => kind.replaceAll("_", " ");
export const discoveryStateLabel = (taskState: DiscoveryState) => taskState.replaceAll("_", " ");
export const nextDiscoveryState = (taskState: DiscoveryState): DiscoveryState => {
  const transitions: Record<DiscoveryState, DiscoveryState> = { EXPECTED: "REQUESTED", REQUESTED: "RECEIVED", RECEIVED: "REVIEWED", REVIEWED: "POSSIBLY_MISSING", POSSIBLY_MISSING: "EXPECTED" };
  return transitions[taskState];
};
export const timePrecisionLabel = (precision: TimePrecision) => precision.replaceAll("_", " ");
export const discoveryCategories = ["Body camera", "Dash camera", "Dispatch audio", "CAD log", "911 call", "Radio traffic", "Surveillance video", "Jail call", "Booking video", "Photographs", "Forensic report", "Lab report", "Medical record", "Property inventory", "Search warrant", "Return inventory", "Officer notes", "Supplemental report", "Witness statement"];
