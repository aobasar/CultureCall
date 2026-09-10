import { NextRequest, NextResponse } from "next/server";
import { generateSong } from "@/lib/elevenlabs";
import { BangerBrief } from "@/lib/grok";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "song";
}

async function saveSongLocally(audio: Buffer, songTitle: string): Promise<string> {
  const dir = path.join(process.cwd(), "generated-songs");
  await mkdir(dir, { recursive: true });
  const filename = `${Date.now()}-${slugify(songTitle)}.mp3`;
  const filePath = path.join(dir, filename);
  await writeFile(filePath, audio);
  return filePath;
}

export async function POST(req: NextRequest) {
  try {
    const { brief } = (await req.json()) as { brief: BangerBrief };

    if (!brief) {
      return NextResponse.json({ error: "Banger Brief is required" }, { status: 400 });
    }

    const prompt = `A ${brief.tone} internal company culture song titled "${brief.song_title}" for ${brief.company}. Culture signals: ${brief.culture_signals.join(", ")}. Hook lyrics:\n${brief.hook}`;

    const audio = await generateSong(prompt);

    const savedPath = await saveSongLocally(audio, brief.song_title);
    console.log(`[song] saved locally at ${savedPath}`);

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
