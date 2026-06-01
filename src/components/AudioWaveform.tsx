import { useEffect, useRef, useState } from "react";

/**
 * Real-time microphone waveform using the Web Audio API.
 * Requests mic access while `active` is true and renders the live
 * time-domain signal (actual wave shape) plus a frequency-bar overlay.
 * Falls back to a simulated waveform only when the mic is denied/unavailable.
 */
export function AudioWaveform({
  active,
  onLevel,
}: {
  active: boolean;
  /** Reports normalized RMS amplitude (0..1) per animation frame. */
  onLevel?: (level: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [micState, setMicState] = useState<"idle" | "live" | "denied">("idle");
  const onLevelRef = useRef(onLevel);
  onLevelRef.current = onLevel;

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let ctx: AudioContext | null = null;
    let stream: MediaStream | null = null;
    let analyser: AnalyserNode | null = null;
    let timeArr: Uint8Array | null = null;
    let freqArr: Uint8Array | null = null;
    let cancelled = false;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: false,
            autoGainControl: false,
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const AC =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        ctx = new AC();
        if (ctx.state === "suspended") {
          try {
            await ctx.resume();
          } catch {
            /* noop */
          }
        }
        const src = ctx.createMediaStreamSource(stream);
        analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.6;
        src.connect(analyser);
        timeArr = new Uint8Array(analyser.fftSize);
        freqArr = new Uint8Array(analyser.frequencyBinCount);
        setMicState("live");
        drawLive();
      } catch {
        setMicState("denied");
        drawFake();
      }
    })();

    function drawLive() {
      if (!canvasRef.current || !analyser || !timeArr || !freqArr) return;
      const c = canvasRef.current;
      const cx = c.getContext("2d")!;
      analyser.getByteTimeDomainData(
        timeArr as unknown as Uint8Array<ArrayBuffer>
      );
      analyser.getByteFrequencyData(
        freqArr as unknown as Uint8Array<ArrayBuffer>
      );
      // Report real RMS amplitude (0..1) for downstream voice-tremor analysis.
      if (onLevelRef.current) {
        let sumSq = 0;
        for (let i = 0; i < timeArr.length; i++) {
          const v = timeArr[i] / 128 - 1;
          sumSq += v * v;
        }
        onLevelRef.current(Math.sqrt(sumSq / timeArr.length));
      }
      paint(cx, c.width, c.height, timeArr, freqArr);
      raf = requestAnimationFrame(drawLive);
    }

    function drawFake() {
      if (!canvasRef.current) return;
      const c = canvasRef.current;
      const cx = c.getContext("2d")!;
      const N = 512;
      const time = new Uint8Array(N);
      const t = performance.now() / 200;
      for (let i = 0; i < N; i++) {
        const x = i / N;
        const v =
          Math.sin(x * Math.PI * 6 + t) * 0.35 +
          Math.sin(x * Math.PI * 14 + t * 1.7) * 0.15 +
          (Math.random() - 0.5) * 0.08;
        time[i] = Math.max(0, Math.min(255, Math.round(128 + v * 128)));
      }
      const freq = new Uint8Array(64);
      for (let i = 0; i < freq.length; i++) {
        freq[i] = 40 + Math.random() * 120;
      }
      paint(cx, c.width, c.height, time, freq);
      raf = requestAnimationFrame(drawFake);
    }

    function paint(
      cx: CanvasRenderingContext2D,
      w: number,
      h: number,
      time: Uint8Array,
      freq: Uint8Array
    ) {
      cx.clearRect(0, 0, w, h);

      // Frequency bars (background, dim)
      const bw = w / freq.length;
      for (let i = 0; i < freq.length; i++) {
        const v = freq[i] / 255;
        const bh = Math.max(1, v * h * 0.85);
        cx.fillStyle = "color-mix(in oklab, oklch(0.72 0.20 230) 35%, transparent)";
        cx.fillRect(i * bw + 1, (h - bh) / 2, bw - 2, bh);
      }

      // Time-domain waveform (foreground, glowing line)
      cx.lineWidth = 2;
      cx.strokeStyle = "oklch(0.85 0.25 145)";
      cx.shadowColor = "oklch(0.85 0.25 145)";
      cx.shadowBlur = 10;
      cx.beginPath();
      const step = w / time.length;
      for (let i = 0; i < time.length; i++) {
        const v = time[i] / 128 - 1; // -1..1
        const y = h / 2 + v * (h / 2) * 0.9;
        const x = i * step;
        if (i === 0) cx.moveTo(x, y);
        else cx.lineTo(x, y);
      }
      cx.stroke();
      cx.shadowBlur = 0;

      // Center axis
      cx.strokeStyle = "color-mix(in oklab, oklch(0.72 0.20 230) 40%, transparent)";
      cx.lineWidth = 1;
      cx.beginPath();
      cx.moveTo(0, h / 2);
      cx.lineTo(w, h / 2);
      cx.stroke();
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      ctx?.close();
      setMicState("idle");
    };
  }, [active]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={600}
        height={80}
        className="w-full h-20 rounded-md bg-black/40 border border-[var(--color-scan)]/30"
      />
      <div className="absolute top-1 right-2 font-mono text-[10px] tracking-widest">
        {micState === "live" && (
          <span className="text-[var(--color-truth)]">● MIC LIVE</span>
        )}
        {micState === "denied" && (
          <span className="text-[var(--color-lie)]">○ MIC DENIED — SIM</span>
        )}
        {micState === "idle" && !active && (
          <span className="text-muted-foreground">○ MIC IDLE</span>
        )}
      </div>
    </div>
  );
}
