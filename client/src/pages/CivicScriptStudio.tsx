/**
 * Design direction: Citizen’s Record’s source-first visual system—warm parchment,
 * institutional emerald, editorial serif typography, visible Truth Standard tags,
 * and an intentionally local-only writing flow that never implies legal advice.
 */
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowUpRight, BookOpenText, Check, Copy, Download, FileText, Landmark, Scale, ShieldCheck, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type PrincipleId = "consent" | "speech" | "assembly" | "privacy" | "dueProcess" | "reserved" | "amendment";
type Tone = "calm" | "sober" | "resolute";
type Ending = "question" | "source" | "reflection";

const principles: Record<PrincipleId, { name: string; anchor: string; source: string; sourceUrl: string; lawLine: string; frame: string }> = {
  consent: {
    name: "Consent of the governed",
    anchor: "Declaration of Independence",
    source: "National Archives — Declaration of Independence: A Transcription",
    sourceUrl: "https://www.archives.gov/founding-docs/declaration-transcript",
    lawLine: "The Declaration states that governments derive their just powers from the consent of the governed.",
    frame: "Public authority has a source: the people from whom it is delegated.",
  },
  speech: {
    name: "Speech, press, and petition",
    anchor: "First Amendment",
    source: "National Archives — The Bill of Rights: A Transcription",
    sourceUrl: "https://www.archives.gov/founding-docs/bill-of-rights-transcript",
    lawLine: "The First Amendment protects freedom of speech, freedom of the press, and the right to petition government for redress of grievances.",
    frame: "A constitutional system makes room for questions, disagreement, and documented public expression.",
  },
  assembly: {
    name: "Peaceable assembly",
    anchor: "First Amendment",
    source: "National Archives — The Bill of Rights: A Transcription",
    sourceUrl: "https://www.archives.gov/founding-docs/bill-of-rights-transcript",
    lawLine: "The First Amendment protects the right of the people peaceably to assemble and to petition government for redress of grievances.",
    frame: "Peaceful public participation is a constitutional mechanism, not a substitute for facts or a license for confrontation.",
  },
  privacy: {
    name: "Security of papers and effects",
    anchor: "Fourth Amendment",
    source: "National Archives — The Bill of Rights: A Transcription",
    sourceUrl: "https://www.archives.gov/founding-docs/bill-of-rights-transcript",
    lawLine: "The Fourth Amendment protects people against unreasonable searches and seizures and requires warrants to be based on probable cause and to describe the place to be searched and things to be seized.",
    frame: "Constitutional limits require authority to justify itself before crossing protected boundaries.",
  },
  dueProcess: {
    name: "Due process",
    anchor: "Fifth Amendment",
    source: "National Archives — The Bill of Rights: A Transcription",
    sourceUrl: "https://www.archives.gov/founding-docs/bill-of-rights-transcript",
    lawLine: "The Fifth Amendment provides that no person may be deprived of life, liberty, or property without due process of law.",
    frame: "Lawful process asks power to provide a reason, a path, and a limit.",
  },
  reserved: {
    name: "Delegated and reserved powers",
    anchor: "Tenth Amendment",
    source: "National Archives — The Bill of Rights: A Transcription",
    sourceUrl: "https://www.archives.gov/founding-docs/bill-of-rights-transcript",
    lawLine: "The Tenth Amendment reserves powers not delegated to the United States by the Constitution, nor prohibited to the states, to the states respectively or to the people.",
    frame: "Authority is delegated and bounded; a claim of power should be traceable to its source.",
  },
  amendment: {
    name: "Peaceful constitutional change",
    anchor: "Article V",
    source: "National Archives — The Constitution of the United States: A Transcription",
    sourceUrl: "https://www.archives.gov/founding-docs/constitution-transcript",
    lawLine: "Article V provides a formal process for proposing and ratifying constitutional amendments.",
    frame: "Fundamental change can be sought through deliberation, consent, and a defined constitutional process.",
  },
};

