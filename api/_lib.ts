import { createHmac, timingSafeEqual } from "node:crypto";

/** Configuration read from environment variables (see .env.example). */
export function config() {
  const site = (process.env.SITE_URL ?? "").replace(/\/$/, "");
  return {
    apiKey: process.env.RESEND_API_KEY ?? "",
    audienceId: process.env.RESEND_AUDIENCE_ID ?? "",
    from: process.env.EMAIL_FROM ?? "",              // e.g. "Tramix <hola@tu-dominio.com>"
    replyTo: process.env.EMAIL_REPLY_TO ?? "",
    secret: process.env.UNSUBSCRIBE_SECRET ?? "",
    site,
    contactEmail: process.env.CONTACT_EMAIL ?? "",
    senderName: process.env.EMAIL_SENDER_NAME ?? "El equipo de Tramix",
  };
}
export type Config = ReturnType<typeof config>;

/** Public endpoints, no cookies: any origin may call them (needed by the installed native app). */
const CORS = { "access-control-allow-origin": "*", "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "content-type" };
export const preflight = () => new Response(null, { status: 204, headers: CORS });
export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...CORS } });

export const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/;
export const normalize = (e: string) => e.trim().toLowerCase();

/** Signed token so unsubscribe links cannot be forged for other people's addresses. */
export const sign = (email: string, secret: string) => createHmac("sha256", secret).update(normalize(email)).digest("hex").slice(0, 32);
export function verify(email: string, token: string, secret: string): boolean {
  if (!secret || !token) return false;
  const a = Buffer.from(sign(email, secret)), b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}
export const unsubscribeUrl = (c: Config, email: string) =>
  `${c.site}/api/unsubscribe?email=${encodeURIComponent(normalize(email))}&t=${sign(email, c.secret)}`;

export async function resend(c: Config, path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`https://api.resend.com${path}`, {
    ...init,
    headers: { authorization: `Bearer ${c.apiKey}`, "content-type": "application/json", ...(init.headers ?? {}) },
  });
}

/** Names the missing settings so a misconfigured deploy fails loudly in the logs, not silently for users. */
export function missing(c: Config): string[] {
  const m: string[] = [];
  if (!c.apiKey) m.push("RESEND_API_KEY");
  if (!c.audienceId) m.push("RESEND_AUDIENCE_ID");
  if (!c.from) m.push("EMAIL_FROM");
  if (!c.secret) m.push("UNSUBSCRIBE_SECRET");
  if (!c.site) m.push("SITE_URL");
  return m;
}
