import type { SupabaseClient } from "@supabase/supabase-js";
import type { Plan } from "./planes";

/**
 * Cuotio Pro with Paddle Billing. Everything here is public (client-side token and price ids);
 * the API key and webhook secret live only in Vercel. Until VITE_PADDLE_CLIENT_TOKEN is set, nothing is gated.
 */
const env = import.meta.env;
const TOKEN: string = env.VITE_PADDLE_CLIENT_TOKEN ?? "";
const PRECIOS: Record<Plan, string> = { mes: env.VITE_PADDLE_PRICE_MES ?? "", anio: env.VITE_PADDLE_PRICE_ANIO ?? "" };
const SANDBOX = (env.VITE_PADDLE_ENV ?? "sandbox") === "sandbox";

export const cobroActivo = () => Boolean(TOKEN && PRECIOS.mes && PRECIOS.anio);

export type Suscripcion = { estado: string; precio_id: string | null; periodo_fin: string | null; cancela_al_final: boolean };
export const esPro = (s: Suscripcion | null) => !!s && ["trialing", "active", "past_due"].includes(s.estado);
export const planDe = (s: Suscripcion | null): Plan | null => (!s?.precio_id ? null : s.precio_id === PRECIOS.anio ? "anio" : "mes");

export async function leerSuscripcion(sb: SupabaseClient, userId: string): Promise<Suscripcion | null> {
  const { data, error } = await sb.from("suscripciones").select("estado, precio_id, periodo_fin, cancela_al_final").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data as Suscripcion | null;
}

type PaddleEvent = { name?: string };
type PaddleJs = {
  Environment: { set: (e: string) => void };
  Initialize: (o: { token: string; eventCallback?: (e: PaddleEvent) => void }) => void;
  Checkout: { open: (o: unknown) => void; close: () => void };
};
declare global { interface Window { Paddle?: PaddleJs } }

let listo: Promise<PaddleJs> | null = null;
let alTerminar: (() => void) | null = null;

/** Loads Paddle.js only when someone opens the checkout, so nothing of Paddle runs for people who don't pay. */
function paddle(): Promise<PaddleJs> {
  listo ??= new Promise<PaddleJs>((resolve, reject) => {
    const s = Object.assign(document.createElement("script"), { src: "https://cdn.paddle.com/paddle/v2/paddle.js", async: true });
    s.onload = () => {
      const P = window.Paddle;
      if (!P) return reject(new Error("Paddle no cargó"));
      if (SANDBOX) P.Environment.set("sandbox");
      P.Initialize({ token: TOKEN, eventCallback: (e) => { if (e.name === "checkout.completed") alTerminar?.(); } });
      resolve(P);
    };
    s.onerror = () => { listo = null; reject(new Error("No se pudo cargar el pago")); };
    document.head.appendChild(s);
  });
  return listo;
}

export async function abrirPago(plan: Plan, email: string, userId: string, onCompletado: () => void) {
  const P = await paddle();
  alTerminar = onCompletado;
  P.Checkout.open({
    items: [{ priceId: PRECIOS[plan], quantity: 1 }],
    customer: email ? { email } : undefined,
    customData: { user_id: userId },
    settings: { displayMode: "overlay", locale: "es", theme: "light", allowLogout: false },
  });
}
