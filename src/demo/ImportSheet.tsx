import { useState } from "react";
import type { Factura } from "../../api/extract";
import { IconCheck, IconClose } from "../components/Icons";
import type { Month } from "../engine/calc";
import { leerArchivo, leerMovimientos, parseCsv, resumir, type Movimiento } from "../import/bank";
import { SAMPLE_FACTURAS } from "../import/samples";
import { eur2 } from "../pages/format";
import { PREVIEW } from "../router";
import sampleCsv from "../../public/demo/extracto-ejemplo.csv?raw";

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const API = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";

type Props = { meses: Month[]; year: number; onApply: (m: Month[]) => void; onClose: () => void };

/** Writes values into months, extending the year with empty months if needed. */
function conMeses(meses: Month[], cambios: { mes: number; f: (m: Month) => Month }[]): Month[] {
  const out = meses.map((m) => ({ ...m }));
  for (const { mes, f } of cambios) { while (out.length <= mes) out.push({ ingresos: 0, gastos: 0 }); out[mes] = f(out[mes]); }
  return out;
}

export function ImportSheet({ meses, year, onApply, onClose }: Props) {
  const [tab, setTab] = useState<"banco" | "factura">("banco");
  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label="Subir documento">
      <button className="sheet__bg" aria-label="Cerrar" onClick={onClose} />
      <div className="sheet__p">
        <div className="sheet__h"><h2>Subir documento</h2><button className="iconbtn" aria-label="Cerrar" onClick={onClose}><IconClose /></button></div>
        <div className="seg seg--2" role="tablist" aria-label="Tipo de documento">
          <button type="button" role="tab" aria-selected={tab === "banco"} className={tab === "banco" ? "on" : ""} onClick={() => setTab("banco")}>Extracto del banco</button>
          <button type="button" role="tab" aria-selected={tab === "factura"} className={tab === "factura" ? "on" : ""} onClick={() => setTab("factura")}>Factura</button>
        </div>
        {tab === "banco" ? <Banco meses={meses} year={year} onApply={onApply} /> : <FacturaTab meses={meses} year={year} onApply={onApply} />}
      </div>
    </div>
  );
}

function Banco({ meses, year, onApply }: Omit<Props, "onClose">) {
  const [movs, setMovs] = useState<Movimiento[] | null>(null);
  const [err, setErr] = useState("");
  const [ver, setVer] = useState(false);
  const [hecho, setHecho] = useState(false);
  async function cargar(f: File) { setErr(""); setHecho(false); try { setMovs(await leerArchivo(f)); } catch (e) { setMovs(null); setErr(e instanceof Error ? e.message : "No he podido leer el archivo."); } }
  function ejemplo() { setErr(""); setHecho(false); setMovs(leerMovimientos(parseCsv(sampleCsv))); }
  const res = movs ? resumir(movs) : [];
  const delAno = res.filter((r) => r.year === year), otros = res.length - delAno.length;

  if (hecho) return <div className="imp__ok"><span className="wl-check"><IconCheck size={14} /></span> Listo: {delAno.length} {delAno.length === 1 ? "mes actualizado" : "meses actualizados"}. Mira el resumen para ver tu nueva proyección.</div>;
  return (<>
    <p className="muted">Descarga los movimientos desde tu banco (CSV o Excel) y súbelos. <b>Se leen en tu dispositivo: el archivo no se envía a ningún servidor.</b></p>
    <label className="drop"><input type="file" accept=".csv,.txt,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(e) => e.target.files?.[0] && cargar(e.target.files[0])} />
      <b>Elegir archivo</b><span>CSV, XLSX o XLS · máximo 5 MB</span></label>
    <button type="button" className="linkbtn" onClick={ejemplo}>Probar con un extracto de ejemplo</button>
    {err && <p role="alert" className="fb__err">{err}</p>}
    {movs && (<>
      <table className="imp__t"><thead><tr><th>Mes</th><th>Ingresos</th><th>Gastos</th></tr></thead>
        <tbody>{res.map((r) => <tr key={`${r.year}-${r.mes}`} className={r.year !== year ? "otro" : ""}><td>{MESES[r.mes]}{r.year !== year ? ` ${r.year}` : ""}</td><td>{eur2(r.ingresos)}</td><td>{eur2(r.gastos)}</td></tr>)}</tbody></table>
      {movs.some((m) => !m.incluir) && <p className="muted small">He dejado fuera {movs.filter((m) => !m.incluir).length} pagos de tu cuota de autónomo: no cuentan como gasto para calcular tu tramo.</p>}
      {otros > 0 && <p className="muted small">{otros} {otros === 1 ? "mes es" : "meses son"} de otro año y no se usarán.</p>}
      <button type="button" className="linkbtn" onClick={() => setVer(!ver)}>{ver ? "Ocultar" : "Revisar"} los {movs.length} movimientos</button>
      {ver && (
        <ul className="imp__movs">{movs.map((m, i) => (
          <li key={i} className={m.incluir ? "" : "off"}><label>
            <input type="checkbox" checked={m.incluir} onChange={() => setMovs(movs.map((x, j) => (j === i ? { ...x, incluir: !x.incluir } : x)))} />
            <span><b>{m.concepto}</b><small>{m.fecha.toLocaleDateString("es-ES")}{m.motivo ? ` · ${m.motivo}` : ""}</small></span>
            <em className={m.importe > 0 ? "in" : ""}>{eur2(m.importe)}</em></label></li>))}</ul>
      )}
      <button className="btn" disabled={!delAno.length} onClick={() => { onApply(conMeses(meses, delAno.map((r) => ({ mes: r.mes, f: () => ({ ingresos: r.ingresos, gastos: r.gastos }) })))); setHecho(true); }}>
        {delAno.length ? `Usar estos datos (${delAno.map((r) => MESES[r.mes].slice(0, 3).toLowerCase()).join(", ")})` : "No hay meses de este año"}</button>
      <p className="muted small">Sustituye los ingresos y gastos de esos meses por los del extracto.</p>
    </>)}
  </>);
}

