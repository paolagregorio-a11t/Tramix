import { describe, expect, it } from "vitest";
import { aEstado, cambios } from "./datos";
import type { DemoState } from "../demo/useDemoState";

const U = "u1";
const base: DemoState = { meses: [{ ingresos: 1000, gastos: 100 }, { ingresos: 2000, gastos: 200 }], tramoActual: 5, regimen: "persona-fisica", avisos: [true, true, true, true, true, true] };

describe("cuenta: datos", () => {
  it("convierte filas en estado, en orden y con importes numéricos", () => {
    const s = aEstado({ user_id: U, tramo_actual: 7, regimen: "societario", avisos: [true, false, true, true, true, true] },
      [{ user_id: U, anio: 2026, mes: 2, ingresos: "2000.50", gastos: "10" }, { user_id: U, anio: 2026, mes: 1, ingresos: 900, gastos: 0 }]);
    expect(s).toEqual({ meses: [{ ingresos: 900, gastos: 0 }, { ingresos: 2000.5, gastos: 10 }], tramoActual: 7, regimen: "societario", avisos: [true, false, true, true, true, true] });
  });

  it("no coloca meses sueltos en el sitio equivocado", () => {
    const s = aEstado({ user_id: U, tramo_actual: 1, regimen: "persona-fisica", avisos: [] }, [{ user_id: U, anio: 2026, mes: 3, ingresos: 1, gastos: 0 }]);
    expect(s.meses).toEqual([]);
    expect(s.avisos).toHaveLength(6);
  });

  it("en el alta guarda el perfil y todos los meses", () => {
    const c = cambios(U, 2026, null, base);
    expect(c.perfil).toBe(true);
    expect(c.guardar.map((f) => f.mes)).toEqual([1, 2]);
    expect(c.borrar).toEqual([]);
  });

  it("solo escribe lo que ha cambiado", () => {
    const c = cambios(U, 2026, base, { ...base, meses: [base.meses[0], { ingresos: 2500, gastos: 200 }, { ingresos: 3000.456, gastos: 1 }] });
    expect(c.perfil).toBe(false);
    expect(c.guardar).toEqual([{ user_id: U, anio: 2026, mes: 2, ingresos: 2500, gastos: 200 }, { user_id: U, anio: 2026, mes: 3, ingresos: 3000.46, gastos: 1 }]);
  });

  it("borra los meses quitados y detecta cambios de ajustes", () => {
    const c = cambios(U, 2026, base, { ...base, meses: [], avisos: [false, true, true, true, true, true] });
    expect(c.borrar).toEqual([1, 2]);
    expect(c.perfil).toBe(true);
    expect(c.guardar).toEqual([]);
  });
});
