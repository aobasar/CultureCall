import { NextRequest, NextResponse } from "next/server";
import { analyzeCompany } from "@/lib/grok";
import { fetchHomepage } from "@/lib/website";

export async function POST(req: NextRequest) {
  try {
    const { url, reviews, websiteText: manualWebsiteText } = await req.json();

    if (!reviews || typeof reviews !== "string") {
      return NextResponse.json({ error: "Reviews are required" }, { status: 400 });
    }

    let websiteText = manualWebsiteText || "";

    if (!websiteText) {
      if (!url || typeof url !== "string") {
        return NextResponse.json({ error: "Company URL is required" }, { status: 400 });
      }
      try {
        new URL(url);
      } catch {
        return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
      }

      try {
        websiteText = await fetchHomepage(url);
      } catch {
        return NextResponse.json(
          { error: "Could not fetch website. Please paste the website text manually.", needsManualText: true },
          { status: 422 }
        );
      }
    }

    const analysis = await analyzeCompany(websiteText, reviews);

    return NextResponse.json({ analysis, websiteText });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Company analysis failed" }, { status: 500 });
  }
}
