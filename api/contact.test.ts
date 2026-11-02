import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST, _resetLimiter } from "./contact.js";

const ENV = { RESEND_API_KEY: "re_test", EMAIL_FROM: "Cuotio <hola@example.com>", CONTACT_EMAIL: "yo@example.com" };
const req = (body: unknown, ip = "1.1.1.1") => new Request("https://x/api/contact", { method: "POST", headers: { "x-forwarded-for": ip }, body: JSON.stringify(body) });
let sent: any[];

beforeEach(() => {
  _resetLimiter(); sent = [];
  for (const [k, v] of Object.entries(ENV)) vi.stubEnv(k, v);
  vi.stubGlobal("fetch", vi.fn(async (_u: string, init: RequestInit) => { sent.push(JSON.parse(String(init.body))); return new Response("{}", { status: 200 }); }));
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("POST /api/contact", () => {
  it("sends a contact message to the owner with reply-to set to the visitor", async () => {
    const r = await POST(req({ kind: "contacto", name: "Ana", email: "Ana@Example.com", message: "Hola, me interesa", consent: true }));
    expect(r.status).toBe(200);
    expect(sent[0].to).toEqual(["yo@example.com"]);
    expect(sent[0].reply_to).toBe("ana@example.com");
    expect(sent[0].html).toContain("Hola, me interesa");
  });
  it("requires email, message and consent for contact", async () => {
    expect((await POST(req({ kind: "contacto", message: "Hola", consent: true }))).status).toBe(400);
    expect((await POST(req({ kind: "contacto", email: "a@b.com", message: "", consent: true }))).status).toBe(400);
    expect((await POST(req({ kind: "contacto", email: "a@b.com", message: "Hola hola" }))).status).toBe(400);
    expect(sent).toHaveLength(0);
  });
  it("accepts anonymous feedback with just a rating", async () => {
    const r = await POST(req({ kind: "opinion", rating: 4, usaria: "si" }));
    expect(r.status).toBe(200);
    expect(sent[0].subject).toBe("Opinión de la demo · 4/5");
    expect(sent[0].reply_to).toBeUndefined();
  });
  it("escapes user input in the email", async () => {
    await POST(req({ kind: "opinion", rating: 3, message: "<img src=x onerror=alert(1)>" }));
    expect(sent[0].html).not.toContain("<img src=x");
  });
  it("drops honeypot submissions silently", async () => {
    expect((await POST(req({ kind: "opinion", rating: 5, website: "spam" }))).status).toBe(200);
    expect(sent).toHaveLength(0);
  });
  it("rate limits", async () => {
    for (let i = 0; i < 8; i++) await POST(req({ kind: "opinion", rating: 5 }));
    expect((await POST(req({ kind: "opinion", rating: 5 }))).status).toBe(429);
  });
  it("returns 503 when not configured", async () => {
    vi.stubEnv("CONTACT_EMAIL", ""); vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await POST(req({ kind: "opinion", rating: 5 }))).status).toBe(503);
  });
});
