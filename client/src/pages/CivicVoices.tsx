/**
 * Design direction: Citizen’s Record’s source-first visual system—warm parchment,
 * deep institutional emerald, Libre Baskerville editorial headings, and restrained
 * record-led interactions. The route is intentionally public and uses no tRPC data.
 */
import { Button } from "@/components/ui/button";
import { ArrowUpRight, BookOpenText, ChevronDown, Headphones, Landmark, Play, Scale, Search, ShieldCheck, Volume2 } from "lucide-react";
import { useMemo, useState } from "react";

type SourceKey = "declaration" | "billOfRights" | "constitution";

type Recording = {
  number: string;
  title: string;
  anchor: string;
  source: SourceKey;
  audio: string;
  excerpt: string;
  script: string[];
};

const sources: Record<SourceKey, { label: string; url: string }> = {
  declaration: {
    label: "Declaration of Independence: A Transcription",
    url: "https://www.archives.gov/founding-docs/declaration-transcript",
  },
  billOfRights: {
    label: "The Bill of Rights: A Transcription",
    url: "https://www.archives.gov/founding-docs/bill-of-rights-transcript",
  },
  constitution: {
    label: "The Constitution of the United States: A Transcription",
    url: "https://www.archives.gov/founding-docs/constitution-transcript",
  },
};

