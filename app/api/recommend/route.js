import { NextResponse } from "next/server";
import { recommend } from "../../lib/engine";
import { supabase } from "../../lib/supabase";
import { writeRationale } from "../../lib/ai";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      fullName, email, qualification, experienceYears,
      profession, careerGoal,
      vision, domains, strength, time, budget, success,
    } = body;

    // Server-side validation (never trust the client alone)
    if (!fullName || !email || experienceYears === "" || experienceYears == null) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // 1. Deterministic engine decides the pathway + scores
    const { pathway, scores } = recommend({ qualification, experienceYears, careerGoal });

    // 2. AI returns structured output; fall back to templated rationale if it fails.
    const ai = await writeRationale({
      pathway, fullName, qualification, experienceYears, profession, careerGoal,
      vision, domains, strength, time, budget, success,
    });
    const rationale = ai?.rationale || buildRationale({ pathway, experienceYears, qualification, careerGoal });
    const strengths = ai?.strengths || [];
    const paths = ai?.paths || [];

    // 3. Persist the full record to Supabase
    const { data: inserted, error: insertError } = await supabase
      .from("submissions")
      .insert({
        full_name: fullName,
        email,
        qualification,
        experience_years: Number(experienceYears) || 0,
        profession: profession || null,
        career_goal: careerGoal,
        recommendation: pathway,
        rationale,
        scores,
        strengths,
        paths,
        profile: { vision, domains, strength, time, budget, success },
      })
      .select()
      .single();

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      return NextResponse.json({ error: "Could not save your submission." }, { status: 500 });
    }

    // 4. Automation hook: log an analytics event (fire-and-forget)
    await supabase.from("events").insert({
      event_type: "submission_created",
      submission_id: inserted.id,
      metadata: { recommendation: pathway },
    });

    return NextResponse.json({ pathway, scores, rationale, strengths, paths, id: inserted.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not process the request." }, { status: 500 });
  }
}

const GOAL_TEXT = {
  skill: "building new skills",
  industry: "advancing into industry leadership",
  research: "moving into research or academia",
  recognition: "recognition for your contributions",
};

function buildRationale({ pathway, experienceYears, qualification, careerGoal }) {
  const goal = GOAL_TEXT[careerGoal] || "your stated goal";
  const yrs = Number(experienceYears) || 0;
  const map = {
    "Certification Program": `With ${yrs} year(s) of experience and a focus on ${goal}, a targeted certification program is the highest-leverage next step. It builds concrete capability quickly without the multi-year commitment of a doctoral track.`,
    "DBA": `Your ${yrs} years of experience, combined with a ${qualification} and a goal centered on ${goal}, point clearly to a Doctor of Business Administration. The DBA is designed for senior practitioners who want doctoral-level rigor applied to real-world problems rather than a purely academic route.`,
    "PhD": `A ${qualification} together with an explicit goal of ${goal} makes a PhD the strongest fit. It is the established gateway into original research and academic roles, and your current qualification already clears the entry bar.`,
    "Honorary Doctorate": `With ${yrs}+ years of experience and a goal oriented toward ${goal}, an honorary doctorate recognizes a distinguished body of work rather than requiring further formal study.`,
  };
  return map[pathway] || "Recommendation generated based on your profile.";
}