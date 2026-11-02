import { useEffect, useState } from "react";
import { cuotaMaxima, cuotaMinima, proximaVentana, regularizacion, tablaOficial, tramoPara, ventanasDelAno } from "../engine/calc";
import { TABLA_2026 } from "../engine/tramos";
import { href } from "../router";
import { IMPORTES, cuotaXPath, type RouteDef } from "../routes";
import { CuotaCalculator } from "./CuotaCalculator";
import { faqFor } from "./faq";
import { eur0, eur2, num0 } from "./format";
import { Faq, SeoShell, Source } from "./SeoShell";
import { TramosTable, rango } from "./TramosTable";

const T = TABLA_2026, Y = T.year;
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const fecha = (d: Date) => `${d.getDate()} de ${MESES[d.getMonth()]}`;

function Hero({ h1, lead, children }: { h1: string; lead: string; children?: React.ReactNode }) {
  return (
    <section className="sp__hero">
      <div className="container sp__hero-in">
        <div><h1>{h1}</h1><p className="sp__lead">{lead}</p></div>
        {children && <div className="sp__hero-tool">{children}</div>}
      </div>
    </section>
  );
}

function AmountLinks({ current }: { current?: number }) {
  return (
    <nav className="amounts" aria-label="Cuota según lo que ganas">
      {IMPORTES.map((x) => x === current ? <span key={x} aria-current="page">{num0(x)}{"\u00a0"}€</span> : <a key={x} href={href(cuotaXPath(x))}>{num0(x)}{"\u00a0"}€</a>)}
    </nav>
  );
}

export function CuotaPage({ route }: { route: RouteDef }) {
  return (
    <SeoShell route={route}>
      <Hero h1={`Calculadora de cuota de autónomo ${Y}`} lead="Escribe tu rendimiento neto mensual, o tus ingresos y gastos, y ve al instante tu tramo, tu base de cotización y lo que pagarás cada mes. Con la tabla oficial del BOE, sin registro.">
        <CuotaCalculator id="calc-main" />
      </Hero>
      <div className="container sp__body">
        <section className="sp__sec" aria-labelledby="como">
          <h2 id="como">Cómo se calcula tu cuota</h2>
          <ol className="steps2">
            <li><b>Rendimiento neto.</b> Tus ingresos menos tus gastos deducibles (sin contar tu propia cuota de autónomo), menos una deducción genérica del 7 % (3 % si eres societario).</li>
            <li><b>Tramo.</b> Ese rendimiento mensual te coloca en uno de los 15 tramos de {Y}.</li>
            <li><b>Base.</b> Dentro de tu tramo eliges una base de cotización entre la mínima y la máxima.</li>
            <li><b>Cuota.</b> Pagas el 31,5 % de esa base cada mes.</li>
          </ol>
        </section>
        <section className="sp__sec" aria-labelledby="importes">
          <h2 id="importes">Cuota de autónomo según lo que ganas</h2>
          <p>Elige tu rendimiento neto mensual para ver tu tramo, tus bases, la cuota anual y qué pasaría en la regularización.</p>
          <AmountLinks />
        </section>
        <section className="sp__sec" aria-labelledby="tabla">
          <h2 id="tabla">Tabla de tramos {Y}</h2>
          <TramosTable /><Source />
        </section>
        <Faq items={faqFor(route)} />
      </div>
    </SeoShell>
  );
}

