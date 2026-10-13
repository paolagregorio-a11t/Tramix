import { useRef, useState } from "react";
import type { Proyeccion } from "../engine/calc";
import { fmt } from "../lib";

type Props = { valores: number[]; proy: Proyeccion | null; tramos: { n: number; hasta: number }[]; banda: number };
const W = 340, H = 190, PAD = { l: 8, r: 10, t: 14, b: 24 };
const MES = ["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

/** Monthly computable yield with the projected range as a shaded band. Drag or hover to read any month. */
export function YieldChart({ valores, proy, tramos, banda }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const rest = proy?.restante ?? 0;
  const max = Math.max(500, ...valores, rest * (1 + banda)) * 1.18;
  const x = (i: number) => PAD.l + (i / 11) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - v / max) * (H - PAD.t - PAD.b);
  const pts = valores.map((v, i) => [x(i), y(v)] as const);
  const line = pts.map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)} ${py.toFixed(1)}`).join(" ");
  const area = pts.length ? `${line} L${pts[pts.length - 1][0]} ${H - PAD.b} L${pts[0][0]} ${H - PAD.b} Z` : "";
  const last = pts[pts.length - 1];
  const proj = last && proy ? `M${last[0]} ${last[1]} L${x(valores.length)} ${y(rest)} L${x(11)} ${y(rest)}` : "";
  const bandPath = last && proy
    ? `M${x(valores.length)} ${y(rest * (1 + banda))} L${x(11)} ${y(rest * (1 + banda))} L${x(11)} ${y(rest * (1 - banda))} L${x(valores.length)} ${y(rest * (1 - banda))} Z` : "";
  const marks = tramos.filter((t) => t.hasta < max && t.hasta > max * 0.12).filter((_, i, a) => a.length < 7 || i % 2 === 0);

  function move(e: React.PointerEvent) {
    const r = ref.current!.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    setHover(Math.max(0, Math.min(11, Math.round(((px - PAD.l) / (W - PAD.l - PAD.r)) * 11))));
  }
  const val = hover === null ? null : hover < valores.length ? valores[hover] : proy ? rest : null;

  return (
    <div className="yc">
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Rendimiento neto mensual con proyección" onPointerMove={move} onPointerDown={move} onPointerLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="yc-a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2e4c86" stopOpacity=".32" /><stop offset="1" stopColor="#2e4c86" stopOpacity="0" /></linearGradient>
          <pattern id="yc-p" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="3" height="6" fill="#e9b44c" opacity=".38" /></pattern>
        </defs>
        {marks.map((t) => (
          <g key={t.n}><line x1={PAD.l} x2={W - PAD.r} y1={y(t.hasta)} y2={y(t.hasta)} stroke="#d5dce9" strokeDasharray="2 4" />
            <text x={W - PAD.r} y={y(t.hasta) - 3} textAnchor="end" fontSize="8.5" fontWeight="700" fill="#8d97ad">T{t.n}</text></g>
        ))}
        {MES.map((m, i) => <text key={i} x={x(i)} y={H - 7} textAnchor="middle" fontSize="9.5" fontWeight="700" fill={hover === i ? "#0b1220" : "#8d97ad"}>{m}</text>)}
        {bandPath && <path d={bandPath} fill="url(#yc-p)" className="yc__band" />}
        {area && <path d={area} fill="url(#yc-a)" />}
        {proj && <path d={proj} fill="none" stroke="#c28a1f" strokeWidth="2" strokeDasharray="5 5" strokeLinecap="round" />}
        {line && <path d={line} fill="none" stroke="#2e4c86" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="yc__line" pathLength={1} />}
        {last && <circle cx={last[0]} cy={last[1]} r="4.5" fill="#fff" stroke="#2e4c86" strokeWidth="2.5" />}
        {hover !== null && val !== null && (<g>
          <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={H - PAD.b} stroke="#0b1220" strokeOpacity=".25" />
          <circle cx={x(hover)} cy={y(val)} r="5" fill={hover < valores.length ? "#2e4c86" : "#c28a1f"} stroke="#fff" strokeWidth="2" />
        </g>)}
      </svg>
      <div className="yc__tip" aria-live="polite">{hover !== null && val !== null ? <><b>{["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"][hover]}</b> {fmt(Math.round(val))} € {hover >= valores.length && <em>previsto</em>}</> : <span>Toca el gráfico para ver cada mes</span>}</div>
    </div>
  );
}