const recordings: Recording[] = [
  {
    number: "01",
    title: "The Source of Power",
    anchor: "Declaration of Independence · Preamble",
    source: "declaration",
    audio: "/manus-storage/01_the_source_of_power_ecd4ce92.wav",
    excerpt: "Government is not a force of nature. It is a structure built by human hands, given authority by human consent.",
    script: [
      "Government is not a force of nature. It is not a throne above the people. It is a structure built by human hands, given authority by human consent, and held together only when citizens remember where that authority began.",
      "The Declaration spoke of governments deriving their just powers from the consent of the governed. That is not a decorative sentence. It is the line that separates public service from private rule.",
      "The people are not here to be managed into silence. Public power is here to answer, in law, to the public.",
      "Forget that, and the balance turns upside down.",
    ],
  },
  {
    number: "02",
    title: "The Right to Speak",
    anchor: "First Amendment",
    source: "billOfRights",
    audio: "/manus-storage/02_the_right_to_speak_c8276556.wav",
    excerpt: "Silence can be comfortable for power. Questions are not.",
    script: [
      "A free person does not need permission to hold an opinion. The First Amendment protects freedom of speech, freedom of the press, and the right to petition government for a redress of grievances.",
      "That does not make every claim true. It makes room for the truth to be tested in public.",
      "Silence can be comfortable for power. Questions are not.",
      "When ordinary people speak carefully, publish what they can verify, and refuse to let fear do their thinking, they are not breaking the system.",
      "They are using one of the safeguards that keeps it free.",
    ],
  },
  {
    number: "03",
    title: "The Right to Gather",
    anchor: "First Amendment",
    source: "billOfRights",
    audio: "/manus-storage/03_the_right_to_gather_0bb41abd.wav",
    excerpt: "Peaceful assembly is not weakness. It is discipline.",
    script: [
      "A citizen standing alone can be ignored. Citizens who gather peaceably, listen, speak, and petition are harder to dismiss—not because they threaten anyone, but because they remind the country who public institutions are meant to serve.",
      "The First Amendment protects the right of the people peaceably to assemble and to petition government for redress of grievances.",
      "Peaceful assembly is not weakness. It is discipline.",
      "It is the decision to show up without hatred, to bring facts instead of fury, and to make public power look directly at the people living under its decisions.",
    ],
  },
  {
    number: "04",
    title: "Papers and Doors",
    anchor: "Fourth Amendment",
    source: "billOfRights",
    audio: "/manus-storage/04_papers_and_doors_63b823b1.wav",
    excerpt: "Privacy is not a luxury. A free society draws lines around the individual.",
    script: [
      "The Constitution does not treat your home, your papers, and your private effects as casual territory for power to cross.",
      "The Fourth Amendment says people have a right to be secure in their persons, houses, papers, and effects against unreasonable searches and seizures. It also requires warrants to rest on probable cause and to describe what is to be searched or seized.",
      "That standard exists because privacy is not a luxury.",
      "A free society draws lines around the individual—and expects authority to explain itself before it crosses them.",
    ],
  },
  {
    number: "05",
    title: "Due Process",
    anchor: "Fifth Amendment",
    source: "billOfRights",
    audio: "/manus-storage/05_due_process_9712c958.wav",
    excerpt: "Law must have a path. A reason. A process. A limit.",
    script: [
      "Power is most dangerous when it decides it no longer has to explain itself.",
      "The Fifth Amendment says no person may be deprived of life, liberty, or property without due process of law.",
      "Due process is not a technicality. It is the refusal to let accusation become judgment, or convenience become authority.",
      "It means law must have a path. A reason. A process. A limit.",
      "When those limits matter even for the unpopular, they protect everyone else when the wind changes.",
    ],
  },
  {
    number: "06",
    title: "The Public Trial",
    anchor: "Sixth Amendment",
    source: "billOfRights",
    audio: "/manus-storage/06_the_public_trial_1a5f1f2c.wav",
    excerpt: "A system that must prove its case in public must respect the difference between suspicion and truth.",
    script: [
      "An accusation is not a verdict. That is why the Constitution does not leave criminal judgment to rumor, rage, or the word of a single authority.",
      "The Sixth Amendment secures rights to a speedy and public trial, an impartial jury, notice of the accusation, confrontation of witnesses, and assistance of counsel in criminal prosecutions.",
      "These guarantees do not make justice softer. They make it harder to corrupt.",
      "A system that must prove its case in public is a system forced to respect the difference between suspicion and truth.",
    ],
  },
  {
    number: "07",
    title: "Rights Not Surrendered",
    anchor: "Ninth Amendment",
    source: "billOfRights",
    audio: "/manus-storage/07_rights_not_surrendered_0b75dd62.wav",
    excerpt: "The people retain rights beyond the edges of the list.",
    script: [
      "A written list of rights is powerful. But a free people are more than the rights someone managed to write down.",
      "The Ninth Amendment says that listing certain rights in the Constitution must not be read to deny or disparage other rights retained by the people.",
      "That is a warning against a narrow idea of liberty—the idea that anything not named is no longer yours.",
      "Freedom is not a gift that grows only when power approves it.",
      "The Constitution recognizes that the people retain rights beyond the edges of the list.",
    ],
  },
  {
    number: "08",
    title: "Powers Not Handed Over",
    anchor: "Tenth Amendment",
    source: "billOfRights",
    audio: "/manus-storage/08_powers_not_handed_over_f615efd8.wav",
    excerpt: "Every power has a source. And every power needs a boundary.",
    script: [
      "Every power has a source. And every power needs a boundary.",
      "The Tenth Amendment says that powers not delegated to the United States by the Constitution, and not prohibited to the states, are reserved to the states respectively, or to the people.",
      "That is not a slogan. It is a structural warning: authority is delegated; it is not unlimited by default.",
      "When government claims a new power, the hard question remains: where was it given?",
      "Asking that question is not disloyalty. It is constitutional literacy.",
    ],
  },
  {
    number: "09",
    title: "The Peaceful Repair",
    anchor: "Article V",
    source: "constitution",
    audio: "/manus-storage/09_the_peaceful_repair_164f68f2.wav",
    excerpt: "Fundamental change deserves deliberation, consent, and a lawful path.",
    script: [
      "A constitutional system is not frozen in time. It contains a lawful way to change itself.",
      "Article Five sets out an amendment process: amendments may be proposed through Congress or through a convention called on application of state legislatures, and they become part of the Constitution only through the required ratification process.",
      "That process is difficult by design.",
      "Not because people are powerless—but because fundamental change deserves deliberation, consent, and a path that does not require a nation to break itself to repair itself.",
    ],
  },
  {
    number: "10",
    title: "We the People",
    anchor: "Preamble · Article I",
    source: "constitution",
    audio: "/manus-storage/10_we_the_people_02c7d9f0.wav",
    excerpt: "A republic survives when its people remember they are not an audience. They are the foundation.",
    script: [
      "The Constitution begins with three words that place the burden where it belongs: We the People.",
      "Not we the officeholders. Not we the agencies. Not we the loudest faction.",
      "The people ordained and established the Constitution, and the Constitution places legislative power in representatives chosen by the people.",
      "That does not mean every decision will go our way. It means the system has a source, and that source is not supposed to disappear after election day.",
      "A republic survives when its people remember they are not an audience. They are the foundation.",
    ],
  },
];

