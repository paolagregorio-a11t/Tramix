/**
 * Bank statement import. Runs entirely in the browser: the file never leaves the device.
 * Understands Spanish exports: "Fecha / Concepto / Importe" or "Debe / Haber" (Cargo / Abono) columns,
 * amounts like "1.234,56" or "-45,00", dates like 31/10/2026 or Excel dates.
 */
export type Movimiento = { fecha: Date; concepto: string; importe: number; incluir: boolean; motivo?: string };
export type ResumenMes = { mes: number; year: number; ingresos: number; gastos: number; n: number };

const norm = (s: unknown) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const DATE_H = /^(fecha|f\. ?(valor|operacion|contable)|fecha (valor|operacion|contable|de la operacion)|date)/;
const CONCEPT_H = /(concepto|descripcion|detalle|movimiento|observaciones|description|beneficiario|ordenante)/;
const AMOUNT_H = /^(importe|cantidad|amount|importe \(?eur\)?|importe eur)/;
const DEBIT_H = /^(cargo|cargos|debe|gasto|gastos|reintegro|salida|debit)/;
const CREDIT_H = /^(abono|abonos|haber|ingreso|ingresos|entrada|credit)/;
/** Payments of the self-employed contribution itself are not deductible expenses for the net-yield calculation. */
const CUOTA_RE = /(seguridad social|tgss|tesoreria gral|tesoreria general|reta|cuota autonom|reg\.? ?esp\.? ?trab)/;

export function parseImporte(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  let s = String(v ?? "").replace(/[€\s]|EUR/gi, "").trim();
  if (!s) return null;
  let neg = false;
  if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1); }
  if (s.endsWith("-")) { neg = true; s = s.slice(0, -1); }
  if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, "").replace(",", ".");      // 1.234,56
  else if (/\.\d{1,2}$/.test(s) && s.includes(",")) s = s.replace(/,/g, ""); // 1,234.56
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");       // 1.234
  const n = Number(s);
  return Number.isFinite(n) ? (neg ? -Math.abs(n) : n) : null;
}

export function parseFecha(v: unknown): Date | null {
  if (v instanceof Date) return isNaN(+v) ? null : new Date(v.getFullYear(), v.getMonth(), v.getDate());
  if (typeof v === "number" && v > 20000 && v < 80000) { const d = new Date(Date.UTC(1899, 11, 30) + v * 86400000); return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()); }
  const s = String(v ?? "").trim();
  let m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (m) { const y = +m[3] < 100 ? 2000 + +m[3] : +m[3]; const d = new Date(y, +m[2] - 1, +m[1]); return d.getMonth() === +m[2] - 1 ? d : null; }
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  return null;
}

/** Turns spreadsheet rows (array of arrays) into movements. Throws a user-facing message if the layout is not recognised. */
export function leerMovimientos(rows: unknown[][]): Movimiento[] {
  let h = -1, cF = -1, cC = -1, cI = -1, cD = -1, cH = -1;
  for (let i = 0; i < Math.min(rows.length, 40) && h < 0; i++) {
    const r = rows[i].map(norm);
    const f = r.findIndex((x) => DATE_H.test(x));
    const imp = r.findIndex((x) => AMOUNT_H.test(x));
    const deb = r.findIndex((x) => DEBIT_H.test(x)), cre = r.findIndex((x) => CREDIT_H.test(x));
    if (f >= 0 && (imp >= 0 || (deb >= 0 && cre >= 0))) { h = i; cF = f; cI = imp; cD = deb; cH = cre; cC = r.findIndex((x) => CONCEPT_H.test(x)); }
  }
  if (h < 0) throw new Error("No encuentro las columnas de fecha e importe. Comprueba que es el extracto de movimientos de tu banco (CSV o Excel).");
  const out: Movimiento[] = [];
  for (const r of rows.slice(h + 1)) {
    const fecha = parseFecha(r[cF]);
    let importe: number | null;
    if (cI >= 0) importe = parseImporte(r[cI]);
    else { const d = parseImporte(r[cD]) ?? 0, c = parseImporte(r[cH]) ?? 0; importe = c - Math.abs(d); if (!d && !c) importe = null; }
    if (!fecha || importe === null || importe === 0) continue;
    const concepto = String(cC >= 0 ? r[cC] ?? "" : "").trim() || "(sin concepto)";
    const esCuota = importe < 0 && CUOTA_RE.test(norm(concepto));
    out.push({ fecha, concepto, importe, incluir: !esCuota, ...(esCuota ? { motivo: "Cuota de autónomo: no cuenta como gasto" } : {}) });
  }
  if (!out.length) throw new Error("He encontrado las columnas, pero ningún movimiento con fecha e importe válidos.");
  return out.sort((a, b) => +a.fecha - +b.fecha);
}

/** Monthly income and expenses from the included movements. */
export function resumir(movs: Movimiento[]): ResumenMes[] {
  const m = new Map<string, ResumenMes>();
  for (const x of movs) {
    if (!x.incluir) continue;
    const k = `${x.fecha.getFullYear()}-${x.fecha.getMonth()}`;
    const r = m.get(k) ?? { mes: x.fecha.getMonth(), year: x.fecha.getFullYear(), ingresos: 0, gastos: 0, n: 0 };
    if (x.importe > 0) r.ingresos += x.importe; else r.gastos += -x.importe;
    r.n++; m.set(k, r);
  }
  return [...m.values()].sort((a, b) => a.year - b.year || a.mes - b.mes).map((r) => ({ ...r, ingresos: Math.round(r.ingresos * 100) / 100, gastos: Math.round(r.gastos * 100) / 100 }));
}

/** Text of a CSV export: UTF-8 if valid, otherwise Windows-1252 (common in Spanish banks). */
export function decodificar(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  try { return new TextDecoder("utf-8", { fatal: true }).decode(bytes).replace(/^\uFEFF/, ""); }
  catch { return new TextDecoder("windows-1252").decode(bytes); }
}

/**
 * CSV parser that keeps every cell as text (spreadsheet libraries guess US formats and turn
 * 01/07/2026 into 7 January and 1.650,00 into 1,65). Detects ; , or tab and handles quotes.
 */
export function parseCsv(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const count = (d: string) => lines.slice(0, 40).reduce((a, l) => a + (l.split(d).length - 1), 0);
  const delim = [";", "\t", ","].reduce((best, d) => (count(d) > count(best) ? d : best), ";");
  return lines.map((line) => {
    const out: string[] = []; let cur = "", q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (q) { if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
      else if (ch === '"') q = true;
      else if (ch === delim) { out.push(cur.trim()); cur = ""; }
      else cur += ch;
    }
    out.push(cur.trim());
    return out;
  });
}

/** Reads CSV, XLSX or XLS. The spreadsheet library is only downloaded when someone imports an Excel file. */
export async function leerArchivo(file: File): Promise<Movimiento[]> {
  if (file.size > 5 * 1024 * 1024) throw new Error("El archivo es demasiado grande (máximo 5 MB).");
  const buf = await file.arrayBuffer();
  if (/\.(csv|txt)$/i.test(file.name) || file.type === "text/csv") return leerMovimientos(parseCsv(decodificar(buf)));
  const XLSX = await import("xlsx");
  const wb = XLSX.read(buf, { type: "array", cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true, defval: "" });
  return leerMovimientos(rows);
}
