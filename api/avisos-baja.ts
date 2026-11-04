import { config, json, page, verify } from "./_lib.js";
import { supabaseAdmin } from "./_supabase.js";

/**
 * /api/avisos-baja?u=<account id>&t=<signature>   (link at the foot of every alert email)
 * Switches off all of the account's deadline alerts. The signature stops anyone from switching off someone else's.
 */
async function baja(request: Request): Promise<boolean> {
  const url = new URL(request.url);
  const u = url.searchParams.get("u") ?? "", t = url.searchParams.get("t") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(u) || !verify(u, t, config().secret)) return false;
  const sb = supabaseAdmin();
  if (!sb.ok) return false;
  const r = await sb.rest(`perfiles?user_id=eq.${u}`, { method: "PATCH", headers: { prefer: "return=minimal" }, body: JSON.stringify({ avisos: [false, false, false, false, false, false] }) });
  if (!r.ok) console.error("avisos-baja: update failed", r.status, await r.text());
  return r.ok;
}

export async function GET(request: Request): Promise<Response> {
  const ok = await baja(request).catch(() => false);
  const site = config().site;
  const html = ok ? page("Avisos desactivados", "No te enviaremos más avisos de plazos. Puedes volver a activarlos cuando quieras en la pestaña Avisos de tu cuenta.", site)
    : page("Enlace no válido", "No hemos podido desactivar los avisos. Hazlo desde la pestaña Avisos de tu cuenta o escríbenos.", site);
  return new Response(html, { status: ok ? 200 : 400, headers: { "content-type": "text/html; charset=utf-8" } });
}

/** One-click unsubscribe from mail clients (RFC 8058). */
export async function POST(request: Request): Promise<Response> {
  const ok = await baja(request).catch(() => false);
  return json({ ok }, ok ? 200 : 400);
}
