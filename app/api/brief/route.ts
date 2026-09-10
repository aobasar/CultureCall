import { NextRequest, NextResponse } from "next/server";
import { createBangerBrief, CompanyAnalysis } from "@/lib/grok";

export async function POST(req: NextRequest) {
  try {
    const { analysis, answer1, answer2, answer3 } = (await req.json()) as {
      analysis: CompanyAnalysis;
      answer1: string;
      answer2: string;
      answer3: string;
    };

    if (!analysis) {
      return NextResponse.json({ error: "Company analysis is required" }, { status: 400 });
    }
    if (!answer1 || !answer2 || !answer3) {
      return NextResponse.json({ error: "All three interview answers are required" }, { status: 400 });
    }

    const brief = await createBangerBrief(analysis, answer1, answer2, answer3);

    return NextResponse.json({ brief });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Banger Brief generation failed" }, { status: 500 });
  }
}
