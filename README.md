# CultureCall

CultureCall combines public company signals with a short voice interview to create a structured Culture Banger Brief.

## Friction

**F1 - Intake quality**

Public marketing language does not reveal the specific behavior, story, and message employees should remember.

## Business Outcome

**Revenue**

A personalized pre-brief makes the Jam Sesh immediately relevant and can help convert more free consultations into paid Banger projects.

## Setup

```bash
npm install
cp .env.example .env.local
# fill in XAI_API_KEY and ELEVENLABS_API_KEY in .env.local
npm run dev
```

## What Works

- homepage fetch
- pasted reviews
- Grok analysis
- voice-to-text interview if browser supports it
- editable transcript
- Grok-generated structured brief
- generated title and hook
- spoken hook (browser speechSynthesis)
- generated song audio via ElevenLabs Music API

## What Is Not Built

- no Google Reviews scraping
- no multi-page crawler
- no database
- no authentication
- no production voice cloning
- no analytics
- no deployment hardening

## Sample Generated Songs

See `demo-assets/` for real ElevenLabs-generated samples in different tones (fun, emotional, professional, energetic), all built from the same "Not a Ticket Number" brief.

## Note on Song Generation

The original brief specified text-only output (title + hook) read aloud via browser TTS, deferring actual music production to Business Bangerz. This build adds a real "Generate Song" step using the ElevenLabs Music API, which sends the brief's title, tone, and hook as a prompt and returns generated audio.
