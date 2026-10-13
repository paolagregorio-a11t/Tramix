import { useClock, ease, prog } from "../lib";

/** Looping app demo inside a phone. Sample data; one clock drives every frame. */
const TOTAL = 12000;
const MONTHS = ["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const INCOME = [1450, 1620, 1380, 1900, 2100, 1750, 2300, 2450, 2600];
const PROJ = [2400, 2500, 2700];
const MAX = 3000;

export function PhoneDemo() {
  const { t } = useClock(TOTAL);
  const shown = Math.min(INCOME.length, Math.floor(t / 280));
  const projP = ease(prog(t, 3400, 4600));
  const alertP = ease(prog(t, 6200, 6900));
  const doneP = ease(prog(t, 9200, 9800));
  const total = INCOME.slice(0, shown).reduce((a, b) => a + b, 0);

  return (
    <div className="phone" aria-label="Demostración animada de la app Tramix, con datos de ejemplo" role="img">
      <div className="phone__notch" />
      <div className="phone__screen">
        <div className="ph-top">
          <small>Acumulado {new Date().getFullYear()}</small>
          <strong className="num">{total.toLocaleString("es-ES")} €</strong>
          <span className={`ph-pill ${doneP > 0.5 ? "ok" : alertP > 0.2 ? "warn" : ""}`}>
            {doneP > 0.5 ? "Tramo 9 · al día ✓" : alertP > 0.2 ? "Plazo en 12 días" : "Tramo 8"}
          </span>
        </div>
        <div className="ph-chart">
          {MONTHS.map((m, i) => {
            const real = i < INCOME.length;
            const v = real ? INCOME[i] : PROJ[i - INCOME.length];
            const on = real ? i < shown : projP * 3 > i - INCOME.length;
            return (
              <div key={i} className="ph-col">
                <div className="ph-track"><div className={`ph-bar ${real ? "" : "proj"} ${i === 11 && doneP > 0.5 ? "sun" : ""}`} style={{ height: `${on ? (v / MAX) * 100 : 0}%` }} /></div>
                <span>{m}</span>
              </div>
            );
          })}
          <b className="ph-range" style={{ opacity: projP }}>Cierre: tramo 8–9</b>
        </div>
        <div className="ph-card">Ingresos de este mes <b className="num">{INCOME[Math.max(0, shown - 1)].toLocaleString("es-ES")} €</b></div>
        <div className="ph-notif" style={{ opacity: alertP, transform: `translateY(${(1 - alertP) * -30}px) scale(${0.95 + alertP * 0.05})` }}>
          <span className="bell">🔔</span>
          <p><b>Tramix</b> Cambia a <u>tramo 9</u> antes del 31 dic y evitas ~<b>1.100 €</b></p>
        </div>
        <div className="ph-done" style={{ opacity: doneP, transform: `scale(${0.8 + doneP * 0.2})` }}>✓ Hecho. Sin sorpresas.</div>
      </div>
    </div>
  );
}