export function CuotaXPage({ route }: { route: RouteDef }) {
  const x = route.x!, n = tramoPara(x, T), of = tablaOficial(n), tr = T.tramos[n - 1];
  const prevH = n > 1 ? T.tramos[n - 2].hasta : 0;
  const haciaArriba = tr.hasta === Infinity ? null : tr.hasta - x;
  const haciaAbajo = n > 1 ? x - prevH : null;
  const ejemplos = [n - 1, n - 2, 1].filter((k, i, a) => k >= 1 && k < n && a.indexOf(k) === i).map((k) => ({ k, r: regularizacion(T.tramos[k - 1].baseMin, x, T) }));
  const idx = IMPORTES.indexOf(x);
  const vecinos = [IMPORTES[idx - 1], IMPORTES[idx + 1]].filter(Boolean);
  return (
    <SeoShell route={route}>
      <Hero h1={`Cuota de autónomo si ganas ${eur0(x)} al mes (${Y})`} lead={`Con un rendimiento neto de ${eur0(x)} al mes estás en el tramo ${n}: pagarás entre ${eur2(cuotaMinima(n, T))} y ${eur2(cuotaMaxima(n, T))} al mes, según la base que elijas.`}>
        <div className="kpis">
          <div className="kpi kpi--main"><small>Tu tramo</small><b>Tramo {n}</b><span>Tabla {of.tabla} · tramo {of.n}</span></div>
          <div className="kpi"><small>Cuota mínima</small><b>{eur2(cuotaMinima(n, T))}</b><span>al mes</span></div>
          <div className="kpi"><small>Cuota máxima</small><b>{eur2(cuotaMaxima(n, T))}</b><span>al mes</span></div>
          <div className="kpi"><small>Al año (mínima)</small><b>{eur0(cuotaMinima(n, T) * 12)}</b><span>12 cuotas</span></div>
        </div>
      </Hero>
      <div className="container sp__body">
        <section className="sp__sec" aria-labelledby="detalle">
          <h2 id="detalle">Tu tramo en detalle</h2>
          <table className="kv"><tbody>
            <tr><th scope="row">Rendimientos del tramo {n}</th><td>{rango(n - 1)} al mes</td></tr>
            <tr><th scope="row">Base mínima</th><td>{eur2(tr.baseMin)} al mes</td></tr>
            <tr><th scope="row">Base máxima</th><td>{eur2(tr.baseMax)} al mes</td></tr>
            <tr><th scope="row">Tipo de cotización</th><td>31,5 % de la base</td></tr>
            <tr><th scope="row">Cuota con base mínima</th><td>{eur2(cuotaMinima(n, T))} al mes · {eur2(cuotaMinima(n, T) * 12)} al año</td></tr>
          </tbody></table>
          <p>
            {haciaArriba !== null && <>Te faltan <b>{eur0(haciaArriba)}</b> de rendimiento al mes para pasar al tramo {n + 1}, donde la cuota mínima sube a {eur2(cuotaMinima(n + 1, T))}. </>}
            {haciaAbajo !== null && <>Si ganaras <b>{eur0(haciaAbajo)}</b> menos al mes bajarías al tramo {n - 1}.</>}
          </p>
        </section>
        {ejemplos.length > 0 && (
          <section className="sp__sec" aria-labelledby="reg">
            <h2 id="reg">¿Qué pasa si cotizas por un tramo más bajo?</h2>
            <p>Si al final del año tu rendimiento medio es de {eur0(x)} al mes pero has cotizado por la base mínima de un tramo inferior, la Seguridad Social te reclamará la diferencia en la regularización:</p>
            <table className="kv"><tbody>{ejemplos.map(({ k, r }) => <tr key={k}><th scope="row">Si pagas el tramo {k} ({eur2(cuotaMinima(k, T))}/mes)</th><td>te reclamarían unos <b>{eur2(r.importe)}</b></td></tr>)}</tbody></table>
            <p><a href={href("/regularizacion-cuota-autonomos")}>Calcula tu regularización con tus cifras →</a></p>
          </section>
        )}
        <section className="sp__sec" aria-labelledby="calc2">
          <h2 id="calc2">Prueba con otra cifra</h2>
          <CuotaCalculator initial={x} id="calc-x" />
        </section>
        <section className="sp__sec" aria-labelledby="vecinos">
          <h2 id="vecinos">Cuotas para cantidades cercanas</h2>
          <div className="near">{vecinos.map((v) => { const k = tramoPara(v, T); return <a key={v} href={href(cuotaXPath(v))}><b>{eur0(v)} al mes</b><span>Tramo {k} · desde {eur2(cuotaMinima(k, T))}</span></a>; })}</div>
          <AmountLinks current={x} />
        </section>
        <Faq items={faqFor(route)} title={`Preguntas frecuentes para ${eur0(x)} al mes`} />
        <Source />
      </div>
    </SeoShell>
  );
}

