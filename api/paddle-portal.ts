import { paddleConfig } from "./_paddle.js";
import { supabaseAdmin } from "./_supabase.js";

/**
 * POST /api/paddle-portal   (header Authorization: Bearer <access token of the person>)
 * Returns a one-off link to Paddle's customer portal, where the person changes card, sees invoices or cancels.
 */
const CORS = { "access-control-allow-origin": "*", "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "authorization, content-type" };
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...CORS } });

export async function POST(request: Request): Promise<Response> {
  const p = paddleConfig(), sb = supabaseAdmin();
  if (!p.apiKey || !sb.ok) { console.error("paddle-portal: missing PADDLE_API_KEY or Supabase variables"); return json({ error: "No disponible ahora mismo." }, 503); }
  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Tienes que entrar en tu cuenta." }, 401);
  try {
    const who = await sb.auth("user", { headers: { authorization: `Bearer ${token}` } });
    if (!who.ok) return json({ error: "Tu sesión ha caducado. Vuelve a entrar." }, 401);
    const { id } = (await who.json()) as { id?: string };
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return json({ error: "Tu sesión no es válida." }, 401);

    const r = await sb.rest(`suscripciones?select=paddle_customer_id,paddle_subscription_id&user_id=eq.${id}`);
    const sub = r.ok ? ((await r.json()) as { paddle_customer_id: string; paddle_subscription_id: string }[])[0] : undefined;
    if (!sub) return json({ error: "No tienes ninguna suscripción." }, 404);

    const portal = await fetch(`${p.api}/customers/${encodeURIComponent(sub.paddle_customer_id)}/portal-sessions`, {
      method: "POST", headers: { authorization: `Bearer ${p.apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({ subscription_ids: [sub.paddle_subscription_id] }),
    });
    if (!portal.ok) { console.error("paddle-portal: Paddle error", portal.status, await portal.text()); return json({ error: "No hemos podido abrir la gestión de la suscripción." }, 502); }
    const data = (await portal.json()) as { data?: { urls?: { general?: { overview?: string } } } };
    const url = data.data?.urls?.general?.overview;
    return url ? json({ url }) : json({ error: "No hemos podido abrir la gestión de la suscripción." }, 502);
  } catch (err) {
    console.error("paddle-portal: unexpected failure", err);
    return json({ error: "No hemos podido abrir la gestión de la suscripción." }, 502);
  }
}

export const OPTIONS = async (): Promise<Response> => new Response(null, { status: 204, headers: CORS });
