import { NextRequest, NextResponse } from "next/server";
import { generateSong } from "@/lib/elevenlabs";
import { BangerBrief } from "@/lib/grok";

export async function POST(req: NextRequest) {
  try {
    const { brief } = (await req.json()) as { brief: BangerBrief };

    if (!brief) {
      return NextResponse.json({ error: "Banger Brief is required" }, { status: 400 });
    }

    const prompt = `A ${brief.tone} internal company culture song titled "${brief.song_title}" for ${brief.company}. Culture signals: ${brief.culture_signals.join(", ")}. Hook lyrics:\n${brief.hook}`;

    const audio = await generateSong(prompt);

    return new NextResponse(new Uint8Array(audio), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(audio.length),
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Song generation failed" }, { status: 500 });
  }
}
