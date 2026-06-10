// The Academic Pathway Recommendation Engine
// A deterministic, explainable scoring engine. The decision is made here
// by transparent rules (never by an AI), so results are auditable and
// reproducible: the same profile always yields the same recommendation.

// How "advanced" each pathway is, used for ordering and explanation.
export const PATHWAYS = {
  CERTIFICATION: "Certification Program",
  DBA: "DBA",
  PHD: "PhD",
  HONORARY: "Honorary Doctorate",
};

// Map a highest-qualification string to a numeric rank (0 = lowest).
const QUALIFICATION_RANK = {
  "High school": 0,
  "Diploma": 1,
  "Bachelor's": 2,
  "Master's": 3,
  "Doctorate": 4,
};

// The four career-goal options the user can pick, with the intent each implies.
export const CAREER_GOALS = {
  skill: "Build new skills / upskill",
  industry: "Advance into industry leadership",
  research: "Move into research / academia",
  recognition: "Recognition for lifetime contribution",
};

// Score each dimension on a 0..1 scale so they're comparable and displayable.
function scoreDimensions(experienceYears, qualificationRank, careerGoal) {
  // Experience saturates at 20 years (anything beyond is "very senior").
  const experienceScore = Math.min(experienceYears / 20, 1);

  // Qualification as a fraction of the maximum rank.
  const qualificationScore = qualificationRank / 4;

  // Goal alignment toward higher academic intensity.
  const goalWeights = {
    skill: 0.15,
    industry: 0.6,
    research: 0.85,
    recognition: 1.0,
  };
  const goalScore = goalWeights[careerGoal] ?? 0.15;

  return {
    experience: Number(experienceScore.toFixed(2)),
    qualification: Number(qualificationScore.toFixed(2)),
    goal: Number(goalScore.toFixed(2)),
  };
}

// The actual decision rules. Ordered most-specific first.
function decidePathway(experienceYears, qualificationRank, careerGoal) {
  // Honorary: a long career plus a recognition-oriented goal.
  if (careerGoal === "recognition" && experienceYears >= 20 && qualificationRank >= 3) {
    return PATHWAYS.HONORARY;
  }
  // PhD: research intent and at least a Master's-level qualification.
  if (careerGoal === "research" && qualificationRank >= 3) {
    return PATHWAYS.PHD;
  }
  // DBA: senior practitioner staying in industry.
  if (careerGoal === "industry" && experienceYears >= 6 && qualificationRank >= 3) {
    return PATHWAYS.DBA;
  }
  if (careerGoal === "industry" && experienceYears >= 10 && qualificationRank >= 2) {
    return PATHWAYS.DBA;
  }
  // A very experienced person with a strong qualification, not just upskilling.
  if (experienceYears >= 15 && qualificationRank >= 3 && careerGoal !== "skill") {
    return PATHWAYS.DBA;
  }
  // Default: a focused certification is the highest-leverage next step.
  return PATHWAYS.CERTIFICATION;
}

// Public function: takes a profile, returns the recommendation + the math behind it.
export function recommend({ qualification, experienceYears, careerGoal }) {
  const qualificationRank = QUALIFICATION_RANK[qualification] ?? 0;
  const exp = Number(experienceYears) || 0;

  const scores = scoreDimensions(exp, qualificationRank, careerGoal);
  const pathway = decidePathway(exp, qualificationRank, careerGoal);

  return {
    pathway,
    scores, // { experience, qualification, goal } each 0..1
  };
}