const toneLines: Record<Tone, { label: string; line: string }> = {
  calm: { label: "Calm and clear", line: "This is not a call to outrage. It is an invitation to read carefully, listen closely, and distinguish what is known from what still needs a source." },
  sober: { label: "Sober and grave", line: "Constitutional language matters most when it is treated as a limit on power—not a decoration, and not a weapon against one another." },
  resolute: { label: "Quietly resolute", line: "Civic responsibility can be firm without becoming hostile: keep the question precise, keep the record visible, and keep the response lawful." },
};

const endingLines: Record<Ending, string> = {
  question: "The question is not whether a slogan is satisfying. The question is: what does the record show, and what remains unanswered?",
  source: "Before drawing a conclusion, return to the primary document. The source is where the work begins.",
  reflection: "A free public is not an audience. It is a community capable of asking, checking, and responding without surrendering its discipline.",
};

function TruthTag({ children, tone }: { children: string; tone: "law" | "inference" | "unknown" }) {
  const classes = {
    law: "border-emerald-700/25 bg-emerald-950 text-emerald-50",
    inference: "border-amber-700/25 bg-amber-50 text-amber-900",
    unknown: "border-stone-400/30 bg-stone-100 text-stone-700",
  };
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[10px] font-medium tracking-[.12em] ${classes[tone]}`}>{children}</span>;
}

function saveText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function CivicScriptStudio() {
  const [principleId, setPrincipleId] = useState<PrincipleId>("consent");
  const [question, setQuestion] = useState("");
  const [audience, setAudience] = useState("general public");
  const [tone, setTone] = useState<Tone>("calm");
  const [ending, setEnding] = useState<Ending>("question");
  const [hasGenerated, setHasGenerated] = useState(false);
  const [copied, setCopied] = useState(false);

  const principle = principles[principleId];
  const questionLine = question.trim() ? `A question worth holding in view is this: “${question.trim().replace(/\s+/g, " ")}”` : "A question worth holding in view is this: what can the primary record establish, and what would still need to be checked?";

  const generatedScript = useMemo(() => [
    `## ${principle.name}`,
    "",
    "### LAW — primary authority",
    principle.lawLine,
    "",
    "### INFERENCE — original civic narration",
    `${principle.frame} ${questionLine}`,
    toneLines[tone].line,
    endingLines[ending],
    "",
    "### UNKNOWN — keep the limit visible",
    "This draft does not establish facts about a specific event, person, or institution. Constitutional application depends on facts, statutes, and court interpretation.",
    "",
    `Primary source: ${principle.source}`,
    principle.sourceUrl,
  ].join("\n"), [ending, principle, questionLine, tone]);

  const copyScript = async () => {
    await navigator.clipboard.writeText(generatedScript);
    setCopied(true);
    toast.success("Working draft copied.");
    window.setTimeout(() => setCopied(false), 1600);
  };

  return <main className="min-h-screen overflow-x-hidden bg-[#f7f6f1] text-stone-900">
    <div className="pointer-events-none fixed inset-0 -z-10 opacity-[0.42]" style={{ backgroundImage: "radial-gradient(circle at 12% 5%, rgba(33,92,77,.12), transparent 23%), radial-gradient(circle at 92% 19%, rgba(194,145,69,.12), transparent 24%)" }} />
    <header className="border-b border-stone-200/80 bg-[#f7f6f1]/90 backdrop-blur-xl"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8"><a href="/civic-voices" className="flex items-center gap-2 text-sm font-semibold text-emerald-900 hover:text-emerald-700"><ArrowLeft className="h-4 w-4" />Civic voices</a><a href="/" className="group flex items-center gap-3" aria-label="Open The Citizens Record workspace"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-900 text-emerald-50 shadow-[0_8px_20px_rgba(22,68,58,.18)]"><ShieldCheck className="h-5 w-5" /></span><span className="hidden sm:block"><span className="block font-serif text-base leading-none tracking-tight">The Citizens Record</span><span className="mt-1 block text-[10px] font-bold uppercase tracking-[.16em] text-emerald-800/70">Evidence before opinion</span></span></a></div></header>

    <section className="border-b border-stone-200/80"><div className="mx-auto grid max-w-7xl gap-9 px-5 py-14 sm:px-8 lg:grid-cols-[1.1fr_.9fr] lg:items-end lg:py-20"><div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-emerald-800"><Sparkles className="h-4 w-4" /> Public writing tool</p><h1 className="mt-5 max-w-3xl font-serif text-5xl leading-[.98] tracking-[-.04em] text-stone-950 sm:text-6xl">Build a script.<br />Keep the source visible.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600">Shape a short civic narration from a constitutional principle and a question. This browser-only Studio separates primary authority from original interpretation and what it cannot determine.</p></div><aside className="rounded-[1.5rem] border border-emerald-950/10 bg-emerald-950 p-7 text-emerald-50 shadow-[0_26px_70px_rgba(22,68,58,.18)]"><p className="text-xs font-bold uppercase tracking-[.17em] text-emerald-100/65">No hidden system</p><p className="mt-4 font-serif text-2xl leading-tight">No account. No server call. No legal conclusion.</p><p className="mt-3 text-sm leading-6 text-emerald-100/75">Your inputs stay in this browser until you copy or download your working draft.</p></aside></div></section>

    <section className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[.86fr_1.14fr] lg:py-20">
      <form onSubmit={event => { event.preventDefault(); setHasGenerated(true); }} className="rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-[0_16px_46px_rgba(75,66,49,.08)] sm:p-8">
        <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-100 text-emerald-800"><FileText className="h-4 w-4" /></span><div><p className="font-serif text-2xl">Script inputs</p><p className="mt-1 text-sm text-stone-500">Use a question, not an allegation.</p></div></div>
        <div className="mt-8 space-y-6">
          <label className="block"><span className="text-xs font-bold uppercase tracking-[.14em] text-stone-600">Constitutional principle</span><select value={principleId} onChange={event => setPrincipleId(event.target.value as PrincipleId)} className="mt-2 h-12 w-full rounded-xl border border-stone-300 bg-stone-50 px-3 text-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15">{Object.entries(principles).map(([id, item]) => <option key={id} value={id}>{item.name} · {item.anchor}</option>)}</select></label>
          <label className="block"><span className="text-xs font-bold uppercase tracking-[.14em] text-stone-600">Your civic question <span className="font-normal normal-case tracking-normal text-stone-400">optional</span></span><textarea maxLength={280} value={question} onChange={event => setQuestion(event.target.value)} className="mt-2 min-h-28 w-full resize-y rounded-xl border border-stone-300 bg-stone-50 p-3 text-sm leading-6 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15" placeholder="Example: What should the public look for when a decision affects privacy?" /><span className="mt-1.5 block text-right font-mono text-[11px] text-stone-400">{question.length}/280</span></label>
          <label className="block"><span className="text-xs font-bold uppercase tracking-[.14em] text-stone-600">Audience</span><select value={audience} onChange={event => setAudience(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-stone-300 bg-stone-50 px-3 text-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"><option value="general public">General public</option><option value="community meeting">Community meeting</option><option value="student group">Student group</option><option value="private reflection">Private reflection</option></select></label>
          <fieldset><legend className="text-xs font-bold uppercase tracking-[.14em] text-stone-600">Tone</legend><div className="mt-2 grid gap-2 sm:grid-cols-3">{(Object.entries(toneLines) as [Tone, { label: string; line: string }][]).map(([id, item]) => <button type="button" key={id} onClick={() => setTone(id)} className={`rounded-xl border px-3 py-3 text-left text-sm font-semibold ${tone === id ? "border-emerald-800 bg-emerald-900 text-white" : "border-stone-300 bg-stone-50 text-stone-700 hover:border-emerald-600"}`}>{item.label}</button>)}</div></fieldset>
          <fieldset><legend className="text-xs font-bold uppercase tracking-[.14em] text-stone-600">Ending</legend><div className="mt-2 grid gap-2">{(["question", "source", "reflection"] as Ending[]).map(id => <label key={id} className={`flex items-center gap-3 rounded-xl border p-3 text-sm transition ${ending === id ? "border-emerald-700 bg-emerald-50" : "border-stone-200 bg-stone-50"}`}><input type="radio" name="ending" checked={ending === id} onChange={() => setEnding(id)} className="accent-emerald-800" /><span className="font-medium">{id === "question" ? "Leave a source-checking question" : id === "source" ? "Return readers to the primary record" : "Close with a civic reflection"}</span></label>)}</div></fieldset>
          <Button type="submit" className="h-12 w-full bg-emerald-800 text-white hover:bg-emerald-900"><Sparkles className="mr-2 h-4 w-4" />Generate working draft for {audience}</Button>
        </div>
      </form>

      <div className="relative"><div className="sticky top-6 overflow-hidden rounded-[1.5rem] border border-stone-200 bg-white shadow-[0_16px_46px_rgba(75,66,49,.08)]"><div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 bg-stone-50/75 px-6 py-5 sm:px-8"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-800">Working draft</p><p className="mt-1 font-serif text-2xl">{hasGenerated ? principle.name : "Your source-led script"}</p></div>{hasGenerated && <div className="flex gap-2"><Button type="button" size="sm" variant="outline" onClick={copyScript}>{copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}{copied ? "Copied" : "Copy"}</Button><Button type="button" size="sm" onClick={() => saveText(`citizens-record-${principleId}-working-draft.md`, generatedScript)}><Download className="mr-1.5 h-3.5 w-3.5" />Download</Button></div>}</div>
        <div className="p-6 sm:p-8">{hasGenerated ? <div className="space-y-7"><div className="flex flex-wrap gap-2"><TruthTag tone="law">LAW · LINKED SOURCE</TruthTag><TruthTag tone="inference">INFERENCE · ORIGINAL COPY</TruthTag><TruthTag tone="unknown">UNKNOWN · LIMIT VISIBLE</TruthTag></div><section><p className="text-xs font-bold uppercase tracking-[.15em] text-stone-500">Law</p><p className="mt-3 text-sm leading-7 text-stone-700">{principle.lawLine}</p><a href={principle.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 underline decoration-emerald-800/25 underline-offset-4 hover:text-emerald-950"><BookOpenText className="h-4 w-4" />{principle.source}<ArrowUpRight className="h-3.5 w-3.5" /></a></section><section className="border-l-2 border-amber-500/35 pl-5"><p className="text-xs font-bold uppercase tracking-[.15em] text-amber-800">Inference · narration</p><p className="mt-3 font-serif text-xl leading-8 text-stone-800">{principle.frame}</p><p className="mt-4 text-sm leading-7 text-stone-600">{questionLine}</p><p className="mt-4 text-sm leading-7 text-stone-600">{toneLines[tone].line}</p><p className="mt-4 text-sm leading-7 text-stone-600">{endingLines[ending]}</p></section><section className="rounded-xl border border-stone-200 bg-stone-50 p-5"><div className="flex gap-3"><Scale className="mt-0.5 h-5 w-5 shrink-0 text-stone-500" /><div><p className="font-semibold text-stone-800">What this draft does not establish</p><p className="mt-2 text-sm leading-6 text-stone-600">It does not prove a claim about a specific event, person, or institution. It does not provide legal advice. Constitutional application depends on facts, statutes, and court interpretation.</p></div></div></section></div> : <div className="grid min-h-[510px] place-items-center text-center"><div className="max-w-sm"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-800"><Landmark className="h-7 w-7" /></span><p className="mt-5 font-serif text-2xl">Start with a constitutional principle.</p><p className="mt-3 text-sm leading-6 text-stone-500">Choose a primary authority, frame a question, and generate a clearly labeled working draft. Nothing is sent to a server.</p></div></div>}</div></div></div>
    </section>

    <footer className="border-t border-emerald-50/10 bg-[#123c35] text-emerald-50"><div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 sm:px-8 md:flex-row md:items-end md:justify-between"><div><p className="font-serif text-2xl">The Citizens Record</p><p className="mt-2 max-w-xl text-sm leading-6 text-emerald-100/70">This local writing tool is educational. It is not legal advice, and it cannot determine what happened in a particular case or controversy.</p></div><a href="/civic-voices" className="inline-flex items-center gap-2 text-sm font-semibold text-amber-200 hover:text-amber-100">Listen to civic voices <ArrowUpRight className="h-4 w-4" /></a></div></footer>
  </main>;
}
