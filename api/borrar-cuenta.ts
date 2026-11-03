/**
 * POST /api/borrar-cuenta   (header Authorization: Bearer <access token of the person>)
 * Deletes the signed-in person's account. Their profile and months go with it (ON DELETE CASCADE in the database).
 * Only the person themself can do it: the token is checked with Supabase before anything is deleted.
 * Needs SUPABASE_SERVICE_ROLE_KEY, which lives only in Vercel and never reaches the browser.
 */
const CORS = { "access-control-allow-origin": "*", "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "authorization, content-type" };
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...CORS } });

export async function POST(request: Request): Promise<Response> {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !service) {
    console.error("borrar-cuenta: missing environment variables:", [!url && "SUPABASE_URL", !service && "SUPABASE_SERVICE_ROLE_KEY"].filter(Boolean).join(", "));
    return json({ error: "No podemos borrar la cuenta ahora mismo. Escríbenos y lo hacemos a mano." }, 503);
  }
  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Tienes que entrar en tu cuenta para borrarla." }, 401);

  try {
    // Who is this? Supabase validates the token (signature and expiry) and tells us the account id.
    const who = await fetch(`${url}/auth/v1/user`, { headers: { apikey: service, authorization: `Bearer ${token}` } });
    if (!who.ok) return json({ error: "Tu sesión ha caducado. Vuelve a entrar e inténtalo de nuevo." }, 401);
    const user = (await who.json()) as { id?: string };
    if (!user.id || !/^[0-9a-f-]{36}$/i.test(user.id)) return json({ error: "Tu sesión no es válida." }, 401);

    const del = await fetch(`${url}/auth/v1/admin/users/${user.id}`, { method: "DELETE", headers: { apikey: service, authorization: `Bearer ${service}` } });
    if (!del.ok) {
      console.error("borrar-cuenta: delete failed", del.status, await del.text());
      return json({ error: "No hemos podido borrar la cuenta. Inténtalo de nuevo o escríbenos." }, 502);
    }
    return json({ ok: true });
  } catch (e) {
    console.error("borrar-cuenta: unexpected failure", e);
    return json({ error: "No hemos podido borrar la cuenta. Inténtalo de nuevo en unos minutos." }, 502);
  }
}

export const OPTIONS = async (): Promise<Response> => new Response(null, { status: 204, headers: CORS });