export function TramosPage({ route }: { route: RouteDef }) {
  return (
    <SeoShell route={route}>
      <Hero h1={`Tramos de autónomos ${Y}: tabla oficial`} lead={`Los 15 tramos de cotización de ${Y}, con su base mínima, su base máxima y la cuota mensual resultante, tal como los publica el BOE.`} />
      <div className="container sp__body">
        <section className="sp__sec" aria-labelledby="tabla"><h2 id="tabla">Tabla completa de tramos {Y}</h2><TramosTable /><Source /></section>
        <section className="sp__sec" aria-labelledby="tipos">
          <h2 id="tipos">De dónde sale el 31,5 %</h2>
          <table className="kv"><tbody>
            <tr><th scope="row">Contingencias comunes</th><td>28,30 %</td></tr>
            <tr><th scope="row">Contingencias profesionales</th><td>1,30 %</td></tr>
            <tr><th scope="row">Mecanismo de equidad intergeneracional (MEI)</th><td>0,90 %</td></tr>
            <tr><th scope="row">Cese de actividad</th><td>0,90 %</td></tr>
            <tr><th scope="row">Formación profesional</th><td>0,10 %</td></tr>
            <tr><th scope="row"><b>Total</b></th><td><b>31,50 %</b></td></tr>
          </tbody></table>
          <p className="sp__src">Arts. 18.2 y 37.5–6 de la Orden PJC/297/2026.</p>
        </section>
        <section className="sp__sec" aria-labelledby="tablas">
          <h2 id="tablas">Tabla reducida y tabla general</h2>
          <p>El BOE divide los tramos en dos tablas. La <b>tabla reducida</b> agrupa los tres primeros tramos, para rendimientos de hasta 1.166,70 € al mes, con bases más bajas. La <b>tabla general</b> tiene doce tramos a partir de ahí. En Cuotio los numeramos del 1 al 15 seguidos, indicando siempre a qué tramo oficial corresponde.</p>
          <p><a href={href("/cuota-autonomo")}>Calcula en qué tramo estás →</a></p>
        </section>
        <Faq items={faqFor(route)} />
      </div>
    </SeoShell>
  );
}

export function RegularizacionPage({ route }: { route: RouteDef }) {
  const [real, setReal] = useState("2200");
  const [tramo, setTramo] = useState(5);
  const rv = Math.max(0, Number(real.replace(/\./g, "").replace(",", ".")) || 0);
  const pagada = T.tramos[tramo - 1].baseMin;
  const r = regularizacion(pagada, rv, T);
  return (
    <SeoShell route={route}>
      <Hero h1="Regularización de la cuota de autónomos: ¿te toca pagar o te devuelven?" lead="La Seguridad Social compara lo que cotizaste con lo que ganaste de verdad. Calcula en segundos si te reclamarán dinero o te lo devolverán.">
        <div className="calc">
          <div className="calc__f"><label htmlFor="rg-real">Rendimiento neto mensual real del año</label><div className="calc__in"><input id="rg-real" inputMode="decimal" value={real} onChange={(e) => setReal(e.target.value)} /><span>€/mes</span></div></div>
          <div className="calc__f"><label htmlFor="rg-tramo">Tramo por el que has cotizado (base mínima)</label>
            <select id="rg-tramo" value={tramo} onChange={(e) => setTramo(Number(e.target.value))}>{T.tramos.map((t) => <option key={t.n} value={t.n}>Tramo {t.n} · base {eur2(t.baseMin)} · {eur2(cuotaMinima(t.n, T))}/mes</option>)}</select></div>
          <output className={`calc__out reg reg--${r.resultado}`} htmlFor="rg-real rg-tramo" aria-live="polite">
            <div className="calc__big"><small>Resultado estimado del año</small>
              <b>{r.resultado === "pagar" ? `Te reclamarían ${eur2(r.importe)}` : r.resultado === "devolver" ? `Te devolverían ${eur2(r.importe)}` : "Ni pagas ni te devuelven"}</b>
              <span>Tu tramo real es el {r.tramoReal}: base de {eur2(T.tramos[r.tramoReal - 1].baseMin)} a {eur2(T.tramos[r.tramoReal - 1].baseMax)}</span></div>
          </output>
          <p className="calc__note">Cálculo anual orientativo con una base constante todo el año.</p>
        </div>
      </Hero>
      <div className="container sp__body">
        <section className="sp__sec" aria-labelledby="como">
          <h2 id="como">Cómo funciona la regularización</h2>
          <ol className="steps2">
            <li><b>Durante el año</b> cotizas por la base que elegiste según tu previsión de ingresos.</li>
            <li><b>Después,</b> Hacienda comunica a la Seguridad Social tus rendimientos netos reales de ese año.</li>
            <li><b>Si tu base fue menor</b> que la base mínima del tramo que te correspondía, te reclaman la diferencia.</li>
            <li><b>Si tu base fue mayor</b> que la base máxima de ese tramo, te devuelven el exceso. Si estaba dentro de sus límites, no hay ajuste.</li>
          </ol>
        </section>
        <section className="sp__sec" aria-labelledby="evitar">
          <h2 id="evitar">Cómo evitar la sorpresa</h2>
          <p>La regularización solo asusta si llega por sorpresa. Puedes cambiar tu base hasta seis veces al año: si revisas tus ingresos y ajustas a tiempo, la diferencia final se queda en casi nada. <a href={href("/cambio-base-cotizacion")}>Consulta las fechas de {Y}</a>.</p>
          <p>Eso es lo que hace Cuotio por ti: sigue tus ingresos, proyecta tu cierre de año y te avisa antes de cada plazo con el tramo recomendado.</p>
        </section>
        <Faq items={faqFor(route)} />
        <Source />
      </div>
    </SeoShell>
  );
}

