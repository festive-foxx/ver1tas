import { useEffect, useRef } from "react";

/**
 * Web Audio API waveform. Pulls from a live MediaStream microphone
 * (requested when this component mounts) and renders bars on canvas.
 */
export function AudioWaveform({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let ctx: AudioContext | null = null;
    let stream: MediaStream | null = null;
    let analyser: AnalyserNode | null = null;
    let dataArr: Uint8Array | null = null;
    let cancelled = false;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const src = ctx.createMediaStreamSource(stream);
        analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        src.connect(analyser);
        dataArr = new Uint8Array(analyser.frequencyBinCount);
        draw();
      } catch {
        // mic denied -> draw a simulated waveform
        drawFake();
      }
    })();

    function draw() {
      if (!canvasRef.current || !analyser || !dataArr) return;
      const c = canvasRef.current;
      const cx = c.getContext("2d")!;
      analyser.getByteFrequencyData(dataArr as unknown as Uint8Array<ArrayBuffer>);
      paint(cx, c.width, c.height, Array.from(dataArr));
      raf = requestAnimationFrame(draw);
    }
    function drawFake() {
      if (!canvasRef.current) return;
      const c = canvasRef.current;
      const cx = c.getContext("2d")!;
      const arr = Array.from({ length: 64 }, () => 30 + Math.random() * 120);
      paint(cx, c.width, c.height, arr);
      raf = requestAnimationFrame(drawFake);
    }
    function paint(cx: CanvasRenderingContext2D, w: number, h: number, arr: number[]) {
      cx.clearRect(0, 0, w, h);
      const bw = w / arr.length;
      for (let i = 0; i < arr.length; i++) {
        const v = arr[i] / 255;
        const bh = Math.max(2, v * h * 0.95);
        const grad = cx.createLinearGradient(0, h, 0, 0);
        grad.addColorStop(0, "oklch(0.72 0.20 230)");
        grad.addColorStop(1, "oklch(0.85 0.25 145)");
        cx.fillStyle = grad;
        cx.shadowColor = "oklch(0.72 0.20 230)";
        cx.shadowBlur = 8;
        cx.fillRect(i * bw + 1, (h - bh) / 2, bw - 2, bh);
      }
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      ctx?.close();
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={80}
      className="w-full h-20 rounded-md bg-black/40 border border-[var(--color-scan)]/30"
    />
  );
}
