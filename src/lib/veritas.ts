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
}): Omit<TruthRecord, "id" | "createdAt"> {
  const { question, answer, latencyMs, stressSamples } = opts;

  // Hesitation penalty: longer than ~4s starts hurting score
  const hesitationPenalty = Math.min(40, Math.max(0, (latencyMs - 4000) / 250));

  // Stress: standard deviation of samples
  const mean = stressSamples.reduce((a, b) => a + b, 0) / (stressSamples.length || 1);
  const variance =
    stressSamples.reduce((a, b) => a + (b - mean) ** 2, 0) / (stressSamples.length || 1);
  const stdDev = Math.sqrt(variance);
  const stressFluctuations = Math.min(100, Math.round(stdDev * 2.2));

  // Short answer penalty
  const lengthPenalty = answer.trim().length < 8 ? 12 : 0;

  // Controlled random variance
  const variance2 = (Math.random() - 0.5) * 18;

  let score = 90 - hesitationPenalty - stressFluctuations * 0.35 - lengthPenalty + variance2;
  score = Math.max(4, Math.min(98, Math.round(score)));

  const voiceTremor = Math.min(100, Math.max(0, Math.round(100 - score + (Math.random() - 0.5) * 20)));

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
