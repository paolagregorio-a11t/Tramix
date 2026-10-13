import { useMemo, useState } from "react";
import { Logo } from "../components/Logo";
import { Bell, IconArrow, IconCheck, IconClose, IconDownload, IconGear, IconHome, IconList, IconPlus, IconSpark } from "../components/Icons";
import { InstallSheet } from "../components/InstallSheet";
import { cuotaMinima, proximaVentana, proyectar, recomendar, rendimientoMes, tramoPara, ventanas } from "../engine/calc";
import { tablaDe } from "../engine/tramos";
import { fmt, useCountUp } from "../lib";
import { useInstall } from "../install";
import { Assistant } from "./Assistant";
import type { AssistantData } from "./assistant";
import { Ladder } from "./Ladder";
import { MonthSheet } from "./MonthSheet";
import { YieldChart } from "./YieldChart";
import { useDemoState } from "./useDemoState";
import "../styles/demo.css";

type Tab = "resumen" | "meses" | "asistente" | "avisos" | "ajustes";
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const eur = (n: number) => `${fmt(Math.round(n))} €`;
const fecha = (d: Date) => `${d.getDate()} ${MESES[d.getMonth()].toLowerCase()}`;
const buzz = () => { try { navigator.vibrate?.(8); } catch { /* not supported */ } };

function Num({ v, suffix = " €" }: { v: number; suffix?: string }) { const x = useCountUp(v); return <span className="num">{fmt(Math.round(x))}{suffix}</span>; }

