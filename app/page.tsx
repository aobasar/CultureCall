"use client";

import { useRef, useState } from "react";
import {
  DEMO_URL,
  DEMO_WEBSITE_TEXT,
  DEMO_REVIEWS,
  DEMO_ANSWERS,
  DEMO_FALLBACK_BRIEF,
} from "./demo-data";

type UIState = "INPUT" | "ANALYZED" | "INTERVIEW" | "RESULT";

interface CompanyAnalysis {
  company: string;
  products_services: string[];
  culture_signals: string[];
  customer_value_summary: string;
}

interface BangerBrief {
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

const QUESTIONS = [
  "What is the most important thing you want employees to remember?",
  "Tell me one real example that represents your company culture.",
  "What should the song feel like - fun, energetic, emotional, professional, or something else?",
];

export default function Page() {
  const [uiState, setUiState] = useState<UIState>("INPUT");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [url, setUrl] = useState("");
  const [reviews, setReviews] = useState("");
  const [needsManualText, setNeedsManualText] = useState(false);
  const [manualWebsiteText, setManualWebsiteText] = useState("");
  const [websiteText, setWebsiteText] = useState("");

  const [analysis, setAnalysis] = useState<CompanyAnalysis | null>(null);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(["", "", ""]);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [speechSupported] = useState(
    typeof window !== "undefined" &&
      !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
  );

  const [brief, setBrief] = useState<BangerBrief | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const [songLoading, setSongLoading] = useState(false);
  const [songUrl, setSongUrl] = useState<string | null>(null);
  const [songError, setSongError] = useState<string | null>(null);

  function speak(text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  }

  function loadDemo() {
    setUrl(DEMO_URL);
    setReviews(DEMO_REVIEWS);
    setManualWebsiteText(DEMO_WEBSITE_TEXT);
    setNeedsManualText(true);
    setError(null);
  }

  async function analyzeCompanyHandler() {
    setError(null);
    if (!reviews.trim()) {
      setError("Please paste at least one review.");
      return;
    }
    if (!needsManualText && !url.trim()) {
      setError("Please enter a company URL.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          reviews,
          websiteText: needsManualText ? manualWebsiteText : undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.needsManualText) {
          setNeedsManualText(true);
          setError(data.error);
        } else {
          setError(data.error || "Analysis failed.");
        }
        return;
      }

      setAnalysis(data.analysis);
      setWebsiteText(data.websiteText);
      setUiState("ANALYZED");
    } catch {
      setError("Analysis failed. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function startInterview() {
    setUiState("INTERVIEW");
    setQuestionIndex(0);
    setTimeout(() => speak(QUESTIONS[0]), 200);
  }

  function startListening() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Microphone transcription is not supported in this browser. Please type your answer.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setAnswers((prev) => {
        const next = [...prev];
        next[questionIndex] = (next[questionIndex] ? next[questionIndex] + " " : "") + transcript;
        return next;
      });
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setIsListening(false);
  }

  function nextQuestion() {
    if (!answers[questionIndex].trim()) {
      setError("Please answer the question before continuing.");
      return;
    }
    setError(null);

    if (questionIndex < QUESTIONS.length - 1) {
      const next = questionIndex + 1;
      setQuestionIndex(next);
      setTimeout(() => speak(QUESTIONS[next]), 200);
    } else {
      generateBrief();
    }
  }

  async function generateBrief() {
    setError(null);
    setLoading(true);
    setUsingFallback(false);
    try {
      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis,
          answer1: answers[0],
          answer2: answers[1],
          answer3: answers[2],
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setBrief(DEMO_FALLBACK_BRIEF);
        setUsingFallback(true);
        setError(data.error || "Brief generation failed. Showing a saved fallback result.");
      } else {
        setBrief(data.brief);
      }
      setUiState("RESULT");
    } catch {
      setBrief(DEMO_FALLBACK_BRIEF);
      setUsingFallback(true);
      setUiState("RESULT");
      setError("Brief generation failed. Showing a saved fallback result.");
    } finally {
      setLoading(false);
    }
  }

  async function generateSong() {
    if (!brief) return;
    setSongError(null);
    setSongLoading(true);
    setSongUrl(null);
    try {
      const res = await fetch("/api/song", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSongError(data.error || "Song generation failed.");
        return;
      }
      const blob = await res.blob();
      setSongUrl(URL.createObjectURL(blob));
    } catch {
      setSongError("Song generation failed. Check your connection and try again.");
    } finally {
      setSongLoading(false);
    }
  }

  function playHook() {
    if (brief) speak(brief.hook);
  }

  function copyJson() {
    if (brief) navigator.clipboard.writeText(JSON.stringify(brief, null, 2));
  }

