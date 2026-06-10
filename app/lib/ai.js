const MODEL = "gemini-flash-latest";

// Returns a structured object: { rationale, strengths: [...], paths: [{rank, title, why}] }
// or null if the call fails (caller falls back to a templated rationale).
export async function writeRationale(profile) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const prompt = buildPrompt(profile);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": key,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1400,
            thinkingConfig: { thinkingBudget: 0 },
            responseMimeType: "application/json",
          },
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text();
      console.log("Gemini HTTP", res.status, "→", errText.slice(0, 400));
      return null;
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    // The model returns JSON text; parse it safely.
    const parsed = JSON.parse(text);
    if (!parsed.rationale) return null;
    return {
      rationale: parsed.rationale,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 3) : [],
      paths: Array.isArray(parsed.paths) ? parsed.paths.slice(0, 3) : [],
    };
  } catch (e) {
    console.error("Gemini call failed:", e);
    return null;
  }
}

function buildPrompt(p) {
  const domains = Array.isArray(p.domains) ? p.domains.join(", ") : "";
  return `ROLE:
You are a warm, perceptive academic and career counsellor. You understand both formal education and the real, current ways people grow their careers today. You speak directly and personally, never generically.

TASK:
Produce a structured recommendation for this specific person, as JSON.

CONTEXT:
- Name: ${p.fullName || "the applicant"}
- Highest qualification: ${p.qualification || "unknown"}
- Years of experience: ${p.experienceYears || "0"}
- Current profession: ${p.profession || "unstated"}
- Stated career goal: ${p.careerGoal || "unstated"}
- Five-year vision: ${p.vision || "not provided"}
- What people seek their help with (strengths): ${p.strength || "not provided"}
- Domains that excite them: ${domains || "not provided"}
- Time available per week: ${p.time || "not provided"}
- Budget: ${p.budget || "not provided"}
- Personal definition of success: ${p.success || "not provided"}
- PRIMARY PATHWAY chosen by our scoring engine (do not change it): ${p.pathway}

REASONING:
- The PRIMARY PATHWAY above was decided by a separate auditable engine. Do NOT contradict or replace it; treat it as the anchor.
- "rationale": explain warmly why the primary pathway fits THIS person. Reference at least two of their specific answers (vision, strengths, domains, success). 60-90 words. Second person ("you").
- "strengths": identify exactly 3 genuine strengths evident from their answers. Each a short phrase (3-6 words), specific to them, not generic.
- "paths": suggest 2-3 REALISTIC, CURRENT options that fit the primary pathway and their profile. These can be real-world directions people actually pursue today (specific program types, executive routes, applied research tracks, industry-recognised routes) — not only traditional degrees. Rank them best-first with "rank" 1,2,3. Each has a "title" (specific, e.g. "Executive DBA in Data & Analytics Leadership") and a "why" (one sentence tying it to their profile).

OUTPUT (return ONLY valid JSON, no markdown, this exact shape):
{
  "rationale": "string",
  "strengths": ["string", "string", "string"],
  "paths": [
    { "rank": 1, "title": "string", "why": "string" },
    { "rank": 2, "title": "string", "why": "string" }
  ]
}

STOPPING CONDITION:
- Output the JSON object and nothing else. No commentary before or after.`;
}