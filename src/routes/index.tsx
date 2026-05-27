import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { loadHistory, clearHistory, type TruthRecord } from "@/lib/veritas";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Veritas — The Stress & Truth Analyzer" },
      { name: "description", content: "A gamified biometric lie detector. Run an interrogation and get your Truth Probability score." },
      { property: "og:title", content: "Veritas — The Stress & Truth Analyzer" },
      { property: "og:description", content: "A gamified biometric lie detector. Run an interrogation and get your Truth Probability score." },
    ],
  }),
  component: Index,
});

function Index() {
  const [history, setHistory] = useState<TruthRecord[]>([]);
  useEffect(() => setHistory(loadHistory()), []);

  return (
    <div className="min-h-screen px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-[var(--color-truth)] animate-pulse" />
            <span className="font-display text-sm tracking-[0.4em] text-[var(--color-truth)] text-glow-truth">
              VERITAS // v2.6
            </span>
          </div>
          <span className="font-mono text-xs text-muted-foreground hidden sm:block">
            SECURE CHANNEL · ENCRYPTED
          </span>
        </header>

        {/* Hero */}
        <section className="mt-12 text-center">
          <h1 className="font-display text-5xl sm:text-7xl font-bold tracking-tight">
            THE STRESS &{" "}
            <span className="text-[var(--color-truth)] text-glow-truth">TRUTH</span>{" "}
            ANALYZER
          </h1>
          <p className="mt-5 max-w-2xl mx-auto text-muted-foreground">
            A real-time biometric interrogation suite. Analyze voice tremor, response latency,
            and stress micro-fluctuations to calculate a live Truth Probability index.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/interrogation"
              className="group relative inline-flex items-center gap-3 px-8 py-4 font-display tracking-[0.3em] text-sm
                         text-[var(--color-truth)] border border-[var(--color-truth)]
                         hover:bg-[var(--color-truth)] hover:text-[var(--color-primary-foreground)]
                         transition-colors animate-pulse-glow"
              style={{ boxShadow: "0 0 24px -4px var(--color-truth)" }}
            >
              <span className="h-2 w-2 rounded-full bg-current" />
              START NEW ANALYSIS
            </Link>
          </div>
        </section>

        {/* Protocol card */}
        <section className="mt-16 panel rounded-lg p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display tracking-[0.3em] text-sm text-[var(--color-scan)]">
              ◤ PROTOCOL BRIEFING
            </h2>
            <span className="text-xs text-muted-foreground font-mono">CLASSIFIED</span>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { n: "01", title: "VOICE TONE", body: "Spectral analysis of microphone input flags tremor and pitch breaks." },
              { n: "02", title: "RESPONSE LATENCY", body: "Time-to-submit is measured in milliseconds. Hesitation costs you." },
              { n: "03", title: "MICRO-HESITATIONS", body: "Cursor jitter and edits per character are correlated with stress." },
            ].map((p) => (
              <div key={p.n} className="border-l-2 border-[var(--color-scan)]/60 pl-4">
                <div className="font-display text-3xl text-[var(--color-scan)]">{p.n}</div>
                <div className="mt-1 font-display tracking-widest text-sm">{p.title}</div>
                <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* History */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display tracking-[0.3em] text-sm text-[var(--color-truth)]">
              ◤ INTERROGATION LOG
            </h2>
            {history.length > 0 && (
              <button
                onClick={() => { clearHistory(); setHistory([]); }}
                className="text-xs font-mono text-muted-foreground hover:text-[var(--color-lie)] transition-colors"
              >
                PURGE ARCHIVE
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="panel rounded-lg p-10 text-center text-muted-foreground font-mono text-sm">
              [ NO RECORDS ] — Run your first interrogation to populate the log.
            </div>
          ) : (
            <ul className="space-y-2">
              {history.map((h) => (
                <li key={h.id}>
                  <Link
                    to="/results/$id"
                    params={{ id: h.id }}
                    className="block panel rounded-md px-4 py-3 hover:border-[var(--color-truth)] transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <ScoreChip score={h.truthScore} />
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm">{h.question}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {new Date(h.createdAt).toLocaleString()} · LAT {h.latencyMs}ms
                        </div>
                      </div>
                      <span className="font-mono text-xs text-muted-foreground group-hover:text-[var(--color-truth)]">
                        OPEN →
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="mt-16 text-center text-xs text-muted-foreground font-mono">
          ⚠ ENTERTAINMENT ONLY · NOT A REAL POLYGRAPH
        </footer>
      </div>
    </div>
  );
}

function ScoreChip({ score }: { score: number }) {
  const color =
    score >= 70 ? "var(--color-truth)" : score >= 40 ? "var(--color-scan)" : "var(--color-lie)";
  return (
    <div
      className="flex items-center justify-center w-14 h-14 rounded border font-display font-bold"
      style={{ color, borderColor: color, boxShadow: `0 0 12px -4px ${color}` }}
    >
      {score}
    </div>
  );
}
