import { useMemo, useState } from "react";
import { Logo } from "../components/Logo";
import { Bell, IconArrow, IconCheck, IconGear, IconHome, IconList } from "../components/Icons";
import { cuotaMinima, proximaVentana, proyectar, recomendar, rendimientoMes, tramoPara, ventanas } from "../engine/calc";
import { tablaDe } from "../engine/tramos";
import { fmt } from "../lib";
import { useDemoState } from "./useDemoState";
import "../styles/demo.css";

type Tab = "resumen" | "meses" | "avisos" | "ajustes";
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const MES3 = MESES.map((m) => m.slice(0, 3));
const eur = (n: number) => `${fmt(Math.round(n))} €`;
const fecha = (d: Date) => `${d.getDate()} ${MES3[d.getMonth()].toLowerCase()}`;

export function DemoApp() {
  const [s, setS, reset] = useDemoState();
  const [tab, setTab] = useState<Tab>("resumen");
  const [sheet, setSheet] = useState(false);
  const hoy = useMemo(() => new Date(), []);
  const tabla = tablaDe(hoy.getFullYear());
  const proy = useMemo(() => proyectar(s.meses, tabla, s.regimen), [s.meses, s.regimen, tabla]);
  const rec = proy ? recomendar(s.tramoActual, proy, tabla) : null;
  const prox = proximaVentana(hoy);
  const MAXY = Math.max(1, ...s.meses.map((m) => rendimientoMes(m, s.regimen)), proy?.alto ?? 0, (proy?.restante ?? 0) * 1.15) * 1.1;

  function setMes(i: number, k: "ingresos" | "gastos", v: string) {
    const n = Math.max(0, Number(v.replace(",", ".")) || 0);
    setS({ ...s, meses: s.meses.map((m, j) => (j === i ? { ...m, [k]: n } : m)) });
  }

  return (
    <div className="dm">
      <div className="dm__top container">
        <a href="#" className="dm__back"><IconArrow /> Volver a la web</a>
        <span className="dm__badge">Demo · datos de ejemplo</span>
      </div>

      <div className="dm__stage container">
        <aside className="dm__side">
          <Logo size={30} tone="light" />
          <h1>Así se ve Tramix por dentro.</h1>
          <p>Cambia los ingresos de cualquier mes y mira cómo se mueve la proyección y la recomendación. Todo se calcula en tu navegador.</p>
          <ul>
            <li><IconCheck /> Proyección siempre en rango</li>
            <li><IconCheck /> Cálculo desglosado paso a paso</li>
            <li><IconCheck /> Aviso antes de cada plazo</li>
          </ul>
          <p className="dm__warn">{tabla.verified ? tabla.source : "Las cifras de los tramos son ilustrativas hasta contrastarlas con el BOE y la TGSS. Este cálculo es orientativo y no es asesoramiento fiscal."}</p>
        </aside>

        <div className="app" role="application" aria-label="Demo de la app Tramix">
          <header className="app__head">
            <Logo size={22} tone="dark" />
            <span className="app__year">{hoy.getFullYear()}</span>
          </header>

          <div className="app__body">
            {tab === "resumen" && proy && rec && (
              <>
                <section className="card card--hero">
                  <small>Cierre de año estimado</small>
                  <div className="range">
                    <strong>Tramo {proy.tramoBajo === proy.tramoAlto ? proy.tramoBajo : `${proy.tramoBajo}–${proy.tramoAlto}`}</strong>
                    <span className={`chip ${rec.accion === "mantener" ? "chip--ok" : "chip--warn"}`}>
                      {rec.accion === "mantener" ? "Estás en el rango" : `Pagas el tramo ${s.tramoActual}`}
                    </span>
                  </div>
                  <p className="muted">Rendimiento mensual previsto: {eur(proy.bajo)} – {eur(proy.alto)}</p>
                </section>

                <section className="card">
                  <div className="card__h"><h2>Ingresos netos por mes</h2><small>€ computables</small></div>
                  <div className="bars" role="img" aria-label="Rendimiento neto mensual con proyección">
                    {MES3.map((m, i) => {
                      const real = i < s.meses.length;
                      const v = real ? rendimientoMes(s.meses[i], s.regimen) : proy.restante;
                      return (
                        <div key={m} className="bars__c">
                          <div className="bars__t"><i className={real ? "" : "proj"} style={{ height: `${(v / MAXY) * 100}%` }} /></div>
                          <span>{m[0]}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="legend"><i /> Registrado <i className="proj" /> Proyección</p>
                </section>

                <section className="card card--alert">
                  <div className="alert__ic"><Bell size={20} /></div>
                  <div>
                    <h2>Próximo plazo: {fecha(prox.ventana.limite)}</h2>
                    <p className="muted">Quedan {prox.dias} días para pedir el cambio de base con efecto el {fecha(prox.ventana.efecto)}.</p>
                  </div>
                  <button className="btn app__cta" onClick={() => setSheet(true)}>Ver recomendación</button>
                </section>
              </>
            )}
            {tab === "resumen" && !proy && <p className="muted">Añade al menos un mes en «Meses» para ver la proyección.</p>}

            {tab === "meses" && (
              <section className="card">
                <div className="card__h"><h2>Tus meses</h2><small>Ingresos y gastos (sin cuota de autónomo)</small></div>
                <ul className="months">
                  {s.meses.map((m, i) => (
                    <li key={i}>
                      <b>{MESES[i]}</b>
                      <label><span className="sr">Ingresos de {MESES[i]}</span><input inputMode="decimal" value={m.ingresos} onChange={(e) => setMes(i, "ingresos", e.target.value)} /></label>
                      <label><span className="sr">Gastos de {MESES[i]}</span><input inputMode="decimal" value={m.gastos} onChange={(e) => setMes(i, "gastos", e.target.value)} /></label>
                      <em className="num">{eur(rendimientoMes(m, s.regimen))}</em>
                    </li>
                  ))}
                  <li className="months__h" aria-hidden="true"><b /> <span>Ingresos</span><span>Gastos</span><span>Neto</span></li>
                </ul>
                <p className="muted small">Computable = (ingresos − gastos) menos la deducción genérica del {s.regimen === "societario" ? 3 : 7} %.</p>
              </section>
            )}

            {tab === "avisos" && (
              <section className="card">
                <div className="card__h"><h2>Ventanas de cambio {hoy.getFullYear()}</h2><small>Hasta 6 al año</small></div>
                <ul className="wins">
                  {ventanas(hoy.getFullYear()).map((v, i) => {
                    const pasada = v.limite < new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
                    const es = !pasada && v.limite.getTime() === prox.ventana.limite.getTime();
                    return (
                      <li key={i} className={pasada ? "past" : es ? "next" : ""}>
                        <div><b>Pedir antes del {fecha(v.limite)}</b><small>Efecto: {fecha(v.efecto)}{pasada ? " · pasada" : es ? " · próxima" : ""}</small></div>
                        <button type="button" role="switch" aria-checked={s.avisos[i]} aria-label={`Aviso por email, ventana ${i + 1}`} disabled={pasada}
                          className={`sw ${s.avisos[i] ? "on" : ""}`} onClick={() => setS({ ...s, avisos: s.avisos.map((a, j) => (j === i ? !a : a)) })}><i /></button>
                      </li>
                    );
                  })}
                </ul>
                <p className="muted small">Te escribimos unos días antes de cada plazo con el tramo recomendado y cómo cambiarlo.</p>
              </section>
            )}

            {tab === "ajustes" && (
              <section className="card">
                <div className="card__h"><h2>Ajustes</h2></div>
                <div className="fld"><label htmlFor="tr">Tramo que pagas ahora</label>
                  <select id="tr" value={s.tramoActual} onChange={(e) => setS({ ...s, tramoActual: Number(e.target.value) })}>
                    {tabla.tramos.map((t) => <option key={t.n} value={t.n}>Tramo {t.n} · ≈ {cuotaMinima(t.n, tabla).toLocaleString("es-ES")} €/mes</option>)}
                  </select></div>
                <div className="fld"><label htmlFor="rg">Tipo de autónomo</label>
                  <select id="rg" value={s.regimen} onChange={(e) => setS({ ...s, regimen: e.target.value as typeof s.regimen })}>
                    <option value="persona-fisica">Persona física (deducción 7 %)</option>
                    <option value="societario">Societario (deducción 3 %)</option>
                  </select></div>
                <button className="btn btn--ghost" onClick={reset}>Restablecer datos de ejemplo</button>
                <p className="muted small">Los datos se guardan solo en este navegador.</p>
              </section>
            )}
          </div>

          <nav className="tabs" aria-label="Secciones">
            {([["resumen", "Resumen", IconHome], ["meses", "Meses", IconList], ["avisos", "Avisos", () => <Bell size={22} />], ["ajustes", "Ajustes", IconGear]] as const).map(([k, l, Ic]) => (
              <button key={k} className={tab === k ? "on" : ""} aria-current={tab === k ? "page" : undefined} onClick={() => setTab(k)}><Ic />{l}</button>
            ))}
          </nav>

          {sheet && proy && rec && (
            <div className="sheet" role="dialog" aria-modal="true" aria-label="Recomendación">
              <button className="sheet__bg" aria-label="Cerrar" onClick={() => setSheet(false)} />
              <div className="sheet__p">
                <h2>{rec.accion === "mantener" ? "Mantén tu tramo" : rec.accion === "subir" ? `Sube al tramo ${rec.objetivo}` : `Baja al tramo ${rec.objetivo}`}</h2>
                <p className="muted">
                  {rec.accion === "mantener"
                    ? `Tu tramo ${s.tramoActual} está dentro del rango previsto (${proy.tramoBajo}–${proy.tramoAlto}). No hace falta tocar nada.`
                    : rec.accion === "subir"
                      ? `Vas a cerrar el año por encima de tu tramo. Si no lo cambias, la regularización podría reclamarte unos ${eur(rec.ahorro)}.`
                      : `Vas a cerrar el año por debajo de tu tramo. Bajarlo evita pagar de más: unos ${eur(rec.ahorro)} al año.`}
                </p>
                <h3>Cómo lo hemos calculado</h3>
                <ol className="steps">
                  <li>Ingresos − gastos de {s.meses.length} meses, con la deducción genérica del {s.regimen === "societario" ? 3 : 7} %.</li>
                  <li>Proyección del resto del año según los últimos 3 meses, con un margen de ±15 %.</li>
                  <li>Rendimiento medio mensual previsto: {eur(proy.bajo)} – {eur(proy.alto)} → tramo {proy.tramoBajo === proy.tramoAlto ? proy.tramoBajo : `${proy.tramoBajo}–${proy.tramoAlto}`}.</li>
                  <li>Diferencia de cuota entre el tramo {s.tramoActual} y el {tramoPara(proy.medio, tabla)}, por 12 meses.</li>
                </ol>
                <p className="muted small">Cálculo orientativo. Tramix no hace el trámite por ti: el cambio se pide en Import@ss.</p>
                <button className="btn" onClick={() => setSheet(false)}>Entendido</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
