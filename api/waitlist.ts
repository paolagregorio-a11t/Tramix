import { welcomeEmail } from "../emails/welcome";
import { EMAIL_RE, config, json, missing, normalize, resend, unsubscribeUrl } from "./_lib";

/**
 * POST /api/waitlist  { email, consent, website }
 * Adds the address to the Resend audience and sends the welcome email, once per address.
 */
export async function POST(request: Request): Promise<Response> {
  const c = config();
  const gaps = missing(c);
  if (gaps.length) {
    console.error("waitlist: missing environment variables:", gaps.join(", "));
    return json({ error: "El servicio no está disponible ahora mismo. Inténtalo más tarde." }, 503);
  }

  let data: { email?: unknown; consent?: unknown; website?: unknown };
  try { data = await request.json(); } catch { return json({ error: "Solicitud no válida." }, 400); }

  if (data.website) return json({ ok: true });                       // honeypot: bots fill hidden fields
  const email = typeof data.email === "string" ? normalize(data.email) : "";
  if (!EMAIL_RE.test(email) || email.length > 254) return json({ error: "Escribe un email válido." }, 400);
  if (data.consent !== true) return json({ error: "Necesitamos tu consentimiento para guardar tu email." }, 400);

  // Already on the list? Answer ok without emailing again (prevents using us to spam an address).
  const existing = await resend(c, `/audiences/${c.audienceId}/contacts/${encodeURIComponent(email)}`);
  if (existing.ok) return json({ ok: true });

  const created = await resend(c, `/audiences/${c.audienceId}/contacts`, { method: "POST", body: JSON.stringify({ email, unsubscribed: false }) });
  if (!created.ok) {
    console.error("waitlist: could not create contact", created.status, await created.text());
    return json({ error: "No hemos podido guardar tu email. Inténtalo de nuevo en unos minutos." }, 502);
  }

  const unsub = unsubscribeUrl(c, email);
  const mail = welcomeEmail({ site: c.site, unsubscribeUrl: unsub, contactEmail: c.contactEmail, senderName: c.senderName });
  const sent = await resend(c, "/emails", {
    method: "POST",
    body: JSON.stringify({
      from: c.from, to: [email], subject: mail.subject, html: mail.html, text: mail.text,
      ...(c.replyTo ? { reply_to: c.replyTo } : {}),
      headers: { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    }),
  });
  if (!sent.ok) console.error("waitlist: welcome email failed", sent.status, await sent.text()); // contact is saved; do not fail the user

  return json({ ok: true });
}
