import { privacyNotice, moderationRules, PRIVACY_NOTICE_VERSION } from "@shared/workspacePolicies";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, CheckCircle2, FilePlus2, History, Loader2, LockKeyhole, MessageSquareWarning, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

type PrivacySafetyPanelProps = {
  caseId: number | null;
  onCreateSample: () => void;
  samplePending: boolean;
};

export function PrivacySafetyPanel({ caseId, onCreateSample, samplePending }: PrivacySafetyPanelProps) {
  const utils = trpc.useUtils();
  const privacy = trpc.privacy.status.useQuery();
  const requests = trpc.privacy.listRequests.useQuery();
  const revisions = trpc.audit.list.useQuery({ caseId: caseId ?? 0 }, { enabled: Boolean(caseId) });
  const items = trpc.evidenceItems.list.useQuery({ caseId: caseId ?? 0 }, { enabled: Boolean(caseId) });
  const sources = trpc.sources.list.useQuery({ caseId: caseId ?? 0 }, { enabled: Boolean(caseId) });
  const [showReferenceForm, setShowReferenceForm] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);

  const acknowledge = trpc.privacy.acknowledge.useMutation({
    onSuccess: async () => {
      await utils.privacy.status.invalidate();
      toast.success("Private-workspace notice acknowledged.");
    },
    onError: error => toast.error(error.message),
  });
  const createRequest = trpc.privacy.request.useMutation({
    onSuccess: async () => {
      await utils.privacy.listRequests.invalidate();
      setShowRequestForm(false);
      toast.success("Your request was saved for review.");
    },
    onError: error => toast.error(error.message),
  });
  const createReference = trpc.evidenceItems.createReference.useMutation({
    onSuccess: async () => {
      await utils.evidenceItems.list.invalidate();
      await utils.audit.list.invalidate();
      setShowReferenceForm(false);
      toast.success("Reference-only evidence metadata saved. No file was uploaded.");
    },
    onError: error => toast.error(error.message),
  });

  const acknowledged = privacy.data?.privacyNoticeVersion === PRIVACY_NOTICE_VERSION;

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 border-b border-stone-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-700">Private workspace controls</p>
        <h1 className="mt-2 font-serif text-3xl text-stone-900">Safety, privacy, and record integrity</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">Owner-only access is the current operating boundary. This panel records the notice acknowledgement, safety requests, reference-only evidence metadata, and recent workspace changes without publishing private case material.</p>
      </div>
      <Button variant="outline" onClick={onCreateSample} disabled={samplePending}>{samplePending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}<ShieldCheck className="mr-2 h-4 w-4" />Load safe sample</Button>
    </div>

    <Card className={acknowledged ? "border-emerald-200 bg-emerald-50/40" : "border-amber-300 bg-amber-50"}>
      <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-xl"><LockKeyhole className="h-5 w-5" />{privacyNotice.title}</CardTitle><CardDescription>{privacyNotice.summary}</CardDescription></CardHeader>
      <CardContent className="space-y-3 text-sm leading-6 text-stone-700"><p>{privacyNotice.handling}</p><p>{privacyNotice.sharing}</p><p>{privacyNotice.correction}</p>{acknowledged ? <div className="flex items-center gap-2 font-medium text-emerald-800"><CheckCircle2 className="h-4 w-4" />Acknowledged for this account.</div> : <Button onClick={() => acknowledge.mutate({ version: PRIVACY_NOTICE_VERSION })} disabled={acknowledge.isPending}>{acknowledge.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Acknowledge private-workspace notice</Button>}</CardContent>
    </Card>

    <div className="grid gap-6 xl:grid-cols-2">
      <Card className="border-stone-200"><CardHeader><CardTitle className="font-serif text-xl">Moderation and intake rules</CardTitle><CardDescription>These rules apply before any record or reference is saved.</CardDescription></CardHeader><CardContent><ul className="space-y-3 text-sm leading-6 text-stone-700">{moderationRules.map(rule => <li key={rule} className="flex gap-2"><AlertTriangle className="mt-1 h-4 w-4 shrink-0 text-amber-700" /><span>{rule}</span></li>)}</ul></CardContent></Card>
      <Card className="border-stone-200"><CardHeader><CardTitle className="font-serif text-xl">Correction, access, and takedown requests</CardTitle><CardDescription>Requests remain private and are not published automatically.</CardDescription></CardHeader><CardContent className="space-y-4"><Button variant="outline" onClick={() => setShowRequestForm(current => !current)}><MessageSquareWarning className="mr-2 h-4 w-4" />Submit a request</Button>{showRequestForm && <PrivacyRequestForm caseId={caseId} pending={createRequest.isPending} onSubmit={data => createRequest.mutate(data)} onCancel={() => setShowRequestForm(false)} />}<div className="space-y-2">{requests.data?.length ? requests.data.map(request => <div key={request.id} className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm"><div className="flex items-center justify-between gap-3"><span className="font-medium">{request.requestType}</span><Badge variant="outline">{request.status}</Badge></div><p className="mt-1 text-stone-600">{request.details}</p></div>) : <p className="text-sm text-stone-500">No privacy or correction requests have been submitted.</p>}</div></CardContent></Card>
    </div>

    <Card className="border-stone-200"><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle className="font-serif text-xl">Evidence references</CardTitle><CardDescription>Reference metadata may be stored with a source and provenance note. Broad file upload is intentionally not enabled until retention, size, scanning, and access policy are approved.</CardDescription></div><Button disabled={!caseId} onClick={() => setShowReferenceForm(current => !current)}><FilePlus2 className="mr-2 h-4 w-4" />Add reference</Button></div></CardHeader><CardContent>{showReferenceForm && caseId && <EvidenceReferenceForm caseId={caseId} sources={sources.data ?? []} pending={createReference.isPending} onSubmit={data => createReference.mutate(data)} onCancel={() => setShowReferenceForm(false)} />}{items.data?.length ? <div className="mt-4 divide-y divide-stone-100">{items.data.map(item => <div key={item.id} className="py-3 first:pt-0"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-medium">{item.itemId} · {item.title}</p><div className="flex gap-2"><Badge variant="outline">{item.kind}</Badge><Badge variant="outline">{item.state}</Badge><Badge variant="outline">{item.sensitivity}</Badge></div></div><p className="mt-1 text-sm text-stone-600">{item.provenanceNote}</p>{item.externalReference && <p className="mt-1 break-all text-xs text-stone-500">Reference: {item.externalReference}</p>}</div>)}</div> : <p className="text-sm text-stone-500">Select a case, then add a reference-only evidence item with documented provenance.</p>}</CardContent></Card>

    <Card className="border-stone-200"><CardHeader><CardTitle className="flex items-center gap-2 font-serif text-xl"><History className="h-5 w-5" />Recent private-workspace activity</CardTitle><CardDescription>Actions are recorded with the affected entity and a summary. Removed items are soft-deleted for recovery rather than immediately destroyed.</CardDescription></CardHeader><CardContent>{caseId ? revisions.data?.length ? <div className="divide-y divide-stone-100">{revisions.data.map(event => <div key={event.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0"><div><p className="text-sm font-medium">{event.summary}</p><p className="mt-1 text-xs text-stone-500">{event.entityType} #{event.entityId} · {event.action}</p></div><span className="text-xs text-stone-500">{new Date(event.occurredAt).toLocaleString()}</span></div>)}</div> : <p className="text-sm text-stone-500">No activity has been recorded for this case yet.</p> : <p className="text-sm text-stone-500">Select a case to review its private audit history.</p>}</CardContent></Card>
  </div>;
}

function PrivacyRequestForm({ caseId, pending, onSubmit, onCancel }: { caseId: number | null; pending: boolean; onSubmit: (data: { caseId: number | null; requestType: "CORRECTION" | "TAKEDOWN" | "ACCESS" | "DELETION" | "OTHER"; details: string }) => void; onCancel: () => void }) {
  const [requestType, setRequestType] = useState<"CORRECTION" | "TAKEDOWN" | "ACCESS" | "DELETION" | "OTHER">("CORRECTION");
  const [details, setDetails] = useState("");
  const submit = (event: FormEvent) => { event.preventDefault(); onSubmit({ caseId, requestType, details }); };
  return <form onSubmit={submit} className="space-y-3 rounded-xl border border-stone-200 bg-stone-50 p-4"><select className="h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm" value={requestType} onChange={event => setRequestType(event.target.value as typeof requestType)}><option value="CORRECTION">Correction</option><option value="TAKEDOWN">Takedown</option><option value="ACCESS">Access request</option><option value="DELETION">Deletion request</option><option value="OTHER">Other privacy request</option></select><Textarea required minLength={10} maxLength={5000} value={details} onChange={event => setDetails(event.target.value)} placeholder="Describe the specific concern without adding unnecessary sensitive information." /><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button type="submit" disabled={pending}>{pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save request</Button></div></form>;
}

function EvidenceReferenceForm({ caseId, sources, pending, onSubmit, onCancel }: { caseId: number; sources: Array<{ id: number; sourceId: string; title: string }>; pending: boolean; onSubmit: (data: { caseId: number; sourceRecordId: number | null; itemId: string; title: string; kind: "DOCUMENT" | "IMAGE" | "AUDIO" | "VIDEO" | "COMMUNICATION" | "OTHER"; sensitivity: "STANDARD" | "SENSITIVE" | "RESTRICTED"; externalReference: string | null; provenanceNote: string; sensitiveDataAcknowledged: true; authorizedToShareAcknowledged: true }) => void; onCancel: () => void }) {
  const [form, setForm] = useState({ sourceRecordId: "", itemId: "", title: "", kind: "DOCUMENT" as const, sensitivity: "STANDARD" as const, externalReference: "", provenanceNote: "", sensitiveDataAcknowledged: false, authorizedToShareAcknowledged: false });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.sensitiveDataAcknowledged || !form.authorizedToShareAcknowledged) return;
    onSubmit({ caseId, sourceRecordId: form.sourceRecordId ? Number(form.sourceRecordId) : null, itemId: form.itemId, title: form.title, kind: form.kind, sensitivity: form.sensitivity, externalReference: form.externalReference.trim() || null, provenanceNote: form.provenanceNote, sensitiveDataAcknowledged: true, authorizedToShareAcknowledged: true });
  };
  return <form onSubmit={submit} className="mb-5 grid gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 md:grid-cols-2"><Input required maxLength={80} placeholder="Evidence item ID (EI-001)" value={form.itemId} onChange={event => setForm({ ...form, itemId: event.target.value })} /><Input required maxLength={255} placeholder="Reference title" value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} /><select className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm" value={form.sourceRecordId} onChange={event => setForm({ ...form, sourceRecordId: event.target.value })}><option value="">No source record selected</option>{sources.map(source => <option key={source.id} value={source.id}>{source.sourceId} · {source.title}</option>)}</select><select className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm" value={form.kind} onChange={event => setForm({ ...form, kind: event.target.value as typeof form.kind })}><option value="DOCUMENT">Document</option><option value="IMAGE">Image</option><option value="AUDIO">Audio</option><option value="VIDEO">Video</option><option value="COMMUNICATION">Communication</option><option value="OTHER">Other</option></select><select className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm" value={form.sensitivity} onChange={event => setForm({ ...form, sensitivity: event.target.value as typeof form.sensitivity })}><option value="STANDARD">Standard sensitivity</option><option value="SENSITIVE">Sensitive</option><option value="RESTRICTED">Restricted</option></select><Input type="url" maxLength={2000} placeholder="Optional authorized source URL" value={form.externalReference} onChange={event => setForm({ ...form, externalReference: event.target.value })} /><Textarea required maxLength={5000} className="md:col-span-2" placeholder="Provenance, completeness, and authorization note" value={form.provenanceNote} onChange={event => setForm({ ...form, provenanceNote: event.target.value })} /><label className="flex gap-2 text-sm leading-5 text-stone-700 md:col-span-2"><Checkbox checked={form.sensitiveDataAcknowledged} onCheckedChange={checked => setForm({ ...form, sensitiveDataAcknowledged: Boolean(checked) })} />I will not add unnecessary identifiers, minors’ information, credentials, medical information, financial information, privileged communications, or sealed material.</label><label className="flex gap-2 text-sm leading-5 text-stone-700 md:col-span-2"><Checkbox checked={form.authorizedToShareAcknowledged} onCheckedChange={checked => setForm({ ...form, authorizedToShareAcknowledged: Boolean(checked) })} />I have authority to reference this material in this private workspace.</label><div className="flex justify-end gap-2 md:col-span-2"><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button type="submit" disabled={pending || !form.sensitiveDataAcknowledged || !form.authorizedToShareAcknowledged}>{pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save private reference</Button></div></form>;
}
