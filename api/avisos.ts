import { alertaEmail } from "../emails/alerta.js";
import { proyectar, recomendar, ventanasDelAno, type Month, type Regimen, type Ventana } from "../src/engine/calc.js";
import { tablaDe } from "../src/engine/tramos.js";
import { config, json, sign } from "./_lib.js";
import { supabaseAdmin, type SupabaseAdmin } from "./_supabase.js";

/**
 * GET /api/avisos   (called once a day by the Vercel cron, see vercel.json)
 * Emails each account that switched on the alert for the coming deadline, 7 days or less before it, once per deadline.
 * Protected by CRON_SECRET: Vercel sends it as "Authorization: Bearer <CRON_SECRET>".
 */
export const DIAS_ANTES = 7;
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const fecha = (d: Date) => `${d.getDate()} de ${MESES[d.getMonth()]}`;
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export type Perfil = { user_id: string; tramo_actual: number; regimen: Regimen; avisos: boolean[] };
export type FilaMes = { user_id: string; mes: number; ingresos: number | string; gastos: number | string };
export type Envio = { userId: string; ventana: Ventana; dias: number; tramoActual: number; tramoObjetivo: number; rango: string; importe: number; accion: "subir" | "bajar" | "mantener" };

/** Today's date in Spain, as a local midnight Date (the server runs in UTC). */
export function hoyEnEspana(now = new Date()): Date {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(now).split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** The deadline we should be warning about today, with its position among the year's six (the alert switches), or null. */
export function ventanaParaAvisar(hoy: Date): { ventana: Ventana; dias: number; indice: number } | null {
  const lista = ventanasDelAno(hoy.getFullYear());
  for (let i = 0; i < lista.length; i++) {
    const dias = Math.round((lista[i].limite.getTime() - hoy.getTime()) / 86400000);
    if (dias >= 0 && dias <= DIAS_ANTES) return { ventana: lista[i], dias, indice: i };
  }
  return null;
}

/** Months of the year from January, in order, as the app shows them. */
function mesesDe(filas: FilaMes[]): Month[] {
  const por = new Map(filas.map((f) => [Number(f.mes), f]));
  const out: Month[] = [];
  for (let m = 1; m <= 12 && por.has(m); m++) out.push({ ingresos: Number(por.get(m)!.ingresos) || 0, gastos: Number(por.get(m)!.gastos) || 0 });
  return out;
}

/** Who gets an email today and what it says. Pure, so it can be tested without Supabase or Resend. */
export function planificar(hoy: Date, perfiles: Perfil[], meses: FilaMes[], yaEnviados: Set<string>): Envio[] {
  const v = ventanaParaAvisar(hoy);
  if (!v) return [];
  const tabla = tablaDe(hoy.getFullYear());
  const porUsuario = new Map<string, FilaMes[]>();
  for (const f of meses) porUsuario.set(f.user_id, [...(porUsuario.get(f.user_id) ?? []), f]);
  const out: Envio[] = [];
  for (const p of perfiles) {
    if (!Array.isArray(p.avisos) || p.avisos[v.indice] !== true) continue;
    if (yaEnviados.has(p.user_id)) continue;
    const proy = proyectar(mesesDe(porUsuario.get(p.user_id) ?? []), tabla, p.regimen);
    if (!proy) continue; // no months yet: nothing to recommend
    const rec = recomendar(p.tramo_actual, proy, tabla);
    out.push({
      userId: p.user_id, ventana: v.ventana, dias: v.dias, tramoActual: p.tramo_actual, tramoObjetivo: rec.objetivo, importe: rec.ahorro, accion: rec.accion,
      rango: proy.tramoBajo === proy.tramoAlto ? `tramo ${proy.tramoBajo}` : `tramo ${proy.tramoBajo}–${proy.tramoAlto}`,
    });
  }
  return out;
}

export const bajaAvisosUrl = (site: string, secret: string, userId: string) => `${site}/api/avisos-baja?u=${userId}&t=${sign(userId, secret)}`;

async function leer<T>(sb: SupabaseAdmin, path: string): Promise<T[]> {
  const r = await sb.rest(path);
  if (!r.ok) throw new Error(`supabase ${path.split("?")[0]}: ${r.status} ${await r.text()}`);
  return (await r.json()) as T[];
}

export async function GET(request: Request): Promise<Response> {
  const cron = process.env.CRON_SECRET ?? "";
  if (!cron || request.headers.get("authorization") !== `Bearer ${cron}`) return json({ error: "No autorizado." }, 401);
  const c = config(), sb = supabaseAdmin();
  const gaps = [...sb.missing, ...(!c.apiKey ? ["RESEND_API_KEY"] : []), ...(!c.from ? ["EMAIL_FROM"] : []), ...(!c.secret ? ["UNSUBSCRIBE_SECRET"] : []), ...(!c.site ? ["SITE_URL"] : [])];
  if (gaps.length) { console.error("avisos: missing environment variables:", gaps.join(", ")); return json({ error: "Faltan variables." }, 503); }

  const hoy = hoyEnEspana();
  const v = ventanaParaAvisar(hoy);
  if (!v) return json({ ok: true, enviados: 0, motivo: "sin plazo cercano" });
  const limite = iso(v.ventana.limite);

  try {
    const perfiles = await leer<Perfil>(sb, "perfiles?select=user_id,tramo_actual,regimen,avisos");
    const meses = await leer<FilaMes>(sb, `meses?select=user_id,mes,ingresos,gastos&anio=eq.${hoy.getFullYear()}`);
    const enviados = await leer<{ user_id: string }>(sb, `avisos_enviados?select=user_id&limite=eq.${limite}`);
    const plan = planificar(hoy, perfiles, meses, new Set(enviados.map((e) => e.user_id)));

    let ok = 0, fallos = 0;
    for (const e of plan) {
      // Claim first, so two overlapping runs never email the same person twice; released again if sending fails.
      const claim = await sb.rest("avisos_enviados", { method: "POST", headers: { prefer: "return=minimal" }, body: JSON.stringify({ user_id: e.userId, limite }) });
      if (!claim.ok) continue; // already claimed (409) or database error: skip this person today
      const enviado = await enviar(c, sb, e).catch((err) => { console.error("avisos: send failed", err); return false; });
      if (enviado) ok++;
      else { fallos++; await sb.rest(`avisos_enviados?user_id=eq.${e.userId}&limite=eq.${limite}`, { method: "DELETE" }); }
    }
    console.log(`avisos: ${limite} · ${plan.length} previstos · ${ok} enviados · ${fallos} fallos`);
    return json({ ok: true, limite, previstos: plan.length, enviados: ok, fallos });
  } catch (err) {
    console.error("avisos: unexpected failure", err);
    return json({ error: "Fallo al preparar los avisos." }, 502);
  }
}

async function enviar(c: ReturnType<typeof config>, sb: SupabaseAdmin, e: Envio): Promise<boolean> {
  const u = await sb.auth(`admin/users/${e.userId}`);
  if (!u.ok) throw new Error(`auth user ${u.status}`);
  const email = ((await u.json()) as { email?: string }).email;
  if (!email) return false;
  const baja = bajaAvisosUrl(c.site, c.secret, e.userId);
  const mail = alertaEmail({ site: c.site, unsubscribeUrl: baja, contactEmail: c.contactEmail, senderName: c.senderName }, {
    dias: e.dias, limite: fecha(e.ventana.limite), efecto: fecha(e.ventana.efecto), tramoActual: e.tramoActual, tramoObjetivo: e.tramoObjetivo,
    rangoTexto: e.rango, importe: e.importe, accion: e.accion, appUrl: `${c.site}/app`,
  });
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${c.apiKey}`, "content-type": "application/json", "idempotency-key": `aviso-${e.userId}-${iso(e.ventana.limite)}` },
    body: JSON.stringify({
      from: c.from, to: [email], subject: mail.subject, html: mail.html, text: mail.text,
      ...(c.replyTo ? { reply_to: c.replyTo } : {}),
      headers: { "List-Unsubscribe": `<${baja}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    }),
  });
  if (!r.ok) throw new Error(`resend ${r.status} ${await r.text()}`);
  return true;
}
