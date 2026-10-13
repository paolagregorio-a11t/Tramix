import { describe, expect, it } from "vitest";
import { TABLA_2026 } from "./tramos";
import { cuotaMinima, proximaVentana, proyectar, recomendar, rendimientoMes, tramoPara, ventanas } from "./calc";

describe("rendimientoMes", () => {
  it("applies the 7% generic deduction to income minus expenses", () => {
    expect(rendimientoMes({ ingresos: 2000, gastos: 500 })).toBeCloseTo(1395);
  });
  it("uses 3% for societario", () => {
    expect(rendimientoMes({ ingresos: 2000, gastos: 500 }, "societario")).toBeCloseTo(1455);
  });
  it("never goes negative", () => {
    expect(rendimientoMes({ ingresos: 100, gastos: 900 })).toBe(0);
  });
});

describe("tramoPara", () => {
  it("handles bounds inclusively", () => {
    expect(tramoPara(0, TABLA_2026)).toBe(1);
    expect(tramoPara(670, TABLA_2026)).toBe(1);
    expect(tramoPara(670.01, TABLA_2026)).toBe(2);
    expect(tramoPara(6000, TABLA_2026)).toBe(14);
    expect(tramoPara(9000, TABLA_2026)).toBe(15);
  });
  it("is monotonic", () => {
    let prev = 0;
    for (let y = 0; y < 8000; y += 25) { const n = tramoPara(y, TABLA_2026); expect(n).toBeGreaterThanOrEqual(prev); prev = n; }
  });
});

describe("tabla 2026", () => {
  it("has 15 tramos with strictly increasing upper bounds", () => {
    expect(TABLA_2026.tramos).toHaveLength(15);
    TABLA_2026.tramos.slice(1).forEach((x, i) => expect(x.hasta).toBeGreaterThan(TABLA_2026.tramos[i].hasta));
  });
  it("matches the minimum quotas published by independent sources", () => {
    expect(cuotaMinima(1, TABLA_2026)).toBe(205.88);
    expect(cuotaMinima(15, TABLA_2026)).toBe(607.35);
  });
  it("never lowers the minimum base as yield rises", () => {
    TABLA_2026.tramos.slice(1).forEach((x, i) => expect(x.baseMin).toBeGreaterThanOrEqual(TABLA_2026.tramos[i].baseMin));
  });
});

describe("cuotaMinima", () => {
  it("is base x rate, rounded to cents", () => {
    expect(cuotaMinima(1, TABLA_2026)).toBe(Math.round(653.59 * 0.315 * 100) / 100);
  });
});

describe("proyectar", () => {
  const meses = Array.from({ length: 9 }, () => ({ ingresos: 2000, gastos: 500 }));
  it("returns null with no data", () => expect(proyectar([], TABLA_2026)).toBeNull());
  it("returns an ordered range", () => {
    const p = proyectar(meses, TABLA_2026)!;
    expect(p.bajo).toBeLessThanOrEqual(p.medio);
    expect(p.medio).toBeLessThanOrEqual(p.alto);
    expect(p.tramoBajo).toBeLessThanOrEqual(p.tramoAlto);
  });
  it("collapses to a point when the year is complete", () => {
    const p = proyectar(Array.from({ length: 12 }, () => ({ ingresos: 2000, gastos: 500 })), TABLA_2026)!;
    expect(p.tramoBajo).toBe(p.tramoAlto);
  });
});

describe("proyectar con escenario", () => {
  const meses = Array.from({ length: 9 }, () => ({ ingresos: 2000, gastos: 500 }));
  it("uses the scenario for the remaining months with no band", () => {
    const p = proyectar(meses, TABLA_2026, "persona-fisica", 0.15, 5000)!;
    expect(p.bajo).toBeCloseTo(p.alto);
    expect(p.restante).toBe(5000);
  });
  it("a higher scenario never lowers the tramo", () => {
    const lo = proyectar(meses, TABLA_2026, "persona-fisica", 0.15, 1000)!;
    const hi = proyectar(meses, TABLA_2026, "persona-fisica", 0.15, 4000)!;
    expect(hi.tramoMedio).toBeGreaterThanOrEqual(lo.tramoMedio);
  });
});

describe("recomendar", () => {
  const meses = Array.from({ length: 9 }, () => ({ ingresos: 2600, gastos: 400 }));
  it("keeps the tramo when it sits inside the range", () => {
    const p = proyectar(meses, TABLA_2026)!;
    expect(recomendar(p.tramoMedio, p, TABLA_2026).accion).toBe("mantener");
  });
  it("suggests raising when you pay a lower tramo than projected", () => {
    const p = proyectar(meses, TABLA_2026)!;
    const r = recomendar(1, p, TABLA_2026);
    expect(r.accion).toBe("subir");
    expect(r.ahorro).toBeGreaterThan(0);
  });
  it("suggests lowering when you pay a higher tramo than projected", () => {
    const p = proyectar(meses, TABLA_2026)!;
    expect(recomendar(15, p, TABLA_2026).accion).toBe("bajar");
  });
});

describe("ventanas", () => {
  it("has six windows with deadlines on the last day of the previous month", () => {
    const v = ventanas(2026);
    expect(v).toHaveLength(6);
    expect(v[4].efecto.getMonth()).toBe(8);
    expect(v[4].limite.getDate()).toBe(31);
    expect(v[4].limite.getMonth()).toBe(7);
  });
  it("finds the next deadline", () => {
    const { ventana, dias } = proximaVentana(new Date(2026, 9, 13));
    expect(ventana.limite.getMonth()).toBe(9);
    expect(ventana.limite.getDate()).toBe(31);
    expect(dias).toBe(18);
  });
  it("rolls into next year after the last window", () => {
    const { ventana } = proximaVentana(new Date(2026, 11, 20));
    expect(ventana.limite.getFullYear()).toBe(2026);
    expect(ventana.limite.getMonth()).toBe(11);
    const next = proximaVentana(new Date(2027, 0, 5));
    expect(next.ventana.limite.getMonth()).toBe(1);
  });
});
