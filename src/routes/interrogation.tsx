import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { StressPulseChart } from "@/components/StressPulseChart";
import { AudioWaveform } from "@/components/AudioWaveform";
import { SAMPLE_QUESTIONS, computeResult, saveRecord } from "@/lib/veritas";

export const Route = createFileRoute("/interrogation")({
  head: () => ({
    meta: [
      { title: "Interrogation — Veritas" },
      { name: "description", content: "Active voice polygraph scan in progress." },
    ],
  }),
  component: Interrogation,
});

type Phase = "ready" | "scanning" | "analyzing";

// Amplitude above this (0..1 RMS) counts as the subject actually speaking.
const VOICE_GATE = 0.02;

function Interrogation() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("ready");
  const [mode, setMode] = useState<"random" | "custom">("random");
  const [question, setQuestion] = useState(
    () => SAMPLE_QUESTIONS[Math.floor(Math.random() * SAMPLE_QUESTIONS.length)]
  );
  const [customQuestion, setCustomQuestion] = useState("");
  const [speaking, setSpeaking] = useState(false);

  const startedAt = useRef<number>(0);
  const voiceSamples = useRef<number[]>([]);
  const firstSpeechAt = useRef<number>(0);
  const speakingMs = useRef<number>(0);
  const lastVoiceFrameAt = useRef<number>(0);
  const [activitySignal, setActivitySignal] = useState(0);

  const rerollQuestion = () => {
    let next = question;
    for (let i = 0; i < 5 && next === question; i++) {
      next = SAMPLE_QUESTIONS[Math.floor(Math.random() * SAMPLE_QUESTIONS.length)];
    }
    setQuestion(next);
  };

  const handleStart = () => {
    if (mode === "custom") {
      const q = customQuestion.trim();
      if (!q) return;
      setQuestion(q);
    }
    startedAt.current = Date.now();
    voiceSamples.current = [];
    firstSpeechAt.current = 0;
    speakingMs.current = 0;
    lastVoiceFrameAt.current = 0;
    setSpeaking(false);
    setPhase("scanning");
  };

  const handleLevel = (level: number) => {
    voiceSamples.current.push(level);
    const now = Date.now();
    if (level > VOICE_GATE) {
      if (!firstSpeechAt.current) firstSpeechAt.current = now;
      // accumulate voiced time using gaps between consecutive voiced frames
      if (lastVoiceFrameAt.current && now - lastVoiceFrameAt.current < 400) {
        speakingMs.current += now - lastVoiceFrameAt.current;
      }
      lastVoiceFrameAt.current = now;
      setSpeaking(true);
      setActivitySignal((n) => n + 1);
    } else {
      setSpeaking(false);
    }
  };

  const handleSubmit = () => {
    const latencyMs = firstSpeechAt.current
      ? firstSpeechAt.current - startedAt.current
      : Date.now() - startedAt.current;
    setPhase("analyzing");
    setTimeout(() => {
      const result = computeResult({
        question,
        latencyMs,
        voiceSamples: voiceSamples.current,
        speakingMs: speakingMs.current,
      });
      const id = crypto.randomUUID();
      saveRecord({ id, createdAt: Date.now(), ...result });
      navigate({ to: "/results/$id", params: { id } });
    }, 2200);
  };

  const elapsed = useElapsed(phase === "scanning" ? startedAt.current : 0);

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-4xl">
        {/* Topbar */}
        <div className="flex items-center justify-between">
          <Link to="/" className="font-mono text-xs text-muted-foreground hover:text-[var(--color-truth)]">
            ← ABORT
          </Link>
          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="h-2 w-2 rounded-full bg-[var(--color-lie)] animate-pulse" />
            <span className="tracking-[0.3em] text-[var(--color-lie)]">RECORDING</span>
            <span className="text-muted-foreground">SESSION #{Date.now().toString().slice(-6)}</span>
          </div>
        </div>

        {/* Scanner */}
        <div className="mt-8 panel rounded-lg p-6 sm:p-10">
          <div className="text-center font-display tracking-[0.4em] text-xs text-[var(--color-scan)]">
            VOICE POLYGRAPH ACTIVE
          </div>

          {/* Question */}
          <div className="mt-8 text-center">
            <div className="font-mono text-xs tracking-[0.3em] text-muted-foreground">QUERY</div>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl">
              {phase === "ready" && mode === "custom"
                ? customQuestion.trim() || "AWAITING CUSTOM QUERY…"
                : question}
            </h2>
          </div>

          {/* Vocal stress chart (driven by voice activity) */}
          <div className="mt-8">
            <div className="flex justify-between font-mono text-xs text-muted-foreground mb-1">
              <span>VOCAL STRESS</span>
              <span>T+{(elapsed / 1000).toFixed(1)}s</span>
            </div>
            <StressPulseChart
              active={phase === "scanning"}
              activitySignal={activitySignal}
              onSample={() => {}}
            />
          </div>

          {/* Audio (always on once scanning — voice is the only sensor) */}
          {phase !== "ready" && (
            <div className="mt-4">
              <div className="flex justify-between font-mono text-xs text-muted-foreground mb-1">
                <span>VOICE SPECTRUM</span>
                <span className={speaking ? "text-[var(--color-truth)]" : "text-muted-foreground"}>
                  {speaking ? "● VOICE DETECTED" : "○ LISTENING…"}
                </span>
              </div>
              <AudioWaveform active={phase === "scanning"} onLevel={handleLevel} />
            </div>
          )}

          {/* Controls */}
          {phase === "ready" && (
            <div className="mt-8 space-y-4">
              <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
                <Toggle label="RANDOM QUERY" value={mode === "random"} onChange={() => setMode("random")} />
                <Toggle label="CUSTOM QUERY" value={mode === "custom"} onChange={() => setMode("custom")} />
              </div>

              {mode === "random" ? (
                <div className="flex justify-center">
                  <button
                    onClick={rerollQuestion}
                    className="px-4 py-1.5 font-mono text-xs tracking-widest border border-border text-muted-foreground hover:border-[var(--color-scan)] hover:text-[var(--color-scan)] transition-colors"
                  >
                    ↻ REROLL QUERY
                  </button>
                </div>
              ) : (
                <div className="mx-auto max-w-2xl">
                  <input
                    type="text"
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                    maxLength={200}
                    placeholder="Enter your own interrogation query…"
                    className="w-full bg-black/40 border border-[var(--color-scan)]/60 rounded-md px-4 py-3
                               font-mono text-sm focus:outline-none focus:border-[var(--color-truth)]
                               focus:shadow-[0_0_16px_-4px_var(--color-truth)] transition-shadow"
                  />
                  <div className="mt-1 text-right font-mono text-[10px] text-muted-foreground">
                    {customQuestion.length}/200
                  </div>
                </div>
              )}

              <p className="text-center font-mono text-xs text-muted-foreground">
                This is a voice-only polygraph. Allow microphone access and speak your answer aloud.
              </p>

              <div className="flex justify-center">
                <button
                  onClick={handleStart}
                  disabled={mode === "custom" && !customQuestion.trim()}
                  className="px-8 py-3 font-display tracking-[0.3em] text-sm border border-[var(--color-truth)] text-[var(--color-truth)] hover:bg-[var(--color-truth)] hover:text-[var(--color-primary-foreground)] transition-colors animate-pulse-glow disabled:opacity-30 disabled:cursor-not-allowed disabled:animate-none"
                >
                  BEGIN SCAN
                </button>
              </div>
            </div>
          )}

          {phase === "scanning" && (
            <div className="mt-8 space-y-4 text-center">
              <div className="font-display tracking-[0.3em] text-sm text-[var(--color-scan)] animate-flicker">
                🎙 SPEAK YOUR ANSWER ALOUD
              </div>
              <div className="font-mono text-xs text-muted-foreground">
                Voiced: {(speakingMs.current / 1000).toFixed(1)}s
              </div>
              <div className="flex justify-center">
                <button
                  onClick={handleSubmit}
                  className="px-8 py-3 font-display tracking-[0.3em] text-sm border border-[var(--color-truth)] text-[var(--color-truth)] hover:bg-[var(--color-truth)] hover:text-[var(--color-primary-foreground)] transition-colors"
                >
                  ANALYZE VOICE →
                </button>
              </div>
            </div>
          )}

          {phase === "analyzing" && (
            <div className="mt-8 text-center">
              <div className="font-display tracking-[0.4em] text-sm text-[var(--color-scan)] animate-flicker">
                ANALYZING VOCAL SIGNATURE…
              </div>
              <div className="mt-4 flex justify-center gap-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-2 w-2 rounded-full bg-[var(--color-scan)]"
                    style={{ animation: `pulse-glow 1s ease-in-out ${i * 0.2}s infinite` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`px-3 py-1.5 border font-mono text-xs tracking-widest transition-colors ${
        value
          ? "border-[var(--color-truth)] text-[var(--color-truth)] bg-[var(--color-truth)]/10"
          : "border-border text-muted-foreground hover:border-[var(--color-scan)]"
      }`}
    >
      {value ? "● " : "○ "}{label}
    </button>
  );
}

function useElapsed(start: number) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!start) return;
    const id = setInterval(() => setNow(Date.now() - start), 100);
    return () => clearInterval(id);
  }, [start]);
  return now;
}
