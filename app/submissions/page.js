import { supabase } from "../lib/supabase";
import DownloadButton from "./DownloadButton";

export const dynamic = "force-dynamic";

const PATHWAY_COLORS = {
  "Certification Program": "#8A9A7B",
  "DBA": "#D9A441",
  "PhD": "#C9743D",
  "Honorary Doctorate": "#B47BC9",
};

const GOAL_LABEL = {
  skill: "Build new skills",
  industry: "Industry leadership",
  research: "Research / academia",
  recognition: "Lifetime contribution",
};

export default async function SubmissionsPage() {
  const { data: rows } = await supabase
    .from("submissions")
    .select("*")
    .order("created_at", { ascending: false });

  const subs = rows || [];
  const total = subs.length;

  // Aggregations
  const pathwayCounts = {};
  const goalCounts = {};
  const domainCounts = {};
  let expSum = 0;

  subs.forEach((s) => {
    pathwayCounts[s.recommendation] = (pathwayCounts[s.recommendation] || 0) + 1;
    const g = GOAL_LABEL[s.career_goal] || s.career_goal;
    if (g) goalCounts[g] = (goalCounts[g] || 0) + 1;
    expSum += s.experience_years || 0;
    const domains = s.profile?.domains;
    if (Array.isArray(domains)) domains.forEach((d) => { domainCounts[d] = (domainCounts[d] || 0) + 1; });
  });

  const avgExp = total ? Math.round(expSum / total) : 0;
  const topPathway = Object.keys(pathwayCounts).sort((a, b) => pathwayCounts[b] - pathwayCounts[a])[0] || "—";
  const maxPathway = Math.max(1, ...Object.values(pathwayCounts));
  const topGoals = Object.entries(goalCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const topDomains = Object.entries(domainCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

  return (
    <main className="min-h-screen px-6 py-12" style={{ background: "var(--ink)", color: "var(--ivory)" }}>
      <div className="mx-auto max-w-5xl">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs tracking-[0.25em] uppercase" style={{ color: "var(--gold)" }}>Admin</p>
            <h1 className="font-display mt-2 text-4xl" style={{ color: "var(--ivory)" }}>Submissions & insights</h1>
          </div>
          <div className="flex items-center gap-4">
            <DownloadButton rows={subs} />
            <a href="/" className="text-sm" style={{ color: "var(--gold)" }}>&larr; Engine</a>
          </div>
        </div>

        {/* Metric cards */}
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Metric label="Total submissions" value={total} />
          <Metric label="Top pathway" value={topPathway} />
          <Metric label="Avg. experience" value={`${avgExp} yrs`} />
          <Metric label="Unique goals" value={Object.keys(goalCounts).length} />
        </div>

        {/* Pathway breakdown */}
        <Section title="Recommendations by pathway">
          <div className="flex flex-col gap-3">
            {Object.entries(pathwayCounts).sort((a, b) => b[1] - a[1]).map(([name, count]) => (
              <div key={name} className="flex items-center gap-4">
                <span className="w-44 text-sm" style={{ color: "var(--ivory-dim)" }}>{name}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full" style={{ background: "rgba(244,239,230,0.08)" }}>
                  <div className="h-full rounded-full" style={{ width: `${(count / maxPathway) * 100}%`, background: PATHWAY_COLORS[name] || "var(--gold)" }} />
                </div>
                <span className="w-8 text-right text-sm" style={{ color: "var(--ivory)" }}>{count}</span>
              </div>
            ))}
            {total === 0 && <p style={{ color: "var(--ivory-dim)" }}>No submissions yet.</p>}
          </div>
        </Section>

        {/* Goals + Domains side by side */}
        <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
          <Section title="Most common goals" tight>
            <div className="flex flex-col gap-2">
              {topGoals.map(([name, count]) => (
                <div key={name} className="flex justify-between text-sm">
                  <span style={{ color: "var(--ivory)" }}>{name}</span>
                  <span style={{ color: "var(--gold)" }}>{count}</span>
                </div>
              ))}
              {topGoals.length === 0 && <p style={{ color: "var(--ivory-dim)" }}>—</p>}
            </div>
          </Section>
          <Section title="Popular domains" tight>
            <div className="flex flex-wrap gap-2">
              {topDomains.map(([name, count]) => (
                <span key={name} className="rounded-full px-3 py-1.5 text-sm"
                  style={{ background: "rgba(217,164,65,0.1)", border: "1px solid rgba(217,164,65,0.3)", color: "var(--gold-soft)" }}>
                  {name} · {count}
                </span>
              ))}
              {topDomains.length === 0 && <p style={{ color: "var(--ivory-dim)" }}>—</p>}
            </div>
          </Section>
        </div>

        {/* Table */}
        <Section title="All submissions">
          <div className="overflow-x-auto rounded-2xl" style={{ border: "1px solid var(--line)" }}>
            <table className="w-full text-left text-sm">
              <thead>
                <tr style={{ background: "var(--ink-soft)", color: "var(--ivory-dim)" }}>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Goal</th>
                  <th className="px-5 py-3 font-medium">Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id} style={{ borderTop: "1px solid var(--line)" }}>
                    <td className="px-5 py-3" style={{ color: "var(--ivory)" }}>{s.full_name}</td>
                    <td className="px-5 py-3" style={{ color: "var(--ivory-dim)" }}>{s.email}</td>
                    <td className="px-5 py-3" style={{ color: "var(--ivory-dim)" }}>{GOAL_LABEL[s.career_goal] || s.career_goal}</td>
                    <td className="px-5 py-3">
                      <span className="rounded-full px-3 py-1 text-xs" style={{ background: "rgba(217,164,65,0.12)", color: "var(--gold-soft)" }}>
                        {s.recommendation}
                      </span>
                    </td>
                  </tr>
                ))}
                {total === 0 && (
                  <tr><td colSpan={4} className="px-5 py-10 text-center" style={{ color: "var(--ivory-dim)" }}>No submissions yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>
      </div>
    </main>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "var(--ink-soft)", border: "1px solid var(--line)" }}>
      <p className="text-xs" style={{ color: "var(--ivory-dim)" }}>{label}</p>
      <p className="font-display mt-2 text-2xl" style={{ color: "var(--ivory)" }}>{value}</p>
    </div>
  );
}

function Section({ title, children, tight }) {
  return (
    <div className={tight ? "mt-0" : "mt-10"}>
      <p className="mb-4 text-xs tracking-[0.2em] uppercase" style={{ color: "var(--gold)" }}>{title}</p>
      {children}
    </div>
  );
}