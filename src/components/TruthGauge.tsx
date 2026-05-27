import { useEffect, useState } from "react";

/**
 * Circular gauge that animates from 0 → `value` (0..100).
 * Color shifts from red (lie) through scan (blue) to truth (green).
 */
export function TruthGauge({ value }: { value: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const dur = 1400;
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(value * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const r = 90;
  const c = 2 * Math.PI * r;
  const offset = c - (shown / 100) * c;

  const color =
    value >= 70 ? "var(--color-truth)" : value >= 40 ? "var(--color-scan)" : "var(--color-lie)";
  const label =
    value >= 70 ? "TRUTHFUL" : value >= 40 ? "UNCERTAIN" : "DECEPTIVE";

  return (
    <div className="relative mx-auto w-64 h-64">
      <svg viewBox="0 0 220 220" className="w-full h-full -rotate-90">
        <circle cx="110" cy="110" r={r} stroke="var(--color-border)" strokeWidth="10" fill="none" />
        <circle
          cx="110"
          cy="110"
          r={r}
          stroke={color}
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 8px ${color})`, transition: "stroke 400ms" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-5xl font-display font-bold" style={{ color, textShadow: `0 0 18px ${color}` }}>
          {Math.round(shown)}%
        </div>
        <div className="mt-1 text-xs tracking-[0.4em] text-muted-foreground">TRUTH PROBABILITY</div>
        <div className="mt-3 text-sm font-display tracking-widest" style={{ color }}>
          {label}
        </div>
      </div>
    </div>
  );
}
