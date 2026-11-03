import { useState } from "react";
import { cuotaMaxima, cuotaMinima, rendimientoMes, tablaOficial, tramoPara, type Regimen } from "../engine/calc";
import { TABLA_2026 } from "../engine/tramos";
import { href } from "../router";
import { IMPORTES, cuotaXPath } from "../routes";
import { eur0, eur2 } from "./format";
import { trackOnce } from "../analytics";

const T = TABLA_2026;
const num = (v: string) => Math.max(0, Number(v.replace(/\./g, "").replace(",", ".")) || 0);

/** Instant cuota calculator: by monthly net yield, or by income and expenses. Works without an account. */
export function CuotaCalculator({ initial = 2000, compact = false, id = "calc" }: { initial?: number; compact?: boolean; id?: string }) {
  const [modo, setModo] = useState<"neto" | "ingresos">("neto");
  const [neto, setNeto] = useState(String(initial));
  const [ing, setIng] = useState("2500");
  const [gas, setGas] = useState("400");
  const [reg, setReg] = useState<Regimen>("persona-fisica");
  const rend = modo === "neto" ? num(neto) : rendimientoMes({ ingresos: num(ing), gastos: num(gas) }, reg);
  const n = tramoPara(rend, T), of = tablaOficial(n), tr = T.tramos[n - 1];
  const used = (campo: string) => trackOnce(`calc-${id}`, "calculo_tramo", { donde: id, campo });
  const cerca = IMPORTES.reduce((a, b) => (Math.abs(b - rend) < Math.abs(a - rend) ? b : a), IMPORTES[0]);

  return (
    <div className={`calc ${compact ? "calc--compact" : ""}`}>
      <div className="calc__tabs" role="tablist" aria-label="Cómo quieres calcular">
        <button type="button" role="tab" aria-selected={modo === "neto"} className={modo === "neto" ? "on" : ""} onClick={() => setModo("neto")}>Sé mi rendimiento neto</button>
        <button type="button" role="tab" aria-selected={modo === "ingresos"} className={modo === "ingresos" ? "on" : ""} onClick={() => setModo("ingresos")}>Ingresos y gastos</button>
      </div>
      {modo === "neto" ? (
        <div className="calc__f"><label htmlFor={`${id}-neto`}>Rendimiento neto mensual</label>
          <div className="calc__in"><input id={`${id}-neto`} inputMode="decimal" value={neto} onChange={(e) => { used("neto"); setNeto(e.target.value); }} /><span>€/mes</span></div></div>
      ) : (<>
        <div className="calc__row">
          <div className="calc__f"><label htmlFor={`${id}-ing`}>Ingresos al mes</label><div className="calc__in"><input id={`${id}-ing`} inputMode="decimal" value={ing} onChange={(e) => { used("ingresos"); setIng(e.target.value); }} /><span>€</span></div></div>
          <div className="calc__f"><label htmlFor={`${id}-gas`}>Gastos al mes</label><div className="calc__in"><input id={`${id}-gas`} inputMode="decimal" value={gas} onChange={(e) => { used("gastos"); setGas(e.target.value); }} /><span>€</span></div></div>
        </div>
        <div className="calc__f"><label htmlFor={`${id}-reg`}>Tipo de autónomo</label>
          <select id={`${id}-reg`} value={reg} onChange={(e) => setReg(e.target.value as Regimen)}><option value="persona-fisica">Persona física (deducción 7 %)</option><option value="societario">Societario (deducción 3 %)</option></select></div>
        <p className="calc__note">Rendimiento neto: {eur0(rend)} al mes (ingresos − gastos, sin tu cuota, menos la deducción genérica).</p>
      </>)}
      <output className="calc__out" htmlFor={modo === "neto" ? `${id}-neto` : `${id}-ing ${id}-gas`} aria-live="polite">
        <div className="calc__big"><small>Tu tramo</small><b>Tramo {n}</b><span>Tabla {of.tabla} · tramo {of.n}</span></div>
        <div className="calc__grid">
          <div><small>Cuota mínima</small><b>{eur2(cuotaMinima(n, T))}</b><span>al mes</span></div>
          <div><small>Cuota máxima</small><b>{eur2(cuotaMaxima(n, T))}</b><span>al mes</span></div>
          <div><small>Base de cotización</small><b>{eur0(tr.baseMin)} – {eur0(tr.baseMax)}</b><span>al mes</span></div>
          <div><small>Al año (base mínima)</small><b>{eur0(cuotaMinima(n, T) * 12)}</b><span>12 cuotas</span></div>
        </div>
      </output>
      {!compact && <p className="calc__more">Detalle completo: <a href={href(cuotaXPath(cerca))} onClick={() => trackOnce(`calc-more-${id}`, "calculo_tramo_detalle", { donde: id })}>cuota de autónomo con {eur0(cerca)} al mes</a> · <a href={href("/regularizacion-cuota-autonomos")}>¿te tocará pagar en la regularización?</a></p>}
    </div>
  );
}