export function DemoApp() {
  const [s, setS, reset] = useDemoState();
  const [tab, setTab] = useState<Tab>("resumen");
  const [edit, setEdit] = useState<number | null>(null);
  const [sheet, setSheet] = useState<"rec" | "install" | null>(null);
  const [esc, setEsc] = useState<number | null>(null);
  const install = useInstall();
  const hoy = useMemo(() => new Date(), []);
  const tabla = tablaDe(hoy.getFullYear());
  const base = useMemo(() => proyectar(s.meses, tabla, s.regimen), [s.meses, s.regimen, tabla]);
  const proy = useMemo(() => proyectar(s.meses, tabla, s.regimen, esc === null ? 0.15 : 0, esc ?? undefined), [s.meses, s.regimen, tabla, esc]);
  const rec = proy ? recomendar(s.tramoActual, proy, tabla) : null;
  const prox = proximaVentana(hoy);
  const valores = s.meses.map((m) => rendimientoMes(m, s.regimen));
  const cuotaActual = cuotaMinima(s.tramoActual, tabla);
  const cuotaObj = rec ? cuotaMinima(rec.objetivo, tabla) : cuotaActual;

  const assist: AssistantData = { tabla, tramoActual: s.tramoActual, proy: base, rec: base ? recomendar(s.tramoActual, base, tabla) : null, dias: prox.dias, limite: fecha(prox.ventana.limite), efecto: fecha(prox.ventana.efecto), meses: s.meses.length };
  const ctx = base && assist.rec ? { tramoActual: s.tramoActual, cuotaActual, tramoBajo: base.tramoBajo, tramoAlto: base.tramoAlto, rendimientoMedio: base.medio, meses: s.meses.length, accion: assist.rec.accion, objetivo: assist.rec.objetivo, ahorro: assist.rec.ahorro, dias: prox.dias, limite: assist.limite } : {};

  function saveMes(i: number, m: { ingresos: number; gastos: number }) {
    setS({ ...s, meses: i >= s.meses.length ? [...s.meses, m] : s.meses.map((x, j) => (j === i ? m : x)) });
    setEdit(null); buzz();
  }

  const heroRange = proy ? (proy.tramoBajo === proy.tramoAlto ? `${proy.tramoBajo}` : `${proy.tramoBajo}–${proy.tramoAlto}`) : "–";
  const estadoTxt = tabla.estado === "verificada-boe" ? "Tabla de tramos verificada con el BOE." : tabla.estado === "contrastada" ? "Tabla de tramos 2026 (Orden PJC/297/2026) contrastada entre fuentes." : "Cifras de tramos de ejemplo.";

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
          <p>Toca el gráfico, mueve el simulador, edita un mes o pregunta al asistente. Todo se calcula al momento, en tu navegador.</p>
          <ul>
            <li><IconCheck /> Proyección siempre en rango, nunca una cifra inventada</li>
            <li><IconCheck /> Cálculo desglosado paso a paso</li>
            <li><IconCheck /> Aviso antes de cada plazo de cambio</li>
          </ul>
          {!install.standalone && <button className="btn dm__install" onClick={() => setSheet("install")}><IconDownload /> Instalar en tu móvil</button>}
          <p className="dm__warn">{estadoTxt} Este cálculo es orientativo y no es asesoramiento fiscal.</p>
        </aside>

        <div className="device">
          <div className="device__island" aria-hidden="true" />
          <div className="app" role="application" aria-label="Demo de la app Tramix">
            <div className="statusbar" aria-hidden="true"><b>9:41</b><span><i className="sb-sig" /><i className="sb-wifi" /><i className="sb-bat" /></span></div>
            <header className="app__head">
              <Logo size={22} tone="dark" />
              <div className="app__head-r">
                {!install.standalone && <button className="pillbtn" onClick={() => setSheet("install")}><IconDownload size={14} /> Instalar</button>}
                <span className="app__year">{hoy.getFullYear()}</span>
              </div>
            </header>

            <div className="app__body" key={tab}>
              {tab === "resumen" && proy && rec && (<>
                <section className="dh">
                  <div className="dh__row">
                    <div><small>Previsión de cierre {hoy.getFullYear()}</small><strong className="dh__big">Tramo {heroRange}</strong></div>
                    <span className={`chip ${rec.accion === "mantener" ? "chip--ok" : "chip--warn"}`}>{rec.accion === "mantener" ? "En el rango" : rec.accion === "subir" ? "Pagas de menos" : "Pagas de más"}</span>
                  </div>
                  <Ladder actual={s.tramoActual} bajo={proy.tramoBajo} alto={proy.tramoAlto} />
                  <div className="dh__stats">
                    <div><small>Pagas ahora</small><b><Num v={cuotaActual} /><em>/mes</em></b></div>
                    <div><small>{rec.accion === "mantener" ? "Seguirías en" : "Recomendado"}</small><b><Num v={cuotaObj} /><em>/mes</em></b></div>
                  </div>
                </section>

                <section className={`next ${rec.accion === "mantener" ? "" : "next--act"}`}>
                  <div className="ring" aria-hidden="true">
                    <svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="19" /><circle cx="22" cy="22" r="19" className="ring__v" style={{ strokeDashoffset: 119.4 * (1 - Math.max(0.04, 1 - prox.dias / 62)) }} /></svg>
                    <b>{prox.dias}</b><span>días</span>
                  </div>
                  <div className="next__t"><h2>Plazo: {fecha(prox.ventana.limite)}</h2>
                    <p>{rec.accion === "mantener" ? "No hace falta tocar nada ahora." : `Pide ${rec.accion === "subir" ? "subir" : "bajar"} al tramo ${rec.objetivo}. Efecto el ${fecha(prox.ventana.efecto)}.`}</p></div>
                  <button className="btn next__go" onClick={() => setSheet("rec")}>{rec.accion === "mantener" ? "Ver cálculo" : "Qué hacer"}</button>
                </section>

                {rec.accion !== "mantener" && (
                  <section className="impact">
                    <div><small>{rec.accion === "subir" ? "Si no cambias" : "Si no cambias, pagas de más"}</small><b className={rec.accion === "subir" ? "bad" : ""}>≈ <Num v={rec.ahorro} /></b><span>{rec.accion === "subir" ? "en la regularización" : "al año"}</span></div>
                    <div><small>Si cambias</small><b className="good">≈ <Num v={0} /></b><span>de diferencia</span></div>
                  </section>
                )}

                <section className="card">
                  <div className="card__h"><h2>Tu año, mes a mes</h2><small>€ computables</small></div>
                  <YieldChart valores={valores} proy={proy} tramos={tabla.tramos} banda={esc === null ? 0.15 : 0} />
                  <p className="legend"><i /> Registrado <i className="proj" /> Previsto</p>
                </section>

                <section className="card sim">
                  <div className="card__h"><h2>Simulador</h2>{esc !== null && <button className="linkbtn" onClick={() => setEsc(null)}>Volver a mi tendencia</button>}</div>
                  <p className="muted">¿Y si el resto del año tu rendimiento fuera…?</p>
                  <div className="slider"><div className="slider__top"><label htmlFor="sim">Rendimiento mensual</label><b className="num">{eur(esc ?? proy.restante)}</b></div>
                    <input id="sim" type="range" min={0} max={7000} step={50} value={Math.round(esc ?? proy.restante)} onChange={(e) => setEsc(Number(e.target.value))} style={{ ["--p" as string]: `${(Math.round(esc ?? proy.restante) / 7000) * 100}%` }} /></div>
                  <p className="sim__out">Cerrarías el año en el <b>tramo {heroRange}</b>{rec.accion === "mantener" ? " y tu tramo actual encaja." : <> y te convendría <b>{rec.accion === "subir" ? "subir" : "bajar"} al {rec.objetivo}</b>.</>}</p>
                </section>
              </>)}
              {tab === "resumen" && !proy && <div className="empty"><h2>Aún no hay datos</h2><p className="muted">Añade tu primer mes para ver la proyección.</p><button className="btn" onClick={() => { setTab("meses"); setEdit(0); }}>Añadir un mes</button></div>}

              {tab === "meses" && (<section className="card">
                <div className="card__h"><h2>Tus meses</h2><small>Toca uno para editarlo</small></div>
                <ul className="mlist">
                  {s.meses.map((m, i) => { const v = valores[i]; const mx = Math.max(...valores, 1); return (
                    <li key={i}><button onClick={() => setEdit(i)}>
                      <b>{MESES[i]}</b><span className="mlist__bar"><i style={{ width: `${(v / mx) * 100}%` }} /></span>
                      <span className="mlist__v"><b className="num">{eur(v)}</b><small>{eur(m.ingresos)} − {eur(m.gastos)}</small></span></button></li>); })}
                </ul>
                {s.meses.length < 12 && <button className="btn btn--soft add" onClick={() => setEdit(s.meses.length)}><IconPlus /> Añadir {MESES[s.meses.length].toLowerCase()}</button>}
                <p className="muted small">Computable = (ingresos − gastos) menos la deducción genérica del {s.regimen === "societario" ? 3 : 7} %.</p>
              </section>)}

              {tab === "asistente" && <Assistant data={assist} context={ctx} />}

              {tab === "avisos" && (<section className="card">
                <div className="card__h"><h2>Ventanas de cambio</h2><small>Hasta 6 al año</small></div>
                <ul className="wins">
                  {ventanas(hoy.getFullYear()).map((v, i) => {
                    const pasada = v.limite < new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
                    const es = !pasada && v.limite.getTime() === prox.ventana.limite.getTime();
                    return (<li key={i} className={pasada ? "past" : es ? "next" : ""}>
                      <div><b>Pedir antes del {fecha(v.limite)}</b><small>Efecto el {fecha(v.efecto)}{pasada ? " · pasada" : es ? " · próxima" : ""}</small></div>
                      <button type="button" role="switch" aria-checked={s.avisos[i]} aria-label={`Aviso por email, ventana ${i + 1}`} disabled={pasada} className={`sw ${s.avisos[i] ? "on" : ""}`}
                        onClick={() => { setS({ ...s, avisos: s.avisos.map((a, j) => (j === i ? !a : a)) }); buzz(); }}><i /></button></li>);
                  })}
                </ul>
                <p className="muted small">Te escribimos unos días antes de cada plazo con el tramo recomendado y cómo cambiarlo.</p>
              </section>)}

              {tab === "ajustes" && (<section className="card">
                <div className="card__h"><h2>Ajustes</h2></div>
                <div className="fld"><label htmlFor="tr">Tramo que pagas ahora</label>
                  <select id="tr" value={s.tramoActual} onChange={(e) => setS({ ...s, tramoActual: Number(e.target.value) })}>
                    {tabla.tramos.map((t) => <option key={t.n} value={t.n}>Tramo {t.n} · ≈ {fmt(Math.round(cuotaMinima(t.n, tabla)))} €/mes</option>)}</select></div>
                <div className="fld"><label htmlFor="rg">Tipo de autónomo</label>
                  <select id="rg" value={s.regimen} onChange={(e) => setS({ ...s, regimen: e.target.value as typeof s.regimen })}>
                    <option value="persona-fisica">Persona física (deducción 7 %)</option><option value="societario">Societario (deducción 3 %)</option></select></div>
                {!install.standalone && <button className="btn btn--soft" onClick={() => setSheet("install")}><IconDownload /> Instalar en tu móvil</button>}
                <button className="btn btn--ghost" onClick={() => { reset(); setEsc(null); }}>Restablecer datos de ejemplo</button>
                <p className="muted small">{estadoTxt} Tus datos se guardan solo en este navegador.</p>
              </section>)}
            </div>

            <nav className="tabs" aria-label="Secciones">
              {([["resumen", "Resumen", IconHome], ["meses", "Meses", IconList], ["asistente", "Asistente", IconSpark], ["avisos", "Avisos", () => <Bell size={22} />], ["ajustes", "Ajustes", IconGear]] as const).map(([k, l, Ic]) => (
                <button key={k} className={tab === k ? "on" : ""} aria-current={tab === k ? "page" : undefined} onClick={() => { setTab(k); buzz(); }}><Ic />{l}</button>))}
            </nav>

            {edit !== null && <MonthSheet key={edit} nombre={MESES[edit]} esNuevo={edit >= s.meses.length} esUltimo={edit === s.meses.length - 1}
              inicial={s.meses[edit] ?? s.meses[s.meses.length - 1] ?? { ingresos: 2000, gastos: 300 }} regimen={s.regimen}
              onSave={(m) => saveMes(edit, m)} onDelete={() => { setS({ ...s, meses: s.meses.slice(0, -1) }); setEdit(null); }} onClose={() => setEdit(null)} />}

            {sheet === "rec" && proy && rec && (
              <div className="sheet" role="dialog" aria-modal="true" aria-label="Recomendación">
                <button className="sheet__bg" aria-label="Cerrar" onClick={() => setSheet(null)} />
                <div className="sheet__p">
                  <div className="sheet__h"><h2>{rec.accion === "mantener" ? "Mantén tu tramo" : rec.accion === "subir" ? `Sube al tramo ${rec.objetivo}` : `Baja al tramo ${rec.objetivo}`}</h2><button className="iconbtn" aria-label="Cerrar" onClick={() => setSheet(null)}><IconClose /></button></div>
                  <p className="muted">{rec.accion === "mantener" ? `Tu tramo ${s.tramoActual} está dentro del rango previsto. No hace falta tocar nada.`
                    : rec.accion === "subir" ? `Vas a cerrar el año por encima de tu tramo. Si no lo cambias, la regularización podría reclamarte unos ${eur(rec.ahorro)}.`
                      : `Vas a cerrar el año por debajo de tu tramo. Bajarlo evita pagar de más: unos ${eur(rec.ahorro)} al año.`}</p>
                  <h3>Cómo lo hemos calculado</h3>
                  <ol className="steps">
                    <li>Ingresos − gastos de {s.meses.length} meses, con la deducción genérica del {s.regimen === "societario" ? 3 : 7} %.</li>
                    <li>{esc === null ? "Resto del año según tus últimos 3 meses, con margen de ±15 %." : `Resto del año según tu simulación: ${eur(esc)} al mes.`}</li>
                    <li>Rendimiento medio previsto: {eur(proy.bajo)} – {eur(proy.alto)} al mes → tramo {heroRange}.</li>
                    <li>Cuota del tramo {s.tramoActual}: ≈ {eur(cuotaActual)}. Cuota del tramo {tramoPara(proy.medio, tabla)}: ≈ {eur(cuotaMinima(tramoPara(proy.medio, tabla), tabla))}. Diferencia por 12 meses.</li>
                  </ol>
                  <p className="muted small">Cálculo orientativo. Tramix no hace el trámite por ti: el cambio se pide en Import@ss.</p>
                  <button className="btn" onClick={() => setSheet(null)}>Entendido</button>
                </div>
              </div>)}
          </div>
        </div>
      </div>
      {sheet === "install" && <InstallSheet onClose={() => setSheet(null)} />}
    </div>
  );
}
