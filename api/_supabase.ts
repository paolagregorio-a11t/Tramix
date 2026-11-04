/** Server-side access to Supabase with the secret key. Only for scheduled jobs and admin actions; never reaches the browser. */
export function supabaseAdmin() {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  // New-style secret keys (sb_secret_…) go only in the apikey header; legacy service_role keys are JWTs and also go as Bearer.
  const headers: Record<string, string> = key.startsWith("sb_secret_") ? { apikey: key } : { apikey: key, authorization: `Bearer ${key}` };
  return {
    ok: Boolean(url && key),
    missing: [!url && "VITE_SUPABASE_URL", !key && "SUPABASE_SERVICE_ROLE_KEY"].filter(Boolean) as string[],
    /** PostgREST: rest("perfiles?select=…") */
    rest: (path: string, init: RequestInit = {}) =>
      fetch(`${url}/rest/v1/${path}`, { ...init, headers: { ...headers, "content-type": "application/json", ...(init.headers ?? {}) } }),
    auth: (path: string, init: RequestInit = {}) =>
      fetch(`${url}/auth/v1/${path}`, { ...init, headers: { ...headers, ...(init.headers ?? {}) } }),
  };
}
export type SupabaseAdmin = ReturnType<typeof supabaseAdmin>;
