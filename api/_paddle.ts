import { createHmac, timingSafeEqual } from "node:crypto";

/** Paddle Billing. PADDLE_ENV=sandbox for tests; anything else is live. */
export function paddleConfig() {
  const sandbox = (process.env.PADDLE_ENV ?? process.env.VITE_PADDLE_ENV ?? "sandbox") === "sandbox";
  return {
    api: sandbox ? "https://sandbox-api.paddle.com" : "https://api.paddle.com",
    apiKey: process.env.PADDLE_API_KEY ?? "",
    webhookSecret: process.env.PADDLE_WEBHOOK_SECRET ?? "",
  };
}

/** Cuotio Pro is on while the subscription is in trial, paid, or in Paddle's retry period after a failed payment. */
export const ESTADOS_PRO = ["trialing", "active", "past_due"] as const;
export const esPro = (estado: string | null | undefined) => (ESTADOS_PRO as readonly string[]).includes(estado ?? "");

/**
 * Checks the Paddle-Signature header ("ts=…;h1=…"): HMAC-SHA256 of "<ts>:<raw body>" with the webhook secret.
 * Rejects signatures older than 5 minutes so a captured request cannot be replayed later.
 */
export function firmaValida(header: string, raw: string, secret: string, ahora = Date.now()): boolean {
  if (!secret || !header) return false;
  const partes = Object.fromEntries(header.split(";").map((p) => p.split("=") as [string, string]));
  const ts = Number(partes.ts);
  if (!ts || Math.abs(ahora / 1000 - ts) > 300) return false;
  const esperado = createHmac("sha256", secret).update(`${partes.ts}:${raw}`).digest("hex");
  return (header.match(/h1=([0-9a-f]+)/g) ?? []).some((h) => {
    const a = Buffer.from(h.slice(3)), b = Buffer.from(esperado);
    return a.length === b.length && timingSafeEqual(a, b);
  });
}
