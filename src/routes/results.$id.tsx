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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setRec(getRecord(id) ?? null);
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, [id]);

  if (rec === undefined) return null;
  if (rec === null) return <Navigate to="/" />;

  const color =
    rec.truthScore >= 70
      ? "var(--color-truth)"
      : rec.truthScore >= 40
      ? "var(--color-scan)"
      : "var(--color-lie)";

  const label = rec.truthScore >= 70 ? "TRUTHFUL" : rec.truthScore >= 40 ? "UNCERTAIN" : "DECEPTIVE";

  const share = () => {
    const text = `Veritas verdict: ${rec.truthScore}% Truth Probability on "${rec.question}". ${rec.verdict}`;
    if (navigator.share) navigator.share({ text, title: "Veritas Result" }).catch(() => {});
    else {
      navigator.clipboard?.writeText(text);
      alert("Result copied to clipboard.");
    }
  };

  const hesitationLevel = rec.latencyMs > 8000 ? "SEVERE" : rec.latencyMs > 4000 ? "ELEVATED" : "NORMAL";
  const stressLevel = rec.stressFluctuations > 50 ? "HIGH" : rec.stressFluctuations > 25 ? "MODERATE" : "LOW";

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-4xl">
        {/* Topbar */}
        <div className="flex items-center justify-between">
          <Link to="/" className="font-mono text-xs text-muted-foreground hover:text-[var(--color-truth)] transition-colors">
            ← DASHBOARD
          </Link>
          <span className="font-mono text-xs text-muted-foreground">
            REPORT · {new Date(rec.createdAt).toLocaleString()}
          </span>
        </div>

        {/* Classification Banner */}
        <div
          className={`mt-6 flex items-center justify-center gap-3 py-2 border-y transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}`}
          style={{ borderColor: color, color }}
        >
          <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
          <span className="font-display tracking-[0.5em] text-xs">CLASSIFICATION · {label}</span>
          <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
        </div>

        {/* Main Panel */}
        <div className="mt-6 panel rounded-lg p-6 sm:p-10">
          {/* Query */}
          <div className="text-center">
            <div className="font-mono text-xs tracking-[0.3em] text-muted-foreground">INTERROGATION QUERY</div>
            <h1 className="mt-2 font-display text-xl sm:text-2xl leading-tight">{rec.question}</h1>
            <div className="mt-3 text-sm text-muted-foreground italic max-w-2xl mx-auto border-l-2 pl-3 text-left" style={{ borderColor: color }}>
              "{rec.answer}"
            </div>
          </div>

          {/* Gauge */}
          <div className="mt-8">
            <TruthGauge value={rec.truthScore} />
          </div>

          {/* Verdict */}
          <div
            className={`mt-8 max-w-2xl mx-auto text-center transition-all duration-700 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <div className="inline-block px-4 py-2 border rounded" style={{ borderColor: color, color, boxShadow: `0 0 20px -6px ${color}` }}>
              <span className="font-display tracking-wider text-sm sm:text-base">{rec.verdict}</span>
            </div>
          </div>

          {/* Primary Metrics */}
          <div className="mt-10 grid sm:grid-cols-3 gap-3">
            <MetricCard
              label="VOICE TREMOR INDEX"
              value={`${rec.voiceTremor}`}
              suffix="/100"
              intensity={rec.voiceTremor}
              delay={300}
              mounted={mounted}
            />
            <MetricCard
              label="RESPONSE LATENCY"
              value={`${rec.latencyMs}`}
              suffix="ms"
              intensity={Math.min(100, rec.latencyMs / 100)}
              delay={450}
              mounted={mounted}
            />
            <MetricCard
              label="STRESS FLUCTUATIONS"
              value={`${rec.stressFluctuations}`}
              suffix="/100"
              intensity={rec.stressFluctuations}
              delay={600}
              mounted={mounted}
            />
          </div>

          {/* Secondary Analysis */}
          <div
            className={`mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 transition-all duration-700 delay-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <MiniStat label="HESITATION" value={hesitationLevel} color={rec.latencyMs > 4000 ? "var(--color-lie)" : "var(--color-truth)"} />
            <MiniStat label="STRESS LEVEL" value={stressLevel} color={rec.stressFluctuations > 25 ? "var(--color-lie)" : "var(--color-truth)"} />
            <MiniStat label="ANSWER LENGTH" value={`${rec.answer.length} chars`} color="var(--color-scan)" />
            <MiniStat label="SCAN ID" value={`#${id.slice(0, 8).toUpperCase()}`} color="var(--color-scan)" />
          </div>

          {/* Actions */}
          <div className={`mt-10 flex flex-wrap items-center justify-center gap-4 transition-all duration-700 delay-1000 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
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

        {/* Footer disclaimer */}
        <footer className="mt-8 text-center text-xs text-muted-foreground font-mono">
          ⚠ ENTERTAINMENT ONLY · NOT A REAL POLYGRAPH
        </footer>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  suffix,
  intensity,
  delay,
  mounted,
}: {
  label: string;
  value: string;
  suffix: string;
  intensity: number;
  delay: number;
  mounted: boolean;
}) {
  const color =
    intensity >= 70 ? "var(--color-lie)" : intensity >= 40 ? "var(--color-scan)" : "var(--color-truth)";

  return (
    <div
      className={`panel rounded-md p-4 border-l-2 transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      style={{ borderLeftColor: color, transitionDelay: `${delay}ms` }}
    >
      <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-3xl" style={{ color, textShadow: `0 0 10px ${color}` }}>
        {value}
        <span className="text-sm text-muted-foreground ml-1">{suffix}</span>
      </div>
      <div className="mt-3 h-1 bg-black/40 rounded overflow-hidden">
        <div
          className="h-full transition-all duration-1000 ease-out"
          style={{
            width: mounted ? `${Math.min(100, intensity)}%` : "0%",
            background: color,
            boxShadow: `0 0 8px ${color}`,
            transitionDelay: `${delay + 300}ms`,
          }}
        />
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="panel rounded-md p-3 text-center border" style={{ borderColor: `${color}30` }}>
      <div className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-sm tracking-wider" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
