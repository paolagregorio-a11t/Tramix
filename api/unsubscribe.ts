import { config, json, normalize, resend, verify } from "./_lib";

async function unsubscribe(request: Request): Promise<{ ok: boolean; status: number }> {
  const c = config();
  const url = new URL(request.url);
  const email = normalize(url.searchParams.get("email") ?? "");
  const token = url.searchParams.get("t") ?? "";
  if (!email || !verify(email, token, c.secret)) return { ok: false, status: 400 };
  const res = await resend(c, `/audiences/${c.audienceId}/contacts/${encodeURIComponent(email)}`, { method: "PATCH", body: JSON.stringify({ unsubscribed: true }) });
  return { ok: res.ok || res.status === 404, status: res.ok ? 200 : res.status === 404 ? 200 : 502 };
}

const page = (title: string, msg: string, site: string) => `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tramix</title>
<body style="margin:0;font-family:system-ui,sans-serif;background:#0b1220;color:#fff;display:grid;place-items:center;min-height:100vh;text-align:center;padding:24px">
<main style="max-width:420px"><h1 style="font-size:1.8rem;margin:0 0 12px">${title}</h1><p style="color:#9fb0cf;line-height:1.6">${msg}</p><p><a href="${site || "/"}" style="color:#e9b44c">Volver a Tramix</a></p></main></body></html>`;

/** Link in the email footer. */
export async function GET(request: Request): Promise<Response> {
  const r = await unsubscribe(request);
  const site = config().site;
  const html = r.ok ? page("Te has dado de baja", "No volverás a recibir correos de Tramix. Si ha sido un error, puedes volver a apuntarte desde la web.", site)
    : page("Enlace no válido", "No hemos podido procesar la baja. Escríbenos y la hacemos a mano.", site);
  return new Response(html, { status: r.ok ? 200 : 400, headers: { "content-type": "text/html; charset=utf-8" } });
}

/** One-click unsubscribe from mail clients (RFC 8058). */
export async function POST(request: Request): Promise<Response> {
  const r = await unsubscribe(request);
  return json({ ok: r.ok }, r.status);
}
