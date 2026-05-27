import { useEffect, useRef, useState } from "react";

/**
 * Animated radar / scanner graphic.
 * Tries to attach to webcam if `enableCamera` is set and user grants access,
 * otherwise renders a pure simulated radar.
 */
export function BiometricScanner({ enableCamera = false }: { enableCamera?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCam, setHasCam] = useState(false);

  useEffect(() => {
    if (!enableCamera) return;
    let stream: MediaStream | null = null;
    navigator.mediaDevices
      ?.getUserMedia({ video: { width: 320, height: 320 } })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          setHasCam(true);
        }
      })
      .catch(() => setHasCam(false));
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [enableCamera]);

  return (
    <div className="relative mx-auto aspect-square w-64 sm:w-80">
      {/* Outer ring */}
      <div className="absolute inset-0 rounded-full border-2 border-[var(--color-scan)] animate-pulse-glow" />
      {/* Mid ring */}
      <div className="absolute inset-4 rounded-full border border-[var(--color-scan)]/60" />
      <div className="absolute inset-8 rounded-full border border-[var(--color-scan)]/40" />
      <div className="absolute inset-12 rounded-full border border-[var(--color-scan)]/30" />

      {/* Crosshair */}
      <div className="absolute left-1/2 top-0 h-full w-px bg-[var(--color-scan)]/40" />
      <div className="absolute top-1/2 left-0 w-full h-px bg-[var(--color-scan)]/40" />

      {/* Rotating radar sweep */}
      <div
        className="absolute inset-0 rounded-full animate-radar"
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0deg, color-mix(in oklab, var(--color-scan) 60%, transparent) 30deg, transparent 60deg)",
          maskImage: "radial-gradient(circle, black 60%, transparent 100%)",
        }}
      />

      {/* Center: webcam or simulated fingerprint */}
      <div className="absolute inset-12 rounded-full overflow-hidden bg-black/40 flex items-center justify-center">
        {hasCam ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover opacity-80"
            style={{ filter: "hue-rotate(80deg) contrast(1.1)" }}
          />
        ) : (
          <svg viewBox="0 0 64 64" className="h-full w-full text-[var(--color-scan)] animate-flicker">
            <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M32 8c-9 0-16 7-16 16v8c0 8 2 14 4 20" />
              <path d="M32 14c-6 0-12 4-12 12v6c0 7 1 12 3 18" />
              <path d="M32 20c-4 0-8 3-8 8v4c0 6 1 12 3 18" />
              <path d="M32 26c-2 0-4 2-4 6v4c0 5 1 11 3 16" />
              <path d="M32 32v6c0 4 1 11 3 16" />
              <path d="M40 22c2 3 2 6 2 10v6c0 4-1 8-2 12" />
              <path d="M46 18c3 4 4 8 4 14v6" />
            </g>
          </svg>
        )}
      </div>

      {/* Scanning line */}
      <div className="absolute inset-12 overflow-hidden rounded-full pointer-events-none">
        <div
          className="absolute inset-x-0 h-1 animate-scan-line"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--color-scan), transparent)",
            boxShadow: "0 0 12px var(--color-scan)",
          }}
        />
      </div>

      {/* Corner ticks */}
      {["top-0 left-0", "top-0 right-0 rotate-90", "bottom-0 right-0 rotate-180", "bottom-0 left-0 -rotate-90"].map(
        (pos) => (
          <div key={pos} className={`absolute ${pos} w-6 h-6`}>
            <div className="absolute top-0 left-0 w-4 h-px bg-[var(--color-scan)]" />
            <div className="absolute top-0 left-0 h-4 w-px bg-[var(--color-scan)]" />
          </div>
        )
      )}
    </div>
  );
}
