import { json, preflight } from "./_lib.js";

/**
 * POST /api/extract  { name, mime, data (base64) }
 * Reads one invoice (PDF or photo) with Gemini and returns its key fields. The document is sent to Google
 * only to read it; nothing is stored. Answers are validated: amounts must add up before they reach the user.
 */
const MIMES = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const MAX_B64 = 4_300_000; // ~3,2 MB file, under the 4,5 MB request limit of the hosting

const PROMPT = `Eres un lector de facturas españolas. Extrae los datos de este documento.
- "es_factura": false si no es una factura o un justificante de gasto.
- "tipo": "ingreso" si parece emitida por un profesional autónomo a su cliente (por ejemplo, lleva retención de IRPF), "gasto" si es una compra o un servicio contratado. Si dudas, "desconocido".
- Importes en euros como números (1234.56), sin símbolos. "base_imponible" sin IVA. "retencion_irpf" en positivo, 0 si no hay.
- "fecha" en formato AAAA-MM-DD (fecha de emisión).
- No inventes datos: deja vacío o 0 lo que no aparezca.`;

const SCHEMA = {
  type: "OBJECT",
  properties: {
    es_factura: { type: "BOOLEAN" }, tipo: { type: "STRING", enum: ["ingreso", "gasto", "desconocido"] },
    fecha: { type: "STRING" }, numero: { type: "STRING" }, emisor: { type: "STRING" }, cliente: { type: "STRING" }, concepto: { type: "STRING" },
    base_imponible: { type: "NUMBER" }, iva: { type: "NUMBER" }, retencion_irpf: { type: "NUMBER" }, total: { type: "NUMBER" },
  },
  required: ["es_factura", "tipo", "fecha", "base_imponible", "iva", "total"],
};

export type Factura = { tipo: "ingreso" | "gasto" | "desconocido"; fecha: string | null; numero: string; emisor: string; cliente: string; concepto: string; base: number; iva: number; irpf: number; total: number; cuadra: boolean };

const r2 = (n: number) => Math.round(n * 100) / 100;
const txt = (v: unknown, max = 120) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");
const nz = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.abs(v) : 0);

/** Normalises the model output and checks base + IVA − IRPF ≈ total. */
export function validar(o: Record<string, unknown>): Factura | null {
  if (o.es_factura !== true) return null;
  let base = nz(o.base_imponible); const iva = nz(o.iva), irpf = nz(o.retencion_irpf); let total = nz(o.total);
  if (!base && total) base = total - iva + irpf;
  if (!total && base) total = base + iva - irpf;
  if (!base || base > 1_000_000) return null;
  const f = typeof o.fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(o.fecha) && !isNaN(Date.parse(o.fecha)) ? o.fecha : null;
  const tipo = o.tipo === "ingreso" || o.tipo === "gasto" ? o.tipo : "desconocido";
  return { tipo, fecha: f, numero: txt(o.numero, 40), emisor: txt(o.emisor), cliente: txt(o.cliente), concepto: txt(o.concepto, 160),
    base: r2(base), iva: r2(iva), irpf: r2(irpf), total: r2(total), cuadra: Math.abs(base + iva - irpf - total) <= Math.max(1, total * 0.01) };
}

const hits = new Map<string, number[]>();
function limited(ip: string, max = 15, windowMs = 3600_000) {
  const now = Date.now(); const l = (hits.get(ip) ?? []).filter((t) => now - t < windowMs); l.push(now); hits.set(ip, l); return l.length > max;
}
export const _resetLimiter = () => hits.clear();

export async function POST(request: Request): Promise<Response> {
  try { return await handle(request); }
  catch (e) { console.error("extract: unexpected failure", e instanceof Error ? e.message : e); return json({ error: "No he podido leer la factura. Inténtalo de nuevo." }, 502); }
}

async function handle(request: Request): Promise<Response> {
  const key = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || "";
  if (!key) { console.error("extract: GEMINI_API_KEY / AI_API_KEY not set"); return json({ error: "La lectura de facturas no está disponible ahora mismo." }, 503); }
  const ip = (request.headers.get("x-forwarded-for") ?? "anon").split(",")[0].trim();
  if (limited(ip)) return json({ error: "Has subido muchas facturas seguidas. Inténtalo en un rato." }, 429);

  let d: { mime?: unknown; data?: unknown };
  try { d = await request.json(); } catch { return json({ error: "El archivo es demasiado grande o no es válido (máximo 3 MB)." }, 400); }
  const mime = typeof d.mime === "string" ? d.mime.toLowerCase() : "";
  const data = typeof d.data === "string" ? d.data : "";
  if (!MIMES.includes(mime)) return json({ error: "Sube la factura en PDF o como foto (JPG, PNG, WEBP o HEIC)." }, 400);
  if (!data || data.length > MAX_B64 || !/^[A-Za-z0-9+/=]+$/.test(data.slice(0, 2000))) return json({ error: "El archivo es demasiado grande o no es válido (máximo 3 MB)." }, 400);

  const model = process.env.EXTRACT_MODEL || "gemini-flash-lite-latest";
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST", signal: AbortSignal.timeout(45000),
    headers: { "x-goog-api-key": key, "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ inline_data: { mime_type: mime, data } }, { text: PROMPT }] }],
      generationConfig: { temperature: 0, responseMimeType: "application/json", responseSchema: SCHEMA },
    }),
  });
  if (!res.ok) { console.error("extract: provider error", res.status, (await res.text()).slice(0, 300)); return json({ error: "No he podido leer la factura. Inténtalo de nuevo en un momento." }, 502); }
  const out = await res.json();
  let parsed: Record<string, unknown>;
  try { parsed = JSON.parse(out?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}"); } catch { return json({ error: "No he podido leer la factura con claridad. Prueba con una foto más nítida." }, 422); }
  const f = validar(parsed);
  if (!f) return json({ error: "No parece una factura, o no se leen bien los importes. Prueba con otro archivo o una foto más nítida." }, 422);
  return json({ factura: f });
}

export const OPTIONS = async (): Promise<Response> => preflight();
