import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./borrar-cuenta.js";

const ID = "11111111-1111-1111-1111-111111111111";
const req = (token?: string) => new Request("https://x/api/borrar-cuenta", { method: "POST", headers: token ? { authorization: `Bearer ${token}` } : {} });
let calls: { url: string; init: RequestInit }[];
let userOk: boolean;

beforeEach(() => {
  calls = []; userOk = true;
  vi.stubEnv("SUPABASE_URL", "https://p.supabase.co/");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service");
  vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit = {}) => {
    calls.push({ url, init });
    if (url.endsWith("/auth/v1/user")) return userOk ? new Response(JSON.stringify({ id: ID }), { status: 200 }) : new Response("{}", { status: 401 });
    return new Response("{}", { status: 200 });
  }));
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("POST /api/borrar-cuenta", () => {
  it("borra solo la cuenta del dueño del token", async () => {
    const r = await POST(req("tok"));
    expect(r.status).toBe(200);
    expect((calls[0].init.headers as Record<string, string>).authorization).toBe("Bearer tok");
    expect(calls[1].url).toBe(`https://p.supabase.co/auth/v1/admin/users/${ID}`);
    expect(calls[1].init.method).toBe("DELETE");
  });
  it("sin sesión o con sesión caducada no borra nada", async () => {
    expect((await POST(req())).status).toBe(401);
    userOk = false;
    expect((await POST(req("caducado"))).status).toBe(401);
    expect(calls.filter((c) => c.init.method === "DELETE")).toHaveLength(0);
  });
  it("avisa si falta la configuración", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    expect((await POST(req("tok"))).status).toBe(503);
    expect(calls).toHaveLength(0);
  });
});
