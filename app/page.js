"use client";

import { useState, useEffect } from "react";

const CARDS = [
  { id: "intro", type: "intro" },
  { id: "fullName", type: "text", q: "First — what should I call you?", placeholder: "Your name", required: true },
  { id: "email", type: "text", q: "And where should your pathway find you?", placeholder: "you@email.com", inputType: "email", required: true },
  { id: "qualification", type: "choice", q: "How far have you taken your studies so far?", multi: false, options: [
      { v: "High school", label: "High school / 12th" },
      { v: "Diploma", label: "Diploma" },
      { v: "Bachelor's", label: "Bachelor's degree" },
      { v: "Master's", label: "Master's degree" },
      { v: "Doctorate", label: "Doctorate" },
  ]},
  { id: "experienceYears", type: "choice", q: "How much of the working world have you seen?", multi: false, options: [
      { v: "0", label: "Just starting out" },
      { v: "2", label: "1 – 3 years" },
      { v: "5", label: "3 – 7 years" },
      { v: "9", label: "7 – 12 years" },
      { v: "16", label: "More than 12 years" },
  ]},
  { id: "profession", type: "text", q: "What do you spend your days doing now?", placeholder: "e.g. Software developer, teacher, founder…", required: false },
  { id: "careerGoal", type: "choice", q: "When you look ahead — what are you really chasing?", multi: false, options: [
      { v: "skill", label: "Sharpening my skills" },
      { v: "industry", label: "Rising into industry leadership" },
      { v: "research", label: "Moving into research & academia" },
      { v: "recognition", label: "Recognition for my life's work" },
  ]},
  { id: "vision", type: "longtext", q: "Picture yourself five years from now. Where are you?", placeholder: "The more real you make it, the better I can match you…", required: false },
  { id: "domains", type: "choice", q: "Which worlds genuinely light you up?", multi: true, options: [
      { v: "Technology & AI", label: "Technology & AI" },
      { v: "Business", label: "Business & management" },
      { v: "Data", label: "Data & analytics" },
      { v: "Design", label: "Design & creativity" },
      { v: "Healthcare", label: "Healthcare" },
      { v: "Finance", label: "Finance & economics" },
      { v: "Education", label: "Education & impact" },
      { v: "Engineering", label: "Engineering" },
  ]},
  { id: "strength", type: "longtext", q: "What do people always come to you for?", placeholder: "Often more honest than a résumé — what are you the go-to person for?", required: false },
  { id: "time", type: "choice", q: "How much time can you really give each week?", multi: false, options: [
      { v: "1–5 hrs", label: "A few hours" },
      { v: "5–10 hrs", label: "5 – 10 hours" },
      { v: "10–20 hrs", label: "10 – 20 hours" },
      { v: "Full-time", label: "I can go all in" },
  ]},
  { id: "budget", type: "choice", q: "And what feels comfortable to invest?", multi: false, options: [
      { v: "Free", label: "Free / minimal" },
      { v: "Under ₹50k", label: "Under ₹50k" },
      { v: "₹50k–₹2L", label: "₹50k – ₹2L" },
      { v: "₹2L+", label: "₹2L and beyond" },
  ]},
  { id: "success", type: "longtext", q: "Beyond any job title — what does success actually feel like?", placeholder: "This shapes whether I lean toward prestige, freedom, impact, or income…", required: false },
  { id: "analyzing", type: "analyzing" },
];

const PATHWAY_BLURB = {
  "Certification Program": "A focused, fast credential to build real capability.",
  "DBA": "A doctorate for senior practitioners solving real-world problems.",
  "PhD": "The gateway to original research and academic life.",
  "Honorary Doctorate": "Recognition for a distinguished body of work.",
};

