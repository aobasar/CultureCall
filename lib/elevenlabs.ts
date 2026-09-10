const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1";

export async function generateSong(prompt: string): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY is not set");

  const res = await fetch(`${ELEVENLABS_BASE_URL}/music`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      music_length_ms: 14000,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`ElevenLabs song generation failed: ${res.status} ${errText}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
