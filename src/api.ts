/** Small client for our serverless API. In sandboxed previews there is no server, so we say so honestly. */
const API = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";
export const PREVIEW = import.meta.env.VITE_PREVIEW === "1";

export async function postJSON(path: string, body: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API}${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    return res.ok ? { ok: true } : { ok: false, error: data.error || "No se ha podido enviar. Inténtalo de nuevo." };
  } catch {
    return { ok: false, error: "No hay conexión. Inténtalo de nuevo en un momento." };
  }
}
