import { firmaValida, paddleConfig } from "./_paddle.js";
import { supabaseAdmin } from "./_supabase.js";

/**
 * POST /api/paddle-webhook   (Paddle > Developer tools > Notifications, events subscription.*)
 * Keeps public.suscripciones in step with Paddle. The checkout passes the account id as custom_data.user_id.
 */
type Sub = {
  id: string; status: string; customer_id: string; custom_data?: { user_id?: string } | null;
  items?: { price?: { id?: string } }[]; current_billing_period?: { ends_at?: string } | null;
  scheduled_change?: { action?: string } | null; canceled_at?: string | null;
};
type Evento = { event_type?: string; occurred_at?: string; data?: Sub };

const ok = (status = 200) => new Response(null, { status });
const UUID = /^[0-9a-f-]{36}$/i;

/** The row to store for a subscription event, or null when the event is not one we keep. */
export function aFila(e: Evento) {
  const d = e.data;
  if (!e.event_type?.startsWith("subscription.") || !d?.id || !d.customer_id || !e.occurred_at) return null;
  const userId = d.custom_data?.user_id;
  if (!userId || !UUID.test(userId)) return null;
  if (!["trialing", "active", "past_due", "paused", "canceled"].includes(d.status)) return null;
  return {
    user_id: userId, paddle_subscription_id: d.id, paddle_customer_id: d.customer_id, estado: d.status,
    precio_id: d.items?.[0]?.price?.id ?? null, periodo_fin: d.current_billing_period?.ends_at ?? null,
    cancela_al_final: d.scheduled_change?.action === "cancel", evento_at: e.occurred_at,
  };
}

export async function POST(request: Request): Promise<Response> {
  const p = paddleConfig(), sb = supabaseAdmin();
  if (!p.webhookSecret || !sb.ok) { console.error("paddle-webhook: missing PADDLE_WEBHOOK_SECRET or Supabase variables"); return ok(503); }
  const raw = await request.text();
  if (!firmaValida(request.headers.get("paddle-signature") ?? "", raw, p.webhookSecret)) return ok(401);

  let e: Evento;
  try { e = JSON.parse(raw); } catch { return ok(400); }
  const fila = aFila(e);
  if (!fila) return ok(200); // other events, or a checkout without account: acknowledge so Paddle does not retry

  try {
    // Paddle may deliver events out of order: only apply this one if it is newer than what we have.
    const prev = await sb.rest(`suscripciones?select=evento_at&user_id=eq.${fila.user_id}`);
    const filas = prev.ok ? ((await prev.json()) as { evento_at: string }[]) : [];
    if (filas[0] && Date.parse(filas[0].evento_at) > Date.parse(fila.evento_at)) return ok(200);
    const up = await sb.rest("suscripciones?on_conflict=user_id", {
      method: "POST", headers: { prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(fila),
    });
    if (!up.ok) { console.error("paddle-webhook: upsert failed", up.status, await up.text()); return ok(500); } // Paddle retries
    return ok(200);
  } catch (err) {
    console.error("paddle-webhook: unexpected failure", err);
    return ok(500);
  }
}
