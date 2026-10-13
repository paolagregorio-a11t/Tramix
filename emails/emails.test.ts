import { describe, expect, it } from "vitest";
import { alertaEmail } from "./alerta";
import { welcomeEmail } from "./welcome";

const brand = { site: "https://tramix.example", unsubscribeUrl: "https://tramix.example/api/unsubscribe?x=1", contactEmail: "hola@tramix.example", senderName: "El equipo de Tramix" };
const data = { dias: 18, limite: "31 de octubre", efecto: "1 de noviembre", tramoActual: 7, tramoObjetivo: 10, rangoTexto: "tramo 9–10", importe: 1100, accion: "subir" as const, appUrl: "https://tramix.example/#demo" };

describe("emails", () => {
  it("welcome has subject, brand logo, unsubscribe link and a plain-text part", () => {
    const m = welcomeEmail(brand);
    expect(m.subject).toBe("Estás en la lista de Tramix");
    expect(m.html).toContain("https://tramix.example/email/logo.png");
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
});