  return (
    <main>
      <h1>Culture Signal</h1>
      <p className="subtitle">Public signals + a short voice interview → a Culture Banger Brief</p>

      {uiState === "INPUT" && (
        <section className="section">
          <h2>1. Company</h2>
          <button className="secondary" type="button" onClick={loadDemo}>
            Load Demo Company
          </button>

          {!needsManualText && (
            <>
              <label>Company website URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </>
          )}

          {needsManualText && (
            <>
              <label>Company Website Text</label>
              <textarea
                value={manualWebsiteText}
                onChange={(e) => setManualWebsiteText(e.target.value)}
                placeholder="Paste website text here"
              />
            </>
          )}

          <label>Public Reviews</label>
          <textarea
            value={reviews}
            onChange={(e) => setReviews(e.target.value)}
            placeholder={"Paste 3-5 positive public reviews here.\nOne review per line is enough."}
          />

          <div>
            <button type="button" disabled={loading} onClick={analyzeCompanyHandler}>
              {loading ? "Analyzing..." : "Analyze Company"}
            </button>
          </div>

          {error && <p className="error">{error}</p>}
        </section>
      )}

      {analysis && uiState !== "INPUT" && (
        <section className="section">
          <h2>Company Analysis</h2>
          <div className="result-card">
            <dl>
              <dt>Company</dt>
              <dd>{analysis.company}</dd>
              <dt>What they sell</dt>
              <dd>{analysis.products_services.join(", ")}</dd>
              <dt>Culture signals</dt>
              <dd>
                {analysis.culture_signals.map((s) => (
                  <span className="tag" key={s}>
                    {s}
                  </span>
                ))}
              </dd>
              <dt>What customers seem to value</dt>
              <dd>{analysis.customer_value_summary}</dd>
            </dl>
          </div>

          {uiState === "ANALYZED" && (
            <button type="button" onClick={startInterview}>
              Start Interview
            </button>
          )}
        </section>
      )}

      {uiState === "INTERVIEW" && (
        <section className="section">
          <h2>
            2. Voice Interview <span className="badge">Question {questionIndex + 1} of 3</span>
          </h2>
          <p>{QUESTIONS[questionIndex]}</p>

          {speechSupported ? (
            <button type="button" onClick={isListening ? stopListening : startListening}>
              {isListening ? "Stop Recording" : "🎤 Record Answer"}
            </button>
          ) : (
            <p className="badge">Microphone not supported — please type your answer</p>
          )}

          <label>Transcript (editable)</label>
          <textarea
            value={answers[questionIndex]}
            onChange={(e) => {
              const next = [...answers];
              next[questionIndex] = e.target.value;
              setAnswers(next);
            }}
            placeholder="Your answer will appear here, or type it directly"
          />

          <button type="button" disabled={loading} onClick={nextQuestion}>
            {loading
              ? "Generating..."
              : questionIndex < QUESTIONS.length - 1
              ? "Next"
              : "Create Banger Brief"}
          </button>

          {error && <p className="error">{error}</p>}
        </section>
      )}

      {uiState === "RESULT" && brief && (
        <section className="section">
          <h2>
            3. Banger Brief {usingFallback && <span className="badge">Fallback result</span>}
          </h2>

          {error && <p className="error">{error}</p>}

          <div className="result-card">
            <dl>
              <dt>Objective</dt>
              <dd>{brief.objective}</dd>
              <dt>Culture signals</dt>
              <dd>
                {brief.culture_signals.map((s) => (
                  <span className="tag" key={s}>
                    {s}
                  </span>
                ))}
              </dd>
              <dt>Behavior change</dt>
              <dd>{brief.behavior_change}</dd>
              <dt>Story</dt>
              <dd>{brief.story}</dd>
              <dt>Tone</dt>
              <dd>{brief.tone}</dd>
              <dt>Song title</dt>
              <dd>{brief.song_title}</dd>
              <dt>Hook</dt>
              <dd>
                <pre>{brief.hook}</pre>
              </dd>
            </dl>
          </div>

          <button type="button" onClick={playHook}>
            Play Hook
          </button>
          <button className="secondary" type="button" onClick={copyJson}>
            Copy JSON
          </button>
          <button type="button" disabled={songLoading} onClick={generateSong}>
            {songLoading ? "Generating Song..." : "🎵 Generate Song"}
          </button>

          {songError && <p className="error">{songError}</p>}

          {songUrl && (
            <div className="result-card">
              <label>Generated Song</label>
              <audio controls src={songUrl} style={{ width: "100%" }} />
            </div>
          )}
        </section>
      )}
    </main>
  );
}
