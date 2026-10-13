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

export function confetti(x: number, y: number) {
  const c = document.createElement("canvas");
  c.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:99";
  c.width = innerWidth; c.height = innerHeight; document.body.appendChild(c);
  const g = c.getContext("2d")!;
  const cols = ["#ffd60a", "#ff4f8b", "#2a3bff", "#19e3a1", "#ffffff"];
  const ps = Array.from({ length: 140 }, () => { const a = Math.random() * Math.PI * 2, s = 5 + Math.random() * 13; return { x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 6, r: Math.random() * 6, w: 6 + Math.random() * 8, h: 4 + Math.random() * 6, c: cols[(Math.random() * cols.length) | 0], vr: (Math.random() - .5) * .4 }; });
  const t0 = performance.now();
  const tick = (now: number) => {
    const k = (now - t0) / 2200; g.clearRect(0, 0, c.width, c.height);
    for (const p of ps) { p.vy += .35; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.r += p.vr; g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.globalAlpha = 1 - clamp(k - .5) * 2; g.fillStyle = p.c; g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); g.restore(); }
    if (k < 1) requestAnimationFrame(tick); else c.remove();
  };
  requestAnimationFrame(tick);
}