function TruthTag({ children, tone }: { children: string; tone: "law" | "inference" | "unknown" }) {
  const classes = {
    law: "border-emerald-700/25 bg-emerald-950 text-emerald-50",
    inference: "border-amber-700/25 bg-amber-50 text-amber-900",
    unknown: "border-stone-400/30 bg-stone-100 text-stone-700",
  };

  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[10px] font-medium tracking-[.12em] ${classes[tone]}`}>{children}</span>;
}

export default function CivicVoices() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>("01");

  const visibleRecordings = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return recordings;
    return recordings.filter(record => `${record.number} ${record.title} ${record.anchor} ${record.excerpt} ${record.script.join(" ")}`.toLowerCase().includes(term));
  }, [query]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f6f1] text-stone-900">
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-[0.38]" style={{ backgroundImage: "radial-gradient(circle at 15% 18%, rgba(33,92,77,.13), transparent 25%), radial-gradient(circle at 88% 8%, rgba(194,145,69,.14), transparent 23%)" }} />

      <header className="border-b border-stone-200/80 bg-[#f7f6f1]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-4 sm:px-8">
          <a href="/" className="group flex items-center gap-3" aria-label="Open The Citizens Record workspace">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-900 text-emerald-50 shadow-[0_8px_20px_rgba(22,68,58,.18)]"><ShieldCheck className="h-5 w-5" /></span>
            <span className="min-w-0"><span className="block font-serif text-base leading-none tracking-tight">The Citizens Record</span><span className="mt-1 block text-[10px] font-bold uppercase tracking-[.16em] text-emerald-800/70">Evidence before opinion</span></span>
          </a>
          <a href="/" className="hidden text-sm font-semibold text-emerald-900 hover:text-emerald-700 sm:inline-flex sm:items-center sm:gap-2">Private workspace <ArrowUpRight className="h-4 w-4" /></a>
        </div>
      </header>

      <section className="border-b border-stone-200/80">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 pb-14 pt-14 sm:px-8 lg:grid-cols-[1.2fr_.8fr] lg:items-end lg:pb-20 lg:pt-24">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-emerald-800"><Volume2 className="h-4 w-4" /> Public source guide</div>
            <h1 className="mt-5 max-w-3xl font-serif text-5xl leading-[.98] tracking-[-.04em] text-stone-950 sm:text-6xl lg:text-7xl">Constitutional civic voices.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600">Ten original narrations. Three founding sources. One standard: distinguish constitutional text from interpretation, and leave unknowns visible.</p>
            <div className="mt-8 flex flex-wrap gap-2"><TruthTag tone="law">LAW · PRIMARY TEXT</TruthTag><TruthTag tone="inference">INFERENCE · ORIGINAL NARRATION</TruthTag><TruthTag tone="unknown">UNKNOWN · FACTS STILL MATTER</TruthTag></div>
          </div>
          <aside className="relative overflow-hidden rounded-[1.5rem] border border-emerald-950/10 bg-emerald-950 p-7 text-emerald-50 shadow-[0_26px_70px_rgba(22,68,58,.20)]">
            <Landmark className="absolute -right-5 -top-6 h-36 w-36 text-emerald-50/5" strokeWidth={1} />
            <p className="relative text-xs font-bold uppercase tracking-[.17em] text-emerald-100/65">Listening standard</p>
            <p className="relative mt-4 font-serif text-2xl leading-tight">Start with the original document. Then ask what it does—and does not—establish.</p>
            <a href="#library" className="relative mt-7 inline-flex items-center gap-2 text-sm font-bold text-amber-200 hover:text-amber-100">Browse the recordings <ChevronDown className="h-4 w-4" /></a>
          </aside>
        </div>
      </section>

      <section id="library" className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-20">
        <div className="flex flex-col gap-5 border-b border-stone-200 pb-7 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-800">Listening library</p><h2 className="mt-3 font-serif text-4xl tracking-[-.035em]">Hear the principle. Check the record.</h2></div>
          <label className="group flex h-11 w-full items-center gap-3 rounded-xl border border-stone-300 bg-white px-4 shadow-sm transition focus-within:border-emerald-700 focus-within:ring-2 focus-within:ring-emerald-700/15 lg:w-80"><Search className="h-4 w-4 text-stone-400 group-focus-within:text-emerald-800" /><input value={query} onChange={event => setQuery(event.target.value)} className="h-full w-full bg-transparent text-sm outline-none placeholder:text-stone-400" placeholder="Search a principle or amendment" aria-label="Search civic narrations" /></label>
        </div>

        <div className="mt-7 divide-y divide-stone-200 border-y border-stone-200">
          {visibleRecordings.map(record => {
            const isOpen = open === record.number;
            const source = sources[record.source];
            return <article key={record.number} className="py-5 sm:py-6">
              <button onClick={() => setOpen(isOpen ? null : record.number)} className="grid w-full grid-cols-[auto_1fr_auto] items-start gap-4 text-left sm:gap-6" aria-expanded={isOpen}>
                <span className="mt-1 font-mono text-xs font-medium tracking-[.12em] text-emerald-800">{record.number}</span>
                <span><span className="block font-serif text-2xl leading-tight tracking-[-.02em] text-stone-950 sm:text-3xl">{record.title}</span><span className="mt-1.5 block text-sm text-stone-500">{record.anchor}</span></span>
                <span className={`mt-1 grid h-8 w-8 place-items-center rounded-full border transition ${isOpen ? "rotate-180 border-emerald-800 bg-emerald-800 text-white" : "border-stone-300 bg-white text-stone-700"}`}><ChevronDown className="h-4 w-4" /></span>
              </button>

              {isOpen && <div className="ml-8 mt-5 grid gap-6 sm:ml-10 lg:ml-[4.5rem] lg:grid-cols-[minmax(0,1fr)_minmax(18rem,.65fr)]">
                <div>
                  <p className="max-w-3xl font-serif text-xl leading-8 text-stone-700">“{record.excerpt}”</p>
                  <div className="mt-5 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-[0_8px_24px_rgba(75,66,49,.07)]">
                    <div className="flex items-center gap-3 border-b border-stone-100 px-4 py-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-emerald-800"><Play className="ml-0.5 h-3.5 w-3.5 fill-current" /></span><span className="text-sm font-semibold">Original narration</span></div>
                    <audio controls preload="metadata" className="block w-full px-3 py-3" src={record.audio}>Your browser does not support embedded audio playback.</audio>
                  </div>
                </div>
                <div className="rounded-xl border border-stone-200 bg-stone-50/65 p-5"><div className="flex flex-wrap gap-2"><TruthTag tone="law">LAW</TruthTag><TruthTag tone="inference">INFERENCE</TruthTag></div><p className="mt-4 text-xs font-bold uppercase tracking-[.15em] text-stone-500">Primary authority</p><a className="mt-2 inline-flex items-start gap-2 text-sm font-semibold leading-6 text-emerald-800 underline decoration-emerald-800/25 underline-offset-4 hover:text-emerald-950" href={source.url} target="_blank" rel="noreferrer"><BookOpenText className="mt-1 h-4 w-4 shrink-0" />{source.label}<ArrowUpRight className="mt-1 h-3.5 w-3.5 shrink-0" /></a><p className="mt-5 text-xs leading-5 text-stone-500">The audio is an original interpretive narration. The linked primary source is the authority for constitutional language.</p></div>
                <div className="lg:col-span-2"><p className="text-xs font-bold uppercase tracking-[.15em] text-stone-500">Full narration script</p><div className="mt-3 space-y-3 border-l-2 border-emerald-800/20 pl-5 text-sm leading-7 text-stone-600">{record.script.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div></div>
              </div>}
            </article>;
          })}
          {!visibleRecordings.length && <div className="py-16 text-center"><p className="font-serif text-2xl">No civic narration matched that search.</p><Button variant="outline" className="mt-4" onClick={() => setQuery("")}>Clear search</Button></div>}
        </div>
      </section>

      <section className="border-y border-stone-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[.78fr_1.22fr] lg:py-20">
          <div><p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-800">Truth Standard</p><h2 className="mt-3 font-serif text-4xl leading-tight tracking-[-.035em]">A narration is not a record.</h2></div>
          <div className="grid gap-4 sm:grid-cols-3"><div className="rounded-xl border border-stone-200 p-5"><TruthTag tone="law">LAW</TruthTag><p className="mt-4 text-sm leading-6 text-stone-600">Constitutional text supported by a linked primary source.</p></div><div className="rounded-xl border border-stone-200 p-5"><TruthTag tone="inference">INFERENCE</TruthTag><p className="mt-4 text-sm leading-6 text-stone-600">A reasoned interpretation. It should never be presented as direct source language.</p></div><div className="rounded-xl border border-stone-200 p-5"><TruthTag tone="unknown">UNKNOWN</TruthTag><p className="mt-4 text-sm leading-6 text-stone-600">A recording cannot resolve an individual legal question, prove an allegation, or replace counsel.</p></div></div>
        </div>
      </section>

      <footer className="bg-[#123c35] text-emerald-50">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 sm:px-8 md:flex-row md:items-end md:justify-between"><div><p className="font-serif text-2xl">The Citizens Record</p><p className="mt-2 max-w-xl text-sm leading-6 text-emerald-100/70">This public source guide is educational. It is not legal advice, and constitutional application depends on facts, statutes, and court interpretation.</p></div><a href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-amber-200 hover:text-amber-100">Open private workspace <ArrowUpRight className="h-4 w-4" /></a></div>
      </footer>
    </main>
  );
}
