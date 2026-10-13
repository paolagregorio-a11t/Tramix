import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as joinPost } from "./waitlist";
import { GET as unsubGet, POST as unsubPost } from "./unsubscribe";
import { sign } from "./_lib";

const ENV = { RESEND_API_KEY: "re_test", RESEND_AUDIENCE_ID: "aud_1", EMAIL_FROM: "Tramix <hola@example.com>", UNSUBSCRIBE_SECRET: "s3cret", SITE_URL: "https://tramix.example", CONTACT_EMAIL: "hola@example.com" };
const req = (body: unknown) => new Request("https://x/api/waitlist", { method: "POST", body: JSON.stringify(body) });
let calls: { url: string; init?: RequestInit }[];

function mockResend(handlers: Record<string, () => Response>) {
  calls = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    const key = `${init?.method ?? "GET"} ${new URL(url).pathname.replace(/\/contacts\/[^/]+$/, "/contacts/:e")}`;
    return (handlers[key] ?? (() => new Response("{}", { status: 200 })))();
  }));
}

beforeEach(() => { for (const [k, v] of Object.entries(ENV)) vi.stubEnv(k, v); });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("POST /api/waitlist", () => {
  const notFound = () => new Response("{}", { status: 404 });
  it("saves a new contact and sends the welcome email", async () => {
    mockResend({ "GET /audiences/aud_1/contacts/:e": notFound });
    const r = await joinPost(req({ email: "Ana@Example.com ", consent: true }));
    expect(r.status).toBe(200);
    const send = calls.find((c) => c.url.endsWith("/emails"))!;
    const body = JSON.parse(String(send.init!.body));
    expect(body.to).toEqual(["ana@example.com"]);
    expect(body.from).toBe(ENV.EMAIL_FROM);
    expect(body.html).toContain("Ya estás en la lista de Tramix");
    expect(body.html).toContain("cid:tramix-logo");
    expect(body.attachments[0].content_id).toBe("tramix-logo");
    expect(body.headers["List-Unsubscribe"]).toContain("/api/unsubscribe?email=ana%40example.com&t=");
  });
  it("does not email an address that is already on the list", async () => {
    mockResend({});
    const r = await joinPost(req({ email: "ana@example.com", consent: true }));
    expect(r.status).toBe(200);
    expect(calls.some((c) => c.url.endsWith("/emails"))).toBe(false);
  });
  it("requires consent", async () => {
    mockResend({});
    expect((await joinPost(req({ email: "ana@example.com", consent: false }))).status).toBe(400);
    expect(calls).toHaveLength(0);
  });
  it("rejects invalid emails", async () => {
    mockResend({});
    for (const email of ["", "nope", "a@b", "a b@c.com", 5]) expect((await joinPost(req({ email, consent: true }))).status).toBe(400);
  });
  it("ignores honeypot submissions without calling the provider", async () => {
    mockResend({});
    const r = await joinPost(req({ email: "bot@example.com", consent: true, website: "http://spam" }));
    expect(r.status).toBe(200);
    expect(calls).toHaveLength(0);
  });
  it("reports a clear 503 when not configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    mockResend({});
    expect((await joinPost(req({ email: "ana@example.com", consent: true }))).status).toBe(503);
  });
  it("still succeeds for the user if only the email send fails", async () => {
    mockResend({ "GET /audiences/aud_1/contacts/:e": notFound, "POST /emails": () => new Response("{}", { status: 500 }) });
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await joinPost(req({ email: "ana@example.com", consent: true }))).status).toBe(200);
  });
  it("answers 502, never crashes, when the provider is unreachable", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("fetch failed"); }));
    expect((await joinPost(req({ email: "ana@example.com", consent: true }))).status).toBe(502);
  });
  it("fails visibly when the contact cannot be stored", async () => {
    mockResend({ "GET /audiences/aud_1/contacts/:e": notFound, "POST /audiences/aud_1/contacts": () => new Response("{}", { status: 500 }) });
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await joinPost(req({ email: "ana@example.com", consent: true }))).status).toBe(502);
  });
});

describe("/api/unsubscribe", () => {
  const link = (email: string, t = sign(email, "s3cret")) => `https://x/api/unsubscribe?email=${encodeURIComponent(email)}&t=${t}`;
  it("unsubscribes with a valid token", async () => {
    mockResend({});
    const r = await unsubGet(new Request(link("ana@example.com")));
    expect(r.status).toBe(200);
    expect(calls[0].init?.method).toBe("PATCH");
  });
  it("rejects a forged token and never calls the provider", async () => {
    mockResend({});
    expect((await unsubGet(new Request(link("ana@example.com", "0".repeat(32))))).status).toBe(400);
    expect(calls).toHaveLength(0);
  });
  it("supports one-click POST", async () => {
    mockResend({});
    expect((await unsubPost(new Request(link("ana@example.com"), { method: "POST" }))).status).toBe(200);
  });
});
