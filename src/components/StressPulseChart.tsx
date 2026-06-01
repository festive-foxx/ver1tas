import { useEffect, useRef, useState } from "react";
import { Line, LineChart, ResponsiveContainer, YAxis, ReferenceLine } from "recharts";

/**
 * Live "Stress Pulse" line chart driven by real behavioral inputs.
 * The baseline drifts upward with recent typing/keystroke activity and
 * decays toward calm when the subject is still, on top of small organic noise.
 * Reports every sample via `onSample` so the parent can compute stress stats.
 */
export function StressPulseChart({
  active,
  /** Monotonic counter the parent bumps on each keystroke. */
  activitySignal = 0,
  onSample,
}: {
  active: boolean;
  activitySignal?: number;
  onSample?: (v: number) => void;
}) {
  const [data, setData] = useState<{ t: number; v: number }[]>(
    Array.from({ length: 40 }, (_, i) => ({ t: i, v: 50 }))
  );

  // Track recent keystroke arousal from the activitySignal counter.
  const arousalRef = useRef(0);
  const lastSignalRef = useRef(activitySignal);
  useEffect(() => {
    if (activitySignal !== lastSignalRef.current) {
      lastSignalRef.current = activitySignal;
      // Each keystroke injects an arousal spike, capped.
      arousalRef.current = Math.min(45, arousalRef.current + 9);
    }
  }, [activitySignal]);

  useEffect(() => {
    if (!active) return;
    let t = data.length;
    const id = setInterval(() => {
      // Arousal decays steadily between keystrokes.
      arousalRef.current = Math.max(0, arousalRef.current - 3.5);
      setData((prev) => {
        const last = prev[prev.length - 1].v;
        const target = 45 + arousalRef.current;
        // Pull toward an activity-driven target, with organic noise + spikes.
        const pull = (target - last) * 0.18;
        const noise = (Math.random() - 0.5) * 10;
        const spike =
          Math.random() < 0.08 + arousalRef.current / 300
            ? (Math.random() - 0.3) * 40
            : 0;
        const next = Math.max(5, Math.min(95, last + pull + noise + spike));
        onSample?.(next);
        return [...prev.slice(-49), { t: ++t, v: Math.round(next) }];
      });
    }, 180);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, onSample]);

  return (
    <div className="h-32 w-full">
      <ResponsiveContainer>
        <LineChart data={data}>
          <YAxis domain={[0, 100]} hide />
          <ReferenceLine y={50} stroke="var(--color-border)" strokeDasharray="3 3" />
          <Line
            type="monotone"
            dataKey="v"
            stroke="var(--color-lie)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            style={{ filter: "drop-shadow(0 0 6px var(--color-lie))" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
