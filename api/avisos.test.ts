import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sign } from "./_lib.js";
import { GET, hoyEnEspana, planificar, ventanaParaAvisar, type FilaMes, type Perfil } from "./avisos.js";
import { GET as baja } from "./avisos-baja.js";

const A = "11111111-1111-1111-1111-111111111111", B = "22222222-2222-2222-2222-222222222222";
const todos = [true, true, true, true, true, true];
const perfil = (id: string, avisos = todos): Perfil => ({ user_id: id, tramo_actual: 3, regimen: "persona-fisica", avisos });
const meses = (id: string, n: number, ingresos = 4000): FilaMes[] => Array.from({ length: n }, (_, i) => ({ user_id: id, mes: i + 1, ingresos, gastos: 500 }));

describe("ventanaParaAvisar", () => {
  it("avisa en los 7 días antes del plazo, nunca antes", () => {
    expect(ventanaParaAvisar(new Date(2026, 9, 23))).toBeNull();                    // 8 días antes del 31 oct
    expect(ventanaParaAvisar(new Date(2026, 9, 24))).toMatchObject({ dias: 7, indice: 4 });
    expect(ventanaParaAvisar(new Date(2026, 9, 31))).toMatchObject({ dias: 0, indice: 4 });
    expect(ventanaParaAvisar(new Date(2026, 1, 21))).toMatchObject({ dias: 7, indice: 0 }); // 28 feb
    expect(ventanaParaAvisar(new Date(2026, 11, 28))).toMatchObject({ dias: 3, indice: 5 }); // 31 dic
  });
  it("usa la fecha de España, no la del servidor", () => {
    const d = hoyEnEspana(new Date("2026-10-30T23:30:00Z")); // ya es 31 en Madrid
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 9, 31]);
  });
});

describe("planificar", () => {
  const hoy = new Date(2026, 9, 26);
  it("solo a quien tiene el aviso encendido, meses guardados y no lo ha recibido ya", () => {
    const off = [true, true, true, true, false, true];
    const C = "33333333-3333-3333-3333-333333333333", D = "44444444-4444-4444-4444-444444444444";
    const plan = planificar(hoy, [perfil(A), perfil(B, off), perfil(C), perfil(D)], [...meses(A, 9), ...meses(B, 9), ...meses(D, 9)], new Set([D]));
    expect(plan.map((e) => e.userId)).toEqual([A]);
    expect(plan[0]).toMatchObject({ dias: 5, tramoActual: 3, accion: "subir" });
    expect(plan[0].tramoObjetivo).toBeGreaterThan(3);
    expect(plan[0].rango).toMatch(/^tramo \d+(–\d+)?$/);
  });
  it("nada fuera de plazo", () => {
    expect(planificar(new Date(2026, 9, 10), [perfil(A)], meses(A, 9), new Set())).toEqual([]);
  });
});

describe("GET /api/avisos", () => {
  const calls: { url: string; init: RequestInit }[] = [];
  beforeEach(() => {
    calls.length = 0;
    vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date("2026-10-26T07:00:00Z"));
    for (const [k, v] of Object.entries({ CRON_SECRET: "cron", SUPABASE_URL: "https://p.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "sb_secret_x", RESEND_API_KEY: "re_x", EMAIL_FROM: "Cuotio <hola@cuotio.es>", UNSUBSCRIBE_SECRET: "s", SITE_URL: "https://cuotio.es" })) vi.stubEnv(k, v);
    vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit = {}) => {
      calls.push({ url, init });
      const ok = (b: unknown) => new Response(JSON.stringify(b), { status: 200 });
      if (url.includes("/rest/v1/perfiles")) return ok([perfil(A), perfil(B)]);
      if (url.includes("/rest/v1/meses")) return ok([...meses(A, 9), ...meses(B, 9)]);
      if (url.includes("/rest/v1/avisos_enviados?select")) return ok([{ user_id: B }]);
      if (url.includes("/rest/v1/avisos_enviados")) return new Response(null, { status: 201 });
      if (url.includes("/auth/v1/admin/users/")) return ok({ email: "ana@example.com" });
      if (url.includes("api.resend.com")) return ok({ id: "e1" });
      return new Response("?", { status: 500 });
    }));
  });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

  it("rechaza llamadas sin el secreto del cron", async () => {
    expect((await GET(new Request("https://x/api/avisos"))).status).toBe(401);
    expect(calls).toHaveLength(0);
  });
  it("envía una vez a quien toca y lo apunta", async () => {
    const r = await GET(new Request("https://x/api/avisos", { headers: { authorization: "Bearer cron" } }));
    expect(await r.json()).toMatchObject({ ok: true, limite: "2026-10-31", previstos: 1, enviados: 1, fallos: 0 });
    const mail = calls.find((c) => c.url.includes("resend"))!;
    const body = JSON.parse(String(mail.init.body));
    expect(body.to).toEqual(["ana@example.com"]);
    expect(body.subject).toContain("Plazo en 5 días");
    expect(body.headers["List-Unsubscribe"]).toContain(`/api/avisos-baja?u=${A}&t=${sign(A, "s")}`);
    const claim = calls.find((c) => c.url.endsWith("/rest/v1/avisos_enviados"))!;
    expect(JSON.parse(String(claim.init.body))).toEqual({ user_id: A, limite: "2026-10-31" });
    expect((claim.init.headers as Record<string, string>).apikey).toBe("sb_secret_x");
  });
  it("si el email falla, libera el registro para reintentarlo mañana", async () => {
    const f = fetch as unknown as ReturnType<typeof vi.fn>;
    const base = f.getMockImplementation() as (url: string, init?: RequestInit) => Promise<Response>;
    f.mockImplementation(async (url: string, init?: RequestInit) => (url.includes("resend") ? new Response("down", { status: 500 }) : base(url, init)));
    const r = await GET(new Request("https://x/api/avisos", { headers: { authorization: "Bearer cron" } }));
    expect(await r.json()).toMatchObject({ enviados: 0, fallos: 1 });
    expect(calls.some((c) => c.init.method === "DELETE" && c.url.includes(`avisos_enviados?user_id=eq.${A}`))).toBe(true);
  });
});

describe("GET /api/avisos-baja", () => {
  beforeEach(() => {
    vi.stubEnv("UNSUBSCRIBE_SECRET", "s"); vi.stubEnv("SUPABASE_URL", "https://p.supabase.co"); vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "sb_secret_x");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 204 })));
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
  it("apaga los avisos con un enlace firmado", async () => {
    const r = await baja(new Request(`https://x/api/avisos-baja?u=${A}&t=${sign(A, "s")}`));
    expect(r.status).toBe(200);
    const [url, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe(`https://p.supabase.co/rest/v1/perfiles?user_id=eq.${A}`);
    expect(JSON.parse(init.body).avisos).toEqual([false, false, false, false, false, false]);
  });
  it("no hace nada con una firma falsa", async () => {
    expect((await baja(new Request(`https://x/api/avisos-baja?u=${A}&t=${sign(B, "s")}`))).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("planificar con suscripciones activas", () => {
  it("solo avisa a quien tiene Pro", () => {
    const plan = planificar(new Date(2026, 9, 26), [perfil(A), perfil(B)], [...meses(A, 9), ...meses(B, 9)], new Set(), new Set([B]));
    expect(plan.map((e) => e.userId)).toEqual([B]);
  });
});
