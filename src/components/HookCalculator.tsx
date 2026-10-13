import { useState, type FormEvent } from "react";

/**
 * Lead-magnet form: "¿Te va a tocar pagar en la regularización?"
 * UI only for now. The calculation engine (tramos por año, rendimiento neto)
 * is the next piece and must read versioned tables, never hardcoded values.
 */
export function HookCalculator() {
  const [sent, setSent] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // TODO: send to waitlist backend (e.g. Supabase) and trigger the result email.
    setSent(true);
  }

  if (sent) {
    return (
      <div className="card calc" role="status">
        <span className="badge">✓ Recibido</span>
        <h3>Revisa tu correo</h3>
        <p className="muted">Te enviaremos el resultado desglosado en cuanto lo tengamos calculado.</p>
      </div>
    );
  }

  return (
    <form className="card calc" onSubmit={onSubmit} aria-labelledby="calc-title">
      <h3 id="calc-title">¿Te va a tocar pagar en la regularización?</h3>
      <p className="muted">Descúbrelo en 1 minuto. Sin registro.</p>

      <div className="field">
        <label htmlFor="ingresos">Ingresos netos que llevas este año (€)</label>
        <input id="ingresos" name="ingresos" type="number" inputMode="decimal" min="0" required placeholder="18000" />
      </div>
      <div className="field">
        <label htmlFor="meses">Meses transcurridos</label>
        <select id="meses" name="meses" defaultValue="9">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="cuota">Cuota mensual que pagas ahora (€)</label>
        <input id="cuota" name="cuota" type="number" inputMode="decimal" min="0" required placeholder="294" />
      </div>
      <div className="field">
        <label htmlFor="email">Email para enviarte el resultado</label>
        <input id="email" name="email" type="email" required autoComplete="email" placeholder="tu@email.com" />
        <small>Sin spam. Solo avisos sobre tu tramo.</small>
      </div>
      <button className="btn btn--accent" type="submit">Ver mi resultado</button>
    </form>
  );
}
