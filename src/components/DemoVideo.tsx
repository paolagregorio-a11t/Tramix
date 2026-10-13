import { useEffect, useRef, useState } from "react";

/**
 * Animated product demo. Not a recording: a scripted simulation of the app
 * driven by a single clock (t, in ms), so every frame is derived from time.
 * Sample data only.
 */
const SCENES = [
  { at: 0, title: "Apunta tus ingresos", sub: "Dos números al mes. Nada más." },
  { at: 4500, title: "Mira cómo cierras el año", sub: "Un rango, no una cifra inventada." },
  { at: 9000, title: "Recibe el aviso a tiempo", sub: "Antes de cada ventana de cambio." },
  { at: 13500, title: "Cambia de tramo", sub: "Con la guía paso a paso." },
] as const;
const TOTAL = 18000;
const MONTHS = ["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const INCOME = [1450, 1620, 1380, 1900, 2100, 1750, 2300, 2450, 2600];
const PROJ = [2400, 2500, 2700];
const MAX = 3000;

const clamp = (n: number) => Math.min(1, Math.max(0, n));
const ease = (n: number) => 1 - Math.pow(1 - clamp(n), 3);

export function DemoVideo() {
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [t, setT] = useState(reduced ? 11000 : 0);
  const [playing, setPlaying] = useState(!reduced);
  const last = useRef(0);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    last.current = performance.now();
    const tick = (now: number) => {
      const dt = now - last.current;
      last.current = now;
      setT((p) => (p + dt) % TOTAL);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const scene = SCENES.reduce((acc, s, i) => (t >= s.at ? i : acc), 0);
  const typed = Math.min(INCOME.length, Math.floor(t / 420));
  const shown = t < 4500 ? typed : INCOME.length;
  const projP = ease((t - 4900) / 1400);
  const alertP = ease((t - 9400) / 700);
  const doneP = ease((t - 13900) / 600);
  const income = INCOME[Math.max(0, shown - 1)];
  const sceneIn = (t - SCENES[scene].at) / 400;

  return (
    <figure className="demo" aria-label="Demostración animada de la app Tramix, con datos de ejemplo">
      <div className="demo__chrome">
        <span /><span /><span />
        <b>tramix.app / panel</b>
      </div>

      <div className="demo__screen">
        <div className="demo__top">
          <div>
            <small>Rendimiento neto acumulado</small>
            <strong className="num">{(INCOME.slice(0, shown).reduce((a, b) => a + b, 0)).toLocaleString("es-ES")} €</strong>
          </div>
          <span className={`pill ${doneP > 0.5 ? "pill--ok" : alertP > 0.2 ? "pill--warn" : ""}`}>
            {doneP > 0.5 ? "Tramo 9 · al día" : alertP > 0.2 ? "Plazo en 12 días" : "Tramo 8"}
          </span>
        </div>

        <div className="chart" role="img" aria-label="Ingresos mensuales de enero a diciembre con proyección">
          {MONTHS.map((m, i) => {
            const real = i < INCOME.length;
            const v = real ? INCOME[i] : PROJ[i - INCOME.length];
            const on = real ? i < shown : projP * 3 > i - INCOME.length;
            const h = on ? (v / MAX) * 100 : 0;
            const isLast = i === 11;
            return (
              <div className="chart__col" key={i}>
                <div className="chart__track">
                  <div
                    className={`bar ${real ? "" : "bar--proj"} ${isLast && doneP > 0.5 ? "bar--amber" : ""}`}
                    style={{ height: `${h}%` }}
                  />
                </div>
                <span>{m}</span>
              </div>
            );
          })}
          <div className="chart__range" style={{ opacity: projP }}>
            Cierre estimado: entre tramo 8 y 9
          </div>
        </div>

        <div className="demo__row">
          <label>Ingresos de {["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep"][Math.max(0, shown - 1)]}</label>
          <span className="field-fake num">{income.toLocaleString("es-ES")} €<i className="caret" /></span>
        </div>

        <div className="notif" style={{ opacity: alertP, transform: `translateY(${(1 - alertP) * -24}px)` }} aria-hidden={alertP < 0.5}>
          <span className="notif__icon">🔔</span>
          <div>
            <b>Tramix · ahora</b>
            <p>Cambia a <u>tramo 9</u> antes del 31 de diciembre y evitas unos <b>1.100 €</b> en la regularización.</p>
          </div>
        </div>

        <div className="done" style={{ opacity: doneP, transform: `scale(${0.9 + doneP * 0.1})` }} aria-hidden={doneP < 0.5}>
          <span className="done__check">✓</span>
          <div>
            <b>Cambio de base hecho</b>
            <p>Sin sorpresas en la regularización.</p>
          </div>
        </div>
      </div>

      <figcaption className="demo__bar">
        <button type="button" className="play" onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pausar" : "Reproducir"}>
          {playing ? "❚❚" : "▶"}
        </button>
        <div className="caption" key={scene} style={{ opacity: clamp(sceneIn + 0.2) }}>
          <b>{SCENES[scene].title}</b>
          <span>{SCENES[scene].sub}</span>
        </div>
        <div className="scenes" role="tablist" aria-label="Escenas">
          {SCENES.map((s, i) => (
            <button
              key={s.at}
              type="button"
              role="tab"
              aria-selected={i === scene}
              aria-label={`Escena ${i + 1}: ${s.title}`}
              className={i === scene ? "on" : ""}
              onClick={() => { setT(s.at + 50); }}
            />
          ))}
        </div>
      </figcaption>
      <small className="demo__note">Simulación con datos de ejemplo</small>
    </figure>
  );
}
