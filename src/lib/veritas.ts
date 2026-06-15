export type TruthRecord = {
  id: string;
  question: string;
  answer: string;
  truthScore: number;       // 0-100
  voiceTremor: number;      // 0-100
  latencyMs: number;
  stressFluctuations: number;
  verdict: string;
  createdAt: number;
};

const KEY = "veritas.history.v1";

export function loadHistory(): TruthRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveRecord(rec: TruthRecord) {
  if (typeof window === "undefined") return;
  const all = [rec, ...loadHistory()].slice(0, 50);
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function getRecord(id: string): TruthRecord | undefined {
  return loadHistory().find((r) => r.id === id);
}

export function clearHistory() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

/**
 * Voice-only polygraph analysis. Every metric is derived purely from the
 * captured microphone amplitude envelope — there is no text input.
 *
 * - `latencyMs`     time from question shown to first detected speech
 * - `voiceSamples`  per-frame RMS amplitude (0..1) for the whole session
 * - `speakingMs`    total duration the subject was actually vocalizing
 */
export function computeResult(opts: {
  question: string;
  latencyMs: number;
  voiceSamples: number[];
  speakingMs: number;
}): Omit<TruthRecord, "id" | "createdAt"> {
  const { question, latencyMs, voiceSamples, speakingMs } = opts;

  // Only count frames with real vocal energy as "voiced".
  const VOICE_GATE = 0.02;
  const voiced = voiceSamples.filter((v) => v > VOICE_GATE);

  // --- Voice tremor: relative variability of vocal amplitude
  // (coefficient of variation). Shaky, uneven delivery -> higher tremor.
  let voiceTremor = 0;
  if (voiced.length >= 8) {
    const vMean = voiced.reduce((a, b) => a + b, 0) / voiced.length;
    const vVar =
      voiced.reduce((a, b) => a + (b - vMean) ** 2, 0) / voiced.length;
    const cv = vMean > 0.001 ? Math.sqrt(vVar) / vMean : 0;
    voiceTremor = Math.min(100, Math.round(cv * 85));
  }

  // --- Vocal stress: micro-jitter between consecutive frames. Tense voices
  // produce rapid frame-to-frame amplitude swings.
  let microJitter = 0;
  if (voiced.length >= 8) {
    let sum = 0;
    for (let i = 1; i < voiced.length; i++) {
      sum += Math.abs(voiced[i] - voiced[i - 1]);
    }
    microJitter = sum / (voiced.length - 1);
  }
  const stressFluctuations = Math.min(100, Math.round(microJitter * 1400));

  // --- Hesitation: slow to start speaking + lots of silent gaps mid-answer.
  const latencyPenalty = Math.min(34, Math.max(0, latencyMs - 1200) / 220);
  const silenceRatio =
    voiceSamples.length > 0
      ? 1 - voiced.length / voiceSamples.length
      : 1;
  const silencePenalty = Math.min(16, Math.max(0, silenceRatio - 0.35) * 40);

  // --- Substance: a too-short spoken answer is treated as evasive.
  const substancePenalty =
    speakingMs < 400 ? 24 : speakingMs < 900 ? 12 : speakingMs < 1600 ? 5 : 0;

  // No usable voice at all -> the polygraph cannot clear the subject.
  if (voiced.length < 6) {
    return {
      question,
      answer: "[No vocal response detected]",
      truthScore: 8,
      voiceTremor: 0,
      latencyMs,
      stressFluctuations: 0,
      verdict:
        "VERDICT: Inconclusive. No vocal response was captured — speak your answer aloud during the scan.",
    };
  }

  let score =
    94 -
    voiceTremor * 0.42 -
    stressFluctuations * 0.34 -
    latencyPenalty -
    silencePenalty -
    substancePenalty;
  score = Math.max(3, Math.min(99, Math.round(score)));

  const answer = `[Spoken response · ${(speakingMs / 1000).toFixed(1)}s voiced]`;

  let verdict = "";
  if (score >= 80) verdict = "VERDICT: Highly Credible. Vocal signature remained steady throughout the scan.";
  else if (score >= 60) verdict = "VERDICT: Likely Truthful. Minor vocal stress detected — possibly nerves.";
  else if (score >= 40) verdict = "VERDICT: Inconclusive. Mixed vocal stress and hesitation markers.";
  else if (score >= 20) verdict = "VERDICT: Deceptive. Significant vocal tremor and hesitation detected.";
  else verdict = "VERDICT: Critical Deception. Voice exhibits all known indicators of fabrication.";

  return {
    question,
    answer,
    truthScore: score,
    voiceTremor,
    latencyMs,
    stressFluctuations,
    verdict,
  };
}

export const SAMPLE_QUESTIONS = [
  "Have you ever lied on a job application?",
  "Do you secretly enjoy reality TV?",
  "Did you eat the last slice of pizza?",
  "Have you ever pretended to laugh at a joke you didn't get?",
  "Do you check your phone during conversations?",
  "Have you ever ghosted someone on purpose?",
  "Do you actually floss every day?",
];