async function aBase64(f: Blob): Promise<string> {
  const buf = new Uint8Array(await f.arrayBuffer()); let s = "";
  for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return btoa(s);
}
/** Large photos are scaled down in the browser before upload (faster, and under the size limit). */
async function preparar(f: File): Promise<{ mime: string; blob: Blob }> {
  if (!f.type.startsWith("image/") || /hei[cf]/.test(f.type) || f.size < 1.5 * 1024 * 1024) return { mime: f.type || "application/pdf", blob: f };
  const img = await createImageBitmap(f); const k = Math.min(1, 1800 / Math.max(img.width, img.height));
  const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  const blob = await new Promise<Blob>((ok) => c.toBlob((b) => ok(b!), "image/jpeg", 0.85));
  return { mime: "image/jpeg", blob };
}

function FacturaTab({ meses, year, onApply }: Omit<Props, "onClose">) {
  const [ok, setOk] = useState(false);
  const [st, setSt] = useState<"idle" | "leyendo" | "listo" | "error" | "hecho">("idle");
  const [err, setErr] = useState("");
  const [f, setF] = useState<Factura | null>(null);
  const [tipo, setTipo] = useState<"ingreso" | "gasto">("ingreso");
  const [mes, setMes] = useState(Math.max(0, meses.length - 1));

  function mostrar(fx: Factura) {
    setF(fx); setTipo(fx.tipo === "gasto" ? "gasto" : "ingreso");
    const d = fx.fecha ? new Date(fx.fecha) : null; setMes(d && d.getFullYear() === year ? d.getMonth() : Math.max(0, meses.length - 1)); setSt("listo");
  }
  async function leer(blob: Blob, mime: string) {
    setSt("leyendo"); setErr("");
    try {
      if (blob.size > 3.2 * 1024 * 1024) throw new Error("El archivo es demasiado grande (máximo 3 MB). Prueba con una foto o un PDF más ligero.");
      const res = await fetch(`${API}/api/extract`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mime, data: await aBase64(blob) }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.factura) throw new Error(j.error || "No he podido leer la factura. Inténtalo de nuevo.");
      mostrar(j.factura);
    } catch (e) { setErr(e instanceof Error && e.message !== "Failed to fetch" ? e.message : "No hay conexión con el servidor."); setSt("error"); }
  }
  async function subir(file: File) { const p = await preparar(file); await leer(p.blob, p.mime); }
  async function ejemplo(k: "ingreso" | "gasto") {
    const s = SAMPLE_FACTURAS[k];
    if (PREVIEW) { setSt("leyendo"); setTimeout(() => mostrar(s.factura), 900); return; }
    try { const r = await fetch(s.file); await leer(await r.blob(), "application/pdf"); } catch { setErr("No he podido cargar el ejemplo."); setSt("error"); }
  }

  if (st === "hecho") return <div className="imp__ok"><span className="wl-check"><IconCheck size={14} /></span> Añadido a {tipo === "ingreso" ? "ingresos" : "gastos"} de {MESES[mes].toLowerCase()}. <button type="button" className="linkbtn" onClick={() => { setSt("idle"); setF(null); }}>Subir otra</button></div>;
  if (st === "listo" && f) return (<>
    <div className="inv">
      <div className="inv__h"><b>{f.emisor || "Emisor desconocido"}</b><span>→ {f.cliente || "cliente desconocido"}</span></div>
      <p className="muted small">{f.concepto}{f.numero ? ` · Nº ${f.numero}` : ""}{f.fecha ? ` · ${new Date(f.fecha).toLocaleDateString("es-ES")}` : ""}</p>
      <table className="imp__t"><tbody>
        <tr><td>Base imponible</td><td><b>{eur2(f.base)}</b></td></tr><tr><td>IVA</td><td>{eur2(f.iva)}</td></tr>
        {f.irpf > 0 && <tr><td>Retención IRPF</td><td>−{eur2(f.irpf)}</td></tr>}<tr><td>Total</td><td>{eur2(f.total)}</td></tr>
      </tbody></table>
      {!f.cuadra && <p className="fb__err">Los importes no cuadran del todo. Revísalos antes de añadirla.</p>}
    </div>
    <div className="fld"><span className="fb__q">¿Es un ingreso o un gasto tuyo?</span>
      <div className="seg seg--2" role="radiogroup" aria-label="Tipo">{(["ingreso", "gasto"] as const).map((k) => <button key={k} type="button" role="radio" aria-checked={tipo === k} className={tipo === k ? "on" : ""} onClick={() => setTipo(k)}>{k === "ingreso" ? "Ingreso" : "Gasto"}</button>)}</div></div>
    <div className="fld"><label htmlFor="inv-mes">Mes</label>
      <select id="inv-mes" value={mes} onChange={(e) => setMes(Number(e.target.value))}>{MESES.map((m, i) => <option key={m} value={i}>{m} {year}</option>)}</select></div>
    <button className="btn" onClick={() => { onApply(conMeses(meses, [{ mes, f: (m) => (tipo === "ingreso" ? { ...m, ingresos: Math.round((m.ingresos + f.base) * 100) / 100 } : { ...m, gastos: Math.round((m.gastos + f.base) * 100) / 100 }) }])); setSt("hecho"); }}>
      Añadir {eur2(f.base)} a {tipo === "ingreso" ? "ingresos" : "gastos"} de {MESES[mes].toLowerCase()}</button>
    <p className="muted small">Se usa la base imponible: el IVA no es ingreso ni gasto tuyo, lo ingresas o lo recuperas en el modelo 303.</p>
  </>);
  return (<>
    <p className="muted">Sube una factura en PDF o hazle una foto. La inteligencia artificial lee la fecha, los importes y si es un ingreso o un gasto.</p>
    <label className="consent consent--dark imp__consent"><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} />
      <span>Entiendo que la factura se envía a Google (Gemini) solo para leerla. No la guardamos.</span></label>
    <label className={`drop ${!ok || st === "leyendo" ? "drop--off" : ""}`}><input type="file" disabled={!ok || st === "leyendo"} accept="application/pdf,image/*" onChange={(e) => e.target.files?.[0] && subir(e.target.files[0])} />
      <b>{st === "leyendo" ? "Leyendo la factura…" : "Elegir factura o hacer foto"}</b><span>PDF, JPG, PNG o HEIC · máximo 3 MB</span></label>
    <div className="imp__samples"><span className="muted small">¿Sin facturas a mano?</span>
      <button type="button" className="linkbtn" disabled={!ok || st === "leyendo"} onClick={() => ejemplo("ingreso")}>Factura de ejemplo (ingreso)</button>
      <button type="button" className="linkbtn" disabled={!ok || st === "leyendo"} onClick={() => ejemplo("gasto")}>Factura de ejemplo (gasto)</button></div>
    {!ok && <p className="muted small">Marca la casilla para poder subir una factura.</p>}
    {st === "error" && <p role="alert" className="fb__err">{err}</p>}
  </>);
}
