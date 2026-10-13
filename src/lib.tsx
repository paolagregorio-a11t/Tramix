import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";

export const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
export const clamp = (n: number) => Math.min(1, Math.max(0, n));
export const ease = (n: number) => 1 - Math.pow(1 - clamp(n), 3);
export const prog = (t: number, a: number, b: number) => clamp((t - a) / (b - a));

export function useInView<T extends Element>(threshold = 0.25) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [seen, threshold]);
  return [ref, seen] as const;
}

export function Reveal({ children, delay = 0, className = "", style }: { children: ReactNode; delay?: number; className?: string; style?: CSSProperties }) {
  const [ref, seen] = useInView<HTMLDivElement>(0.12);
  return <div ref={ref} className={`reveal ${seen ? "in" : ""} ${className}`} style={{ ...style, ["--d" as string]: `${delay}s` }}>{children}</div>;
}

export function Count({ to, dur = 1400, suffix = "" }: { to: number; dur?: number; suffix?: string }) {
  const [ref, seen] = useInView<HTMLSpanElement>(0.5);
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!seen) return;
    let raf = 0; const t0 = performance.now();
    const tick = (now: number) => { const p = clamp((now - t0) / dur); setV(Math.round(ease(p) * to)); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, to, dur]);
  return <span ref={ref} className="num">{v.toLocaleString("es-ES")}{suffix}</span>;
}

/** Clock in ms that loops over `total`. Returns [t, playing, setPlaying, seek]. */
export function useClock(total: number, startPaused = false, active = true) {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(!startPaused);
  const last = useRef(0);
  useEffect(() => {
    if (!playing || !active) return;
    let raf = 0; last.current = performance.now();
    const tick = (now: number) => { const dt = now - last.current; last.current = now; setT((p) => (p + dt) % total); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, active, total]);
  return { t, playing, setPlaying, seek: setT };
}
