import { createFileRoute, Link, useParams, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TruthGauge } from "@/components/TruthGauge";
import { getRecord, type TruthRecord } from "@/lib/veritas";

export const Route = createFileRoute("/results/$id")({
  head: () => ({
    meta: [
      { title: "Results — Veritas" },
      { name: "description", content: "Truth Probability analysis result." },
    ],
  }),
  component: Results,
});

function Results() {
  const { id } = useParams({ from: "/results/$id" });
  const [rec, setRec] = useState<TruthRecord | null | undefined>(undefined);

  useEffect(() => {
    setRec(getRecord(id) ?? null);
  }, [id]);

  if (rec === undefined) return null;
  if (rec === null) return <Navigate to="/" />;

  const color =
    rec.truthScore >= 70
      ? "var(--color-truth)"
      : rec.truthScore >= 40
      ? "var(--color-scan)"
      : "var(--color-lie)";

  const share = () => {
    const text = `Veritas verdict: ${rec.truthScore}% Truth Probability on "${rec.question}". ${rec.verdict}`;
    if (navigator.share) navigator.share({ text, title: "Veritas Result" }).catch(() => {});
    else {
      navigator.clipboard?.writeText(text);
      alert("Result copied to clipboard.");
    }
  };

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <Link to="/" className="font-mono text-xs text-muted-foreground hover:text-[var(--color-truth)]">
            ← DASHBOARD
          </Link>
          <span className="font-mono text-xs text-muted-foreground">
            REPORT · {new Date(rec.createdAt).toLocaleString()}
          </span>
        </div>

        <div className="mt-8 panel rounded-lg p-6 sm:p-10">
          <div className="text-center font-display tracking-[0.4em] text-xs" style={{ color }}>
            ANALYSIS COMPLETE
          </div>

          <div className="mt-2 text-center">
            <div className="text-xs font-mono text-muted-foreground tracking-[0.3em]">QUERY</div>
            <h1 className="mt-1 font-display text-xl sm:text-2xl">{rec.question}</h1>
            <div className="mt-3 text-sm text-muted-foreground italic max-w-2xl mx-auto">
              "{rec.answer}"
            </div>
          </div>

          <div className="mt-8">
            <TruthGauge value={rec.truthScore} />
          </div>

          <div className="mt-8 max-w-2xl mx-auto text-center font-display tracking-wider text-base sm:text-lg" style={{ color }}>
            {rec.verdict}
          </div>

          {/* Metrics */}
          <div className="mt-10 grid sm:grid-cols-3 gap-3">
            <Metric label="VOICE TREMOR INDEX" value={`${rec.voiceTremor}`} suffix="/100" intensity={rec.voiceTremor} />
            <Metric label="RESPONSE LATENCY" value={`${rec.latencyMs}`} suffix="ms" intensity={Math.min(100, rec.latencyMs / 100)} />
            <Metric label="STRESS FLUCTUATIONS" value={`${rec.stressFluctuations}`} suffix="/100" intensity={rec.stressFluctuations} />
          </div>

          {/* Actions */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={share}
              className="px-6 py-3 font-display tracking-[0.3em] text-sm border border-[var(--color-scan)] text-[var(--color-scan)] hover:bg-[var(--color-scan)] hover:text-[var(--color-accent-foreground)] transition-colors"
            >
              SHARE RESULT
            </button>
            <Link
              to="/interrogation"
              className="px-6 py-3 font-display tracking-[0.3em] text-sm border border-[var(--color-truth)] text-[var(--color-truth)] hover:bg-[var(--color-truth)] hover:text-[var(--color-primary-foreground)] transition-colors"
            >
              TEST SOMEONE ELSE →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  suffix,
  intensity,
}: {
  label: string;
  value: string;
  suffix: string;
  intensity: number;
}) {
  const color =
    intensity >= 70 ? "var(--color-lie)" : intensity >= 40 ? "var(--color-scan)" : "var(--color-truth)";
  return (
    <div className="panel rounded-md p-4 border-l-2" style={{ borderLeftColor: color }}>
      <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-3xl" style={{ color, textShadow: `0 0 10px ${color}` }}>
        {value}
        <span className="text-sm text-muted-foreground ml-1">{suffix}</span>
      </div>
      <div className="mt-3 h-1 bg-black/40 rounded overflow-hidden">
        <div
          className="h-full transition-all duration-1000"
          style={{ width: `${Math.min(100, intensity)}%`, background: color, boxShadow: `0 0 8px ${color}` }}
        />
      </div>
    </div>
  );
}
