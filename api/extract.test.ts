import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST, _resetLimiter, validar } from "./extract.js";

const req = (body: unknown, ip = "1.1.1.1") => new Request("https://x/api/extract", { method: "POST", headers: { "x-forwarded-for": ip }, body: JSON.stringify(body) });
const reply = (o: unknown) => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(o) }] } }] }), { status: 200 });
const good = { es_factura: true, tipo: "gasto", fecha: "2026-10-03", numero: "NH-1", emisor: "Nube Hosting", cliente: "Ana", concepto: "Hosting", base_imponible: 190, iva: 39.9, retencion_irpf: 0, total: 229.9 };
let sent: any;

beforeEach(() => { _resetLimiter(); sent = null; vi.stubEnv("AI_API_KEY", "k"); vi.stubGlobal("fetch", vi.fn(async (u: string, init: RequestInit) => { sent = { u, init, body: JSON.parse(String(init.body)) }; return reply(good); })); });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("validar", () => {
  it("accepts consistent invoices and flags inconsistent totals", () => {
    expect(validar(good)).toMatchObject({ base: 190, iva: 39.9, total: 229.9, cuadra: true, tipo: "gasto" });
    expect(validar({ ...good, total: 500 })!.cuadra).toBe(false);
  });
  it("handles IRPF withholding (freelancer income)", () => {
    expect(validar({ ...good, tipo: "ingreso", base_imponible: 1650, iva: 346.5, retencion_irpf: 247.5, total: 1749 })).toMatchObject({ cuadra: true, irpf: 247.5 });
  });
  it("derives the base from total and VAT when missing", () => expect(validar({ ...good, base_imponible: 0 })!.base).toBe(190));
  it("rejects non-invoices and bad dates", () => {
    expect(validar({ ...good, es_factura: false })).toBeNull();
    expect(validar({ ...good, fecha: "ayer" })!.fecha).toBeNull();
  });
});

describe("POST /api/extract", () => {
  const pdf = { name: "f.pdf", mime: "application/pdf", data: "JVBERi0xLjQK" };
  it("sends the document inline with a JSON schema and returns validated fields", async () => {
    const r = await POST(req(pdf));
    expect(r.status).toBe(200);
    expect((await r.json()).factura).toMatchObject({ base: 190, cuadra: true });
    expect(sent.u).toContain("generateContent");
    expect(sent.init.headers["x-goog-api-key"]).toBe("k");
    expect(sent.body.contents[0].parts[0].inline_data).toEqual({ mime_type: "application/pdf", data: "JVBERi0xLjQK" });
    expect(sent.body.generationConfig.responseMimeType).toBe("application/json");
  });
  it("rejects unsupported types and oversized files without calling the model", async () => {
    expect((await POST(req({ ...pdf, mime: "application/zip" }))).status).toBe(400);
    expect((await POST(req({ ...pdf, data: "A".repeat(4_400_000) }))).status).toBe(400);
    expect(sent).toBeNull();
  });
  it("returns 422 when the model says it is not an invoice", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply({ ...good, es_factura: false })));
    expect((await POST(req(pdf))).status).toBe(422);
  });
  it("returns 503 without a key and 502 on provider errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => new Response("boom", { status: 500 })));
    expect((await POST(req(pdf))).status).toBe(502);
    vi.stubEnv("AI_API_KEY", "");
    expect((await POST(req(pdf))).status).toBe(503);
  });
  it("rate limits", async () => {
    for (let i = 0; i < 15; i++) await POST(req(pdf));
    expect((await POST(req(pdf))).status).toBe(429);
  });
});
