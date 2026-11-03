import { describe, expect, it } from "vitest";
import { alertaEmail } from "./alerta.js";
import { welcomeEmail } from "./welcome.js";
import { codigoEmail } from "./codigo.js";
import { readFileSync } from "node:fs";

const brand = { site: "https://cuotio.example", unsubscribeUrl: "https://cuotio.example/api/unsubscribe?x=1", contactEmail: "hola@cuotio.example", senderName: "El equipo de Cuotio" };
const data = { dias: 18, limite: "31 de octubre", efecto: "1 de noviembre", tramoActual: 7, tramoObjetivo: 10, rangoTexto: "tramo 9–10", importe: 1100, accion: "subir" as const, appUrl: "https://cuotio.example/#demo" };

describe("emails", () => {
  it("welcome has subject, brand logo, unsubscribe link and a plain-text part", () => {
    const m = welcomeEmail(brand);
    expect(m.subject).toBe("Estás en la lista de Cuotio");
    expect(m.html).toContain("https://cuotio.example/email/logo.png");
    expect(m.html).toContain(brand.unsubscribeUrl);
    expect(m.text).toContain(brand.unsubscribeUrl);
    expect(m.html).not.toMatch(/undefined|\[object/);
  });
  it("alert formats the amount with a thousands separator", () => {
    const m = alertaEmail(brand, data);
    expect(m.html).toContain("1.100 €");
    expect(m.subject).toContain("18 días");
  });
  it("alert adapts wording to the action", () => {
    expect(alertaEmail(brand, { ...data, accion: "mantener" }).html).toContain("Mantén tu tramo 7");
    expect(alertaEmail(brand, { ...data, accion: "bajar", tramoObjetivo: 5 }).html).toContain("Conviene bajar al tramo 5");
  });
  it("escapes injected markup in dynamic fields", () => {
    expect(alertaEmail(brand, { ...data, limite: "<script>x</script>" }).html).not.toContain("<script>x</script>");
  });
  it("sign-in code email carries the Supabase code placeholder and no unsubscribe link", () => {
    const m = codigoEmail(brand);
    expect(m.html).toContain("{{ .Token }}");
    expect(m.html).not.toContain("Darme de baja");
    expect(readFileSync("supabase/templates/codigo.html", "utf8")).toContain("{{ .Token }}");
  });
});
