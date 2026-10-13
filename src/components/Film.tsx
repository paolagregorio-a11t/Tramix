import { useClock, ease, prog, fmt } from "../lib";
import { Bell } from "./Icons";

/**
 * "El corto": a 32 s animated film made in code. Every layer is a pure function of
 * the clock t, so scrubbing, pausing and looping all work. Sample data only.
 */
const TOTAL = 32000;
const SC = [
  { at: 0, name: "El aviso", sub: "31 de octubre. Llega la carta." },
  { at: 6000, name: "El giro", sub: "¿Y si lo hubieras visto venir?" },
  { at: 11000, name: "Tramix", sub: "Apuntas, y la proyección aparece sola." },
  { at: 19000, name: "El aviso bueno", sub: "Te avisamos antes del plazo." },
  { at: 25000, name: "Final", sub: "Tramo 9. Sin sorpresas." },
] as const;
const MONTHS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
const INCOME = [1450, 1620, 1380, 1900, 2100, 1750, 2300, 2450, 2600];
const PROJ = [2400, 2500, 2700];

const win = (t: number, a: number, b: number, fade = 400) => Math.min(prog(t, a, a + fade), 1 - prog(t, b - fade, b));

export function Film({ active }: { active: boolean }) {
  const { t, playing, setPlaying, seek } = useClock(TOTAL, false, active);
  const scene = SC.reduce((acc, s, i) => (t >= s.at ? i : acc), 0);

  // S0
  const w0 = win(t, 0, 6000);
  const due = ease(prog(t, 3300, 3800));
  // S1
  const w1 = win(t, 6000, 11000);
  const rewind = prog(t, 7800, 10400);
  const mIdx = Math.max(0, Math.round(9 - rewind * 9));
  // S2
  const w2 = win(t, 11000, 19000);
  const s2 = t - 11000;
  const shown = Math.min(9, Math.floor(Math.max(0, s2 - 900) / 330));
  const projP = ease(prog(s2, 4600, 6000));
  // S3
  const w3 = win(t, 19000, 25000);
  const s3 = t - 19000;
  const steps = [prog(s3, 2400, 2800), prog(s3, 3300, 3700), prog(s3, 4200, 4600)];
  // S4
  const w4 = win(t, 25000, 32000, 500);
  const s4 = t - 25000;

  return (
    <div className="film" role="region" aria-label="Cortometraje animado de Tramix, con datos de ejemplo">
      <div className="film__stage">
        {/* S0: la carta */}
        <div className="layer" style={{ opacity: w0 }}>
          <div className="k-big" style={{ transform: `translateY(${(1 - ease(prog(t, 200, 900))) * 60}px)`, opacity: ease(prog(t, 200, 700)) }}>Es 31 de <em>octubre.</em></div>
          <div className="letter" style={{ transform: `translateY(${(1 - ease(prog(t, 1500, 2300))) * 120}px) rotate(${-4 + ease(prog(t, 1500, 2300)) * 4}deg)`, opacity: ease(prog(t, 1500, 2000)) }}>
            <small>SEGURIDAD SOCIAL · REGULARIZACIÓN DE CUOTAS</small>
            <p>Importe a ingresar</p>
            <strong className="num">{fmt(Math.round(ease(prog(t, 2300, 3300)) * 1100))},00 €</strong>
            <span className="due" style={{ opacity: due, transform: `translateY(${(1 - due) * 8}px)` }}>Pendiente de pago</span>
          </div>
        </div>

        {/* S1: el giro, calendario hacia atrás */}
        <div className="layer" style={{ opacity: w1 }}>
          <div className="k-big" style={{ transform: `translateY(${(1 - ease(prog(t, 6200, 6900))) * 60}px)`, opacity: ease(prog(t, 6200, 6700)) }}>¿Y si lo hubieras <em>visto venir?</em></div>
          <div className="cal" style={{ opacity: ease(prog(t, 7400, 7900)) }}>
            
            <b key={mIdx}>{MONTHS[mIdx]}</b>
          </div>
        </div>

        {/* S2: la app */}
        <div className="layer" style={{ opacity: w2 }}>
          <div className="s2-head" style={{ opacity: ease(prog(s2, 0, 500)), transform: `scale(${0.6 + ease(prog(s2, 0, 700)) * 0.4})` }}>
            <svg viewBox="0 0 64 64" aria-hidden="true"><rect x="6" y="36" width="14" height="20" rx="4" fill="#8fa6d8" /><rect x="25" y="22" width="14" height="34" rx="4" fill="#fff" /><rect x="44" y="8" width="14" height="48" rx="4" fill="#e9b44c" /></svg>
            <span>tramix</span>
          </div>
          <div className="s2-chart">
            {MONTHS.map((m, i) => {
              const real = i < 9; const v = real ? INCOME[i] : PROJ[i - 9];
              const on = real ? i < shown : projP * 3 > i - 9;
              return (
                <div key={m} className="s2-col">
                  <div className="s2-track"><div className={`s2-bar ${real ? "" : "proj"}`} style={{ height: `${on ? (v / 3000) * 100 : 0}%` }} /></div>
                  <span>{m}</span>
                </div>
              );
            })}
            <b className="s2-range" style={{ opacity: projP, transform: `translate(-50%, ${(1 - projP) * 14}px)` }}>Cierras entre el tramo 8 y el 9</b>
          </div>
        </div>

        {/* S3: el aviso */}
        <div className="layer" style={{ opacity: w3 }}>
          <div className="notif-xl" style={{ transform: `translateY(${(1 - ease(prog(s3, 300, 1000))) * -160}px)`, opacity: ease(prog(s3, 300, 800)) }}>
            <span className="bell" style={{ animation: s3 > 1000 ? "ring .6s ease-in-out 3" : "none" }}><Bell size={64} /></span>
            <div><small>TRAMIX · AHORA</small><p>Plazo en <b>12 días</b>. Cambia a <u>tramo 9</u> y evitas unos <b>1.100 €</b>.</p></div>
          </div>
          <ul className="todo">
            {["Elige el tramo 9", "Entra en Import@ss", "Confirma el cambio"].map((x, i) => (
              <li key={x} style={{ opacity: ease(prog(s3, 1900 + i * 900, 2300 + i * 900)), transform: `translateX(${(1 - ease(prog(s3, 1900 + i * 900, 2400 + i * 900))) * -50}px)` }}>
                <i className={steps[i] > 0.5 ? "on" : ""}>{steps[i] > 0.5 ? "✓" : ""}</i>{x}
              </li>
            ))}
          </ul>
        </div>

        {/* S4: final */}
        <div className="layer layer--end" style={{ opacity: w4 }}>
          <div className="stairs-xl" aria-hidden="true">
            {[0.34, 0.6, 1].map((h, i) => <i key={i} style={{ height: `${ease(prog(s4, 200 + i * 350, 900 + i * 350)) * h * 100}%`, background: i === 2 ? "var(--gold)" : i === 1 ? "#fff" : "var(--steel-soft)" }} />)}
          </div>
          <div className="end-copy">
            <div className="k-big" style={{ opacity: ease(prog(s4, 1300, 1900)), transform: `translateY(${(1 - ease(prog(s4, 1300, 2000))) * 50}px)` }}>Tramo 9.<br /><em>Sin sorpresas.</em></div>
            <p className="saved" style={{ opacity: ease(prog(s4, 2500, 3000)) }}><b className="num">{fmt(Math.round(ease(prog(s4, 2500, 4000)) * 1100))} €</b> que no pagas de más</p>
          </div>
        </div>
      </div>

      <button type="button" className="film__big" aria-label={playing ? "Pausar" : "Reproducir"} onClick={() => setPlaying(!playing)} style={{ opacity: playing ? 0 : 1 }}>▶</button>
      <div className="film__sub" key={scene}>{SC[scene].sub}</div>
      <div className="film__bar">
        <button type="button" className="film__play" onClick={() => setPlaying(!playing)} aria-label={playing ? "Pausar" : "Reproducir"}>{playing ? "❚❚" : "▶"}</button>
        <div className="film__chap" role="tablist" aria-label="Capítulos">
          {SC.map((s, i) => {
            const end = i < SC.length - 1 ? SC[i + 1].at : TOTAL;
            const fill = i < scene ? 1 : i === scene ? (t - s.at) / (end - s.at) : 0;
            return (
              <button key={s.name} type="button" role="tab" aria-selected={i === scene} onClick={() => seek(s.at + 60)} style={{ flexGrow: end - s.at }}>
                <span className="film__track"><span style={{ width: `${fill * 100}%` }} /></span>
                <em>{s.name}</em>
              </button>
            );
          })}
        </div>
        <span className="film__time num">{Math.floor(t / 1000)}s / {TOTAL / 1000}s</span>
      </div>
    </div>
  );
}