export function CambioBasePage({ route }: { route: RouteDef }) {
  const [hoy, setHoy] = useState<Date | null>(null);
  useEffect(() => setHoy(new Date()), []);
  const year = hoy?.getFullYear() ?? Y;
  const prox = hoy ? proximaVentana(hoy) : null;
  return (
    <SeoShell route={route}>
      <Hero h1={`Cambio de base de cotización de autónomos ${year}: las 6 fechas`} lead="Puedes cambiar tu base de cotización hasta seis veces al año. Estas son las fechas límite y el día en que tiene efecto cada cambio.">
        {prox && (
          <div className="kpis">
            <div className="kpi kpi--main"><small>Próximo plazo</small><b>{fecha(prox.ventana.limite)}</b><span>quedan {prox.dias} días</span></div>
            <div className="kpi"><small>Tiene efecto el</small><b>{fecha(prox.ventana.efecto)}</b><span>{prox.ventana.efecto.getFullYear()}</span></div>
          </div>
        )}
      </Hero>
      <div className="container sp__body">
        <section className="sp__sec" aria-labelledby="fechas">
          <h2 id="fechas">Plazos de {year}</h2>
          <div className="tt__wrap"><table className="tt">
            <thead><tr><th scope="col">Si lo pides entre…</th><th scope="col">Tiene efecto el</th></tr></thead>
            <tbody>{ventanasDelAno(year).map((v, i) => { const ini = new Date(v.limite.getFullYear(), v.limite.getMonth() - 1, 1); return (
              <tr key={i} className={prox && v.limite.getTime() === prox.ventana.limite.getTime() ? "hl" : ""}><td>1 de {MESES[ini.getMonth()]} y {fecha(v.limite)}</td><td>1 de {MESES[v.efecto.getMonth()]}{v.efecto.getFullYear() !== v.limite.getFullYear() ? ` de ${v.efecto.getFullYear()}` : ""}</td></tr>); })}</tbody>
          </table></div>
          <p className="sp__src">Art. 45 del Reglamento general de inscripción, modificado por el Real Decreto-ley 13/2022.</p>
        </section>
        <section className="sp__sec" aria-labelledby="pasos">
          <h2 id="pasos">Cómo pedir el cambio</h2>
          <ol className="steps2">
            <li>Entra en <b>Import@ss</b>, el portal de la Seguridad Social, con certificado digital o Cl@ve.</li>
            <li>Busca la opción de cambio de base de cotización del régimen de autónomos.</li>
            <li>Elige la nueva base dentro del tramo que te corresponda e indica tu previsión de rendimientos.</li>
            <li>Confirma. El cambio tendrá efecto en la fecha de la tabla.</li>
          </ol>
          <p>¿No sabes qué base elegir? <a href={href("/cuota-autonomo")}>Calcula tu tramo</a> o <a href={href("/regularizacion-cuota-autonomos")}>mira qué pasaría en la regularización</a>.</p>
        </section>
        <Faq items={faqFor(route)} />
      </div>
    </SeoShell>
  );
}
