import { describe, expect, it } from "vitest";
import { IMPORTES, ROUTES, routeFor } from "./routes";

describe("routes", () => {
  it("every page has a unique path, title and description", () => {
    for (const k of ["path", "title", "description"] as const) expect(new Set(ROUTES.map((r) => r[k])).size).toBe(ROUTES.length);
  });
  it("titles and descriptions fit search result limits", () => {
    for (const r of ROUTES) { expect(r.title.length).toBeLessThanOrEqual(90); expect(r.description.length).toBeLessThanOrEqual(220); }
  });
  it("has one page per amount, more than the competition's 25", () => {
    expect(ROUTES.filter((r) => r.kind === "cuota-x")).toHaveLength(IMPORTES.length);
    expect(IMPORTES.length).toBeGreaterThan(25);
  });
  it("falls back to home for unknown paths", () => expect(routeFor("/nope").kind).toBe("home"));
  it("breadcrumbs end at the page itself", () => { for (const r of ROUTES) expect(r.crumbs[r.crumbs.length - 1].path).toBe(r.path); });
});
