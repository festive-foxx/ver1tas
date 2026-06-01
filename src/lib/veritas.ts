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

export function computeResult(opts: {
  question: string;
  answer: string;
  latencyMs: number;
  stressSamples: number[];
  /** Real per-frame microphone amplitude samples (0..1). Optional. */
  voiceSamples?: number[];
  /** Inter-keystroke gaps in ms while typing the answer. Optional. */
  keystrokeGaps?: number[];
}): Omit<TruthRecord, "id" | "createdAt"> {
  const {
    question,
    answer,
    latencyMs,
    stressSamples,
    voiceSamples = [],
    keystrokeGaps = [],
  } = opts;

  const trimmed = answer.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;

  // --- Hesitation: scaled by answer length so long, thoughtful answers
  // aren't punished as harshly as a long silence before a one-word reply.
  const expectedMs = 1500 + wordCount * 350; // a fair time budget to answer
  const overrun = Math.max(0, latencyMs - expectedMs);
  const hesitationPenalty = Math.min(38, overrun / 250);

  // --- Stress: combine volatility (std dev) with how elevated the baseline is.
  const mean =
    stressSamples.reduce((a, b) => a + b, 0) / (stressSamples.length || 1);
  const variance =
    stressSamples.reduce((a, b) => a + (b - mean) ** 2, 0) /
    (stressSamples.length || 1);
  const stdDev = Math.sqrt(variance);
  const elevation = Math.max(0, mean - 50); // sustained high stress
  const stressFluctuations = Math.min(
    100,
    Math.round(stdDev * 1.8 + elevation * 0.6)
  );

  // --- Voice tremor from REAL mic amplitude jitter when available.
  // Tremor = relative variability of amplitude (coefficient of variation).
  let voiceTremor: number;
  if (voiceSamples.length >= 8) {
    const vMean =
      voiceSamples.reduce((a, b) => a + b, 0) / voiceSamples.length;
    const vVar =
      voiceSamples.reduce((a, b) => a + (b - vMean) ** 2, 0) /
      voiceSamples.length;
    const cv = vMean > 0.001 ? Math.sqrt(vVar) / vMean : 0;
    voiceTremor = Math.min(100, Math.round(cv * 90));
  } else {
    // No usable mic data: derive a conservative estimate from stress.
    voiceTremor = Math.min(100, Math.round(stressFluctuations * 0.7));
  }

  // --- Typing rhythm: long pauses / erratic gaps mid-answer signal hesitation.
  let rhythmPenalty = 0;
  if (keystrokeGaps.length >= 4) {
    const longPauses = keystrokeGaps.filter((g) => g > 1500).length;
    const kMean =
      keystrokeGaps.reduce((a, b) => a + b, 0) / keystrokeGaps.length;
    const kVar =
      keystrokeGaps.reduce((a, b) => a + (b - kMean) ** 2, 0) /
      keystrokeGaps.length;
    const kStd = Math.sqrt(kVar);
    rhythmPenalty = Math.min(15, longPauses * 4 + kStd / 400);
  }

  // --- Answer substance: very short / empty answers are less credible.
  const lengthPenalty = wordCount === 0 ? 20 : wordCount < 2 ? 12 : wordCount < 4 ? 5 : 0;

  // --- Reduced random variance: the result is now mostly behavior-driven.
  const jitter = (Math.random() - 0.5) * 8;

  let score =
    92 -
    hesitationPenalty -
    stressFluctuations * 0.42 -
    voiceTremor * 0.18 -
    rhythmPenalty -
    lengthPenalty +
    jitter;
  score = Math.max(3, Math.min(99, Math.round(score)));

  let verdict = "";
  if (score >= 80) verdict = "VERDICT: Highly Credible. Biometric signature remained stable throughout the scan.";
  else if (score >= 60) verdict = "VERDICT: Likely Truthful. Minor stress spikes detected — possibly nerves.";
  else if (score >= 40) verdict = "VERDICT: Inconclusive. Mixed signals across stress and latency vectors.";
  else if (score >= 20) verdict = "VERDICT: Deceptive. Significant hesitation and stress fluctuation detected.";
  else verdict = "VERDICT: Critical Deception. Subject exhibits all known indicators of fabrication.";

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
