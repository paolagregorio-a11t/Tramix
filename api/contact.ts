import { EMAIL_RE, config, json, normalize, preflight, resend } from "./_lib.js";
import { esc } from "../emails/layout.js";

/**
 * POST /api/contact  { kind: "contacto" | "opinion", name?, email?, message, rating?, usaria?, website }
 * Sends contact messages and tester feedback to CONTACT_EMAIL. The visitor's address goes in reply_to,
 * so answering is one click. Nothing is stored.
 */
const hits = new Map<string, number[]>();
function limited(ip: string, max = 8, windowMs = 3600_000): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  list.push(now); hits.set(ip, list);
  return list.length > max;
}
export const _resetLimiter = () => hits.clear();

const USARIA = ["si", "quiza", "no"] as const;
const USARIA_TXT: Record<string, string> = { si: "Sí", quiza: "Quizá", no: "No" };

export async function POST(request: Request): Promise<Response> {
  try { return await handle(request); }
  catch (e) { console.error("contact: unexpected failure", e); return json({ error: "No hemos podido enviar tu mensaje. Inténtalo de nuevo." }, 502); }
}

async function handle(request: Request): Promise<Response> {
  const c = config();
  if (!c.apiKey || !c.from || !c.contactEmail) {
    console.error("contact: missing RESEND_API_KEY, EMAIL_FROM or CONTACT_EMAIL");
    return json({ error: "El formulario no está disponible ahora mismo." }, 503);
  }
  const ip = (request.headers.get("x-forwarded-for") ?? "anon").split(",")[0].trim();
  if (limited(ip)) return json({ error: "Has enviado varios mensajes seguidos. Inténtalo más tarde." }, 429);

  let d: Record<string, unknown>;
  try { d = await request.json(); } catch { return json({ error: "Solicitud no válida." }, 400); }
  if (d.website) return json({ ok: true }); // honeypot

  const kind = d.kind === "opinion" ? "opinion" : "contacto";
  const name = typeof d.name === "string" ? d.name.trim().slice(0, 80) : "";
  const email = typeof d.email === "string" ? normalize(d.email) : "";
  const message = typeof d.message === "string" ? d.message.trim().slice(0, 3000) : "";
  const rating = typeof d.rating === "number" && d.rating >= 1 && d.rating <= 5 ? Math.round(d.rating) : null;
  const usaria = USARIA.includes(d.usaria as (typeof USARIA)[number]) ? (d.usaria as string) : null;

  if (email && (!EMAIL_RE.test(email) || email.length > 254)) return json({ error: "Revisa el email." }, 400);
  if (kind === "contacto") {
    if (!email) return json({ error: "Necesitamos tu email para poder responderte." }, 400);
    if (message.length < 5) return json({ error: "Escribe tu mensaje." }, 400);
    if (d.consent !== true) return json({ error: "Acepta la política de privacidad para enviar el mensaje." }, 400);
  } else if (!rating && message.length < 2) {
    return json({ error: "Valora la demo o escribe un comentario." }, 400);
  }

  const rows: [string, string][] = [
    ["Tipo", kind === "opinion" ? "Opinión sobre la demo" : "Contacto"],
    ...(name ? [["Nombre", name] as [string, string]] : []),
    ...(email ? [["Email", email] as [string, string]] : []),
    ...(rating ? [["Valoración", `${"★".repeat(rating)}${"☆".repeat(5 - rating)} (${rating}/5)`] as [string, string]] : []),
    ...(usaria ? [["¿Lo usaría?", USARIA_TXT[usaria]] as [string, string]] : []),
  ];
  const subject = kind === "opinion" ? `Opinión de la demo${rating ? ` · ${rating}/5` : ""}` : `Contacto web${name ? ` · ${name}` : ""}`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;color:#0b1220">
<h2 style="margin:0 0 12px">${esc(subject)}</h2>
<table style="border-collapse:collapse;width:100%;margin-bottom:16px">${rows.map(([k, v]) => `<tr><td style="padding:6px 0;color:#5a6478;width:120px">${esc(k)}</td><td style="padding:6px 0;font-weight:bold">${esc(v)}</td></tr>`).join("")}</table>
${message ? `<div style="white-space:pre-wrap;padding:14px;border-radius:10px;background:#f5f7fa">${esc(message)}</div>` : ""}
</div>`;
  const text = `${subject}\n\n${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n${message}`;

  const res = await resend(c, "/emails", {
    method: "POST",
    body: JSON.stringify({ from: c.from, to: [c.contactEmail], subject, html, text, ...(email ? { reply_to: email } : {}) }),
  });
  if (!res.ok) { console.error("contact: send failed", res.status, await res.text()); return json({ error: "No hemos podido enviar tu mensaje. Inténtalo de nuevo." }, 502); }
  return json({ ok: true });
}

export const OPTIONS = async (): Promise<Response> => preflight();
