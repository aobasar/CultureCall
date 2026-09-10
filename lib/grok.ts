import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: "https://api.x.ai/v1",
});

const model = process.env.XAI_MODEL || "grok-4.6";

async function callGrok(system: string, user: string): Promise<string> {
  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("Grok returned no content");
  return content;
}

export interface CompanyAnalysis {
  company: string;
  products_services: string[];
  culture_signals: string[];
  customer_value_summary: string;
}

export async function analyzeCompany(
  websiteText: string,
  reviews: string
): Promise<CompanyAnalysis> {
  const system = `You analyze public company information for Business Bangerz.

Find only useful signals for a company-culture song brief.

Do not invent facts.
Separate public observations from assumptions.

Return JSON only, with exactly these top-level keys and no others:
{
  "company": "string",
  "products_services": ["string"],
  "culture_signals": ["string"],
  "customer_value_summary": "string"
}`;

  const user = `WEBSITE:\n${websiteText}\n\nPUBLIC REVIEWS:\n${reviews}`;

  const raw = await callGrok(system, user);
  const parsed = JSON.parse(raw) as Partial<CompanyAnalysis>;

  return {
    company: parsed.company ?? "Unknown company",
    products_services: parsed.products_services ?? [],
    culture_signals: parsed.culture_signals ?? [],
    customer_value_summary: parsed.customer_value_summary ?? "",
  };
}

export interface BangerBrief {
  company: string;
  objective: string;
  audience: string;
  culture_signals: string[];
  behavior_change: string;
  must_say: string[];
  story: string;
  tone: string;
  avoid: string[];
  song_title: string;
  hook: string;
}

export async function createBangerBrief(
  analysis: CompanyAnalysis,
  answer1: string,
  answer2: string,
  answer3: string
): Promise<BangerBrief> {
  const system = `You are preparing a structured creative brief for Business Bangerz.

Combine public company signals with the client's direct interview answers.

The interview answers are the source of truth when they conflict with public signals.

Create a concise brief for a positive internal culture song.

Do not make unsupported claims.
Do not copy copyrighted lyrics.

Return JSON only, with exactly these top-level keys and no others:
{
  "company": "string",
  "objective": "string",
  "audience": "string",
  "culture_signals": ["string"],
  "behavior_change": "string",
  "must_say": ["string"],
  "story": "string",
  "tone": "string",
  "avoid": ["string"],
  "song_title": "string",
  "hook": "string (4 short lines)"
}`;

  const user = `COMPANY ANALYSIS:\n${JSON.stringify(analysis)}\n\nINTERVIEW ANSWER 1:\n${answer1}\n\nINTERVIEW ANSWER 2:\n${answer2}\n\nINTERVIEW ANSWER 3:\n${answer3}`;

  const raw = await callGrok(system, user);
  const parsed = JSON.parse(raw) as Partial<BangerBrief>;

  return {
    company: parsed.company ?? analysis.company ?? "Unknown company",
    objective: parsed.objective ?? "",
    audience: parsed.audience ?? "Employees",
    culture_signals: parsed.culture_signals ?? [],
    behavior_change: parsed.behavior_change ?? "",
    must_say: parsed.must_say ?? [],
    story: parsed.story ?? "",
    tone: parsed.tone ?? "",
    avoid: parsed.avoid ?? [],
    song_title: parsed.song_title ?? "",
    hook: parsed.hook ?? "",
  };
}
