import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { esPro, firmaValida } from "./_paddle.js";
import { POST as portal } from "./paddle-portal.js";
import { POST, aFila } from "./paddle-webhook.js";

const U = "11111111-1111-1111-1111-111111111111";
const firma = (raw: string, secret = "whsec", ts = Math.floor(Date.now() / 1000)) => `ts=${ts};h1=${createHmac("sha256", secret).update(`${ts}:${raw}`).digest("hex")}`;
const evento = (over: Record<string, unknown> = {}) => ({
  event_type: "subscription.created", occurred_at: "2026-11-04T10:00:00Z",
  data: { id: "sub_1", status: "trialing", customer_id: "ctm_1", custom_data: { user_id: U }, items: [{ price: { id: "pri_mes" } }], current_billing_period: { ends_at: "2026-11-18T10:00:00Z" }, scheduled_change: null, ...over },
});

describe("firma de Paddle", () => {
  it("acepta la firma buena y rechaza la mala, la de otro secreto o una vieja", () => {
    const raw = '{"a":1}';
    expect(firmaValida(firma(raw), raw, "whsec")).toBe(true);
    expect(firmaValida(firma(raw), '{"a":2}', "whsec")).toBe(false);
    expect(firmaValida(firma(raw, "otro"), raw, "whsec")).toBe(false);
    expect(firmaValida(firma(raw, "whsec", Math.floor(Date.now() / 1000) - 3600), raw, "whsec")).toBe(false);
    expect(firmaValida("", raw, "whsec")).toBe(false);
  });
  it("Pro durante la prueba, pagando o reintentando el cobro", () => {
    expect(["trialing", "active", "past_due"].every(esPro)).toBe(true);
    expect(["paused", "canceled", null].some(esPro)).toBe(false);
  });
});

describe("aFila", () => {
  it("guarda lo necesario de la suscripción", () => {
    expect(aFila(evento({ scheduled_change: { action: "cancel" } }))).toEqual({
      user_id: U, paddle_subscription_id: "sub_1", paddle_customer_id: "ctm_1", estado: "trialing", precio_id: "pri_mes",
      periodo_fin: "2026-11-18T10:00:00Z", cancela_al_final: true, evento_at: "2026-11-04T10:00:00Z",
    });
  });
  it("ignora eventos que no son de suscripción o sin cuenta válida", () => {
    expect(aFila({ ...evento(), event_type: "transaction.completed" })).toBeNull();
    expect(aFila(evento({ custom_data: { user_id: "x' or 1=1" } }))).toBeNull();
    expect(aFila(evento({ custom_data: null }))).toBeNull();
  });
});

describe("POST /api/paddle-webhook", () => {
  let calls: { url: string; init: RequestInit }[];
  let previo: unknown[];
  beforeEach(() => {
    calls = []; previo = [];
    vi.stubEnv("PADDLE_WEBHOOK_SECRET", "whsec"); vi.stubEnv("SUPABASE_URL", "https://p.supabase.co"); vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "sb_secret_x");
    vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit = {}) => {
      calls.push({ url, init });
      return url.includes("select=evento_at") ? new Response(JSON.stringify(previo)) : new Response(null, { status: 201 });
    }));
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
  const llamar = (body: unknown, sig?: string) => { const raw = JSON.stringify(body); return POST(new Request("https://x/api/paddle-webhook", { method: "POST", body: raw, headers: { "paddle-signature": sig ?? firma(raw) } })); };

  it("guarda la suscripción", async () => {
    expect((await llamar(evento())).status).toBe(200);
    const up = calls.find((c) => c.init.method === "POST")!;
    expect(up.url).toBe("https://p.supabase.co/rest/v1/suscripciones?on_conflict=user_id");
    expect(JSON.parse(String(up.init.body))).toMatchObject({ user_id: U, estado: "trialing" });
  });
  it("rechaza una firma falsa sin tocar la base de datos", async () => {
    expect((await llamar(evento(), "ts=1;h1=abc")).status).toBe(401);
    expect(calls).toHaveLength(0);
  });
  it("no pisa un estado más reciente con un evento viejo", async () => {
    previo = [{ evento_at: "2026-11-05T00:00:00Z" }];
    expect((await llamar(evento({ status: "active" }))).status).toBe(200);
    expect(calls.some((c) => c.init.method === "POST")).toBe(false);
  });
});

describe("POST /api/paddle-portal", () => {
  beforeEach(() => {
    vi.stubEnv("PADDLE_API_KEY", "pdl_key"); vi.stubEnv("PADDLE_ENV", "sandbox"); vi.stubEnv("SUPABASE_URL", "https://p.supabase.co"); vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "sb_secret_x");
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.endsWith("/auth/v1/user")) return new Response(JSON.stringify({ id: U }));
      if (url.includes("/rest/v1/suscripciones")) return new Response(JSON.stringify([{ paddle_customer_id: "ctm_1", paddle_subscription_id: "sub_1" }]));
      if (url.startsWith("https://sandbox-api.paddle.com/customers/ctm_1/portal-sessions")) return new Response(JSON.stringify({ data: { urls: { general: { overview: "https://portal/x" } } } }));
      return new Response("?", { status: 500 });
    }));
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
  it("devuelve el enlace del portal de la propia suscripción", async () => {
    const r = await portal(new Request("https://x", { method: "POST", headers: { authorization: "Bearer tok" } }));
    expect(await r.json()).toEqual({ url: "https://portal/x" });
  });
  it("sin sesión, nada", async () => {
    expect((await portal(new Request("https://x", { method: "POST" }))).status).toBe(401);
  });
});