export default function Home() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ domains: [] });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const card = CARDS[step];
  const progress = Math.round((step / (CARDS.length - 1)) * 100);

  function set(id, value) { setAnswers((a) => ({ ...a, [id]: value })); }

  function next() {
    setError("");
    if (card.required && (!answers[card.id] || String(answers[card.id]).trim() === "")) {
      setError("Mind filling this one in before we move on?");
      return;
    }
    if (card.id === "email" && answers.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answers.email)) {
      setError("That email looks a little off — mind checking it?");
      return;
    }
    setStep((s) => s + 1);
  }
  function back() { setError(""); if (step > 0) setStep((s) => s - 1); }

  function toggleMulti(id, v) {
    setAnswers((a) => {
      const cur = a[id] || [];
      return { ...a, [id]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] };
    });
  }
  function chooseSingle(id, v) { set(id, v); setTimeout(() => setStep((s) => s + 1), 240); }

  async function runAnalysis() {
    setError("");
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: answers.fullName, email: answers.email,
          qualification: answers.qualification, experienceYears: answers.experienceYears,
          profession: answers.profession, careerGoal: answers.careerGoal,
          vision: answers.vision, domains: answers.domains, strength: answers.strength,
          time: answers.time, budget: answers.budget, success: answers.success,
        }),
      });
      if (!res.ok) throw new Error("Something hiccuped. Try again?");
      const data = await res.json();
      setTimeout(() => setResult(data), 1400);
    } catch (e) { setError(e.message); }
  }

  useEffect(() => {
    if (card?.type === "analyzing" && !result && !error) runAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const firstName = answers.fullName?.split(" ")[0] || "friend";

  return (
    <main className="min-h-screen" style={{ background: "var(--ink)" }}>
      {!result && (
        <div className="fixed inset-x-0 top-0 z-10 h-[3px]" style={{ background: "rgba(244,239,230,0.08)" }}>
          <div className="gold-thread h-full transition-all duration-700" style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-20">
        {!result && (
          <div key={step} className="anim-up">
            {card.type === "intro" && (
              <div className="text-center">
                <p className="mb-6 text-sm tracking-[0.25em] uppercase" style={{ color: "var(--gold)" }}>Academic Pathway Engine</p>
                <h1 className="font-display text-5xl leading-tight sm:text-6xl" style={{ color: "var(--ivory)" }}>
                  Let&apos;s find the path<br />that&apos;s <em style={{ color: "var(--gold-soft)" }}>actually you.</em>
                </h1>
                <p className="mx-auto mt-6 max-w-md text-lg" style={{ color: "var(--ivory-dim)" }}>
                  A handful of honest questions — no right answers. Then I&apos;ll point you to the academic path that fits where you&apos;re truly headed.
                </p>
                <button onClick={next} className="btn-gold mt-10">Begin →</button>
              </div>
            )}

            {(card.type === "text" || card.type === "longtext") && (
              <div>
                <h2 className="font-display text-3xl leading-snug sm:text-4xl" style={{ color: "var(--ivory)" }}>{card.q}</h2>
                {card.type === "text" ? (
                  <input autoFocus type={card.inputType || "text"} value={answers[card.id] || ""}
                    onChange={(e) => set(card.id, e.target.value)} onKeyDown={(e) => e.key === "Enter" && next()}
                    placeholder={card.placeholder} className="line-input mt-8" />
                ) : (
                  <textarea autoFocus rows={3} value={answers[card.id] || ""}
                    onChange={(e) => set(card.id, e.target.value)} placeholder={card.placeholder} className="area-input mt-8" />
                )}
                <div className="mt-10 flex items-center justify-between">
                  <button onClick={back} className="btn-ghost">← Back</button>
                  <button onClick={next} className="btn-gold">Continue →</button>
                </div>
              </div>
            )}

            {card.type === "choice" && (
              <div>
                <h2 className="font-display text-3xl leading-snug sm:text-4xl" style={{ color: "var(--ivory)" }}>{card.q}</h2>
                {card.multi && <p className="mt-2 text-sm" style={{ color: "var(--ivory-dim)" }}>Choose as many as feel true.</p>}
                <div className="mt-8 flex flex-col gap-3">
                  {card.options.map((o) => {
                    const selected = card.multi ? (answers[card.id] || []).includes(o.v) : answers[card.id] === o.v;
                    return (
                      <button key={o.v} onClick={() => card.multi ? toggleMulti(card.id, o.v) : chooseSingle(card.id, o.v)}
                        className={`choice ${selected ? "sel" : ""}`}>{o.label}</button>
                    );
                  })}
                </div>
                <div className="mt-8 flex items-center justify-between">
                  <button onClick={back} className="btn-ghost">← Back</button>
                  {card.multi && <button onClick={next} className="btn-gold">Continue →</button>}
                </div>
              </div>
            )}

            {card.type === "analyzing" && (
              <div className="anim-in text-center">
                <div className="mx-auto mb-8 h-px w-40 overflow-hidden" style={{ background: "rgba(244,239,230,0.15)" }}>
                  <div className="gold-thread h-full animate-pulse" />
                </div>
                <h2 className="font-display text-3xl" style={{ color: "var(--ivory)" }}>Reading your story…</h2>
                <p className="mt-3" style={{ color: "var(--ivory-dim)" }}>Weighing where you are against where you&apos;re headed.</p>
              </div>
            )}

            {error && <p className="mt-5 text-sm" style={{ color: "#E8A0A0" }}>{error}</p>}
          </div>
        )}

        {result && (
          <div className="anim-up">
            <p className="font-display text-3xl italic" style={{ color: "var(--gold-soft)" }}>Dear {firstName},</p>
            <p className="mt-6 text-lg leading-relaxed" style={{ color: "var(--ivory)" }}>{result.rationale}</p>
            <p className="mt-6 text-lg leading-relaxed" style={{ color: "var(--ivory)" }}>
              My recommendation for you is the{" "}
              <span className="font-display" style={{ color: "var(--gold-soft)" }}>{result.pathway}</span> — {(PATHWAY_BLURB[result.pathway] || "").toLowerCase()}
            </p>

            {result.strengths?.length > 0 && (
              <div className="mt-10">
                <p className="mb-4 text-xs tracking-[0.2em] uppercase" style={{ color: "var(--gold)" }}>Strengths I noticed in you</p>
                <div className="flex flex-wrap gap-3">
                  {result.strengths.map((s, i) => (
                    <span key={i} className="rounded-full px-4 py-2 text-sm"
                      style={{ background: "rgba(217,164,65,0.1)", border: "1px solid rgba(217,164,65,0.35)", color: "var(--gold-soft)" }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {result.paths?.length > 0 && (
              <div className="mt-10">
                <p className="mb-4 text-xs tracking-[0.2em] uppercase" style={{ color: "var(--gold)" }}>Paths worth exploring</p>
                <div className="flex flex-col gap-3">
                  {result.paths.map((p, i) => (
                    <div key={i} className="rounded-2xl p-5" style={{ background: "var(--ink-soft)", border: "1px solid var(--line)" }}>
                      <div className="flex items-start gap-4">
                        <span className="font-display text-2xl" style={{ color: "var(--gold)" }}>{p.rank || i + 1}</span>
                        <div>
                          <p className="text-lg" style={{ color: "var(--ivory)" }}>{p.title}</p>
                          <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--ivory-dim)" }}>{p.why}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-12">
              <p className="mb-4 text-xs tracking-[0.2em] uppercase" style={{ color: "var(--ivory-dim)" }}>Why this fits</p>
              <ScoreRow scores={result.scores} />
            </div>

            <p className="mt-12 font-display italic" style={{ color: "var(--ivory-dim)" }}>— The Pathway Engine</p>
          </div>
        )}
      </div>
    </main>
  );
}

function ScoreRow({ scores }) {
  const items = [
    { label: "Experience", value: scores.experience },
    { label: "Qualification", value: scores.qualification },
    { label: "Goal alignment", value: scores.goal },
  ];
  return (
    <div>
      {items.map((it) => (
        <div key={it.label} className="mb-3 flex items-center gap-4">
          <span className="w-32 text-sm" style={{ color: "var(--ivory-dim)" }}>{it.label}</span>
          <div className="h-[6px] flex-1 overflow-hidden rounded-full" style={{ background: "rgba(244,239,230,0.1)" }}>
            <div className="gold-thread h-full rounded-full transition-all duration-1000" style={{ width: `${Math.round((it.value || 0) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}