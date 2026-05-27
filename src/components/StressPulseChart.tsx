import { useEffect, useState } from "react";
import { Line, LineChart, ResponsiveContainer, YAxis, ReferenceLine } from "recharts";

/**
 * Live "Stress Pulse" line chart. Fluctuates while `active` is true and
 * reports every sample via `onSample` so the parent can compute stress stats.
 */
export function StressPulseChart({
  active,
  onSample,
}: {
  active: boolean;
  onSample?: (v: number) => void;
}) {
  const [data, setData] = useState<{ t: number; v: number }[]>(
    Array.from({ length: 40 }, (_, i) => ({ t: i, v: 50 }))
  );

  useEffect(() => {
    if (!active) return;
    let t = data.length;
    const id = setInterval(() => {
      setData((prev) => {
        const last = prev[prev.length - 1].v;
        const drift = (Math.random() - 0.5) * 20;
        const spike = Math.random() < 0.15 ? (Math.random() - 0.5) * 60 : 0;
        const next = Math.max(5, Math.min(95, last + drift + spike));
        onSample?.(next);
        return [...prev.slice(-49), { t: ++t, v: Math.round(next) }];
      });
    }, 180);
    return () => clearInterval(id);
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
