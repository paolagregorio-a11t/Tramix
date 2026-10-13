import type { TramosTable } from "./tramos";

export type Month = { ingresos: number; gastos: number };
export type Regimen = "persona-fisica" | "societario";

/** Generic expense deduction applied to the net yield (7%, or 3% for company-type autónomos). */
export const deduccionGenerica = (r: Regimen) => (r === "societario" ? 0.03 : 0.07);

/** Computable net yield of one month. `gastos` must exclude the SS contribution itself. */
export function rendimientoMes(m: Month, r: Regimen = "persona-fisica"): number {
  const neto = Math.max(0, m.ingresos - m.gastos);
  return neto * (1 - deduccionGenerica(r));
}

/** 1-based tramo number for a monthly net yield. */
export function tramoPara(rendimientoMensual: number, t: TramosTable): number {
  const y = Math.max(0, rendimientoMensual);
  return t.tramos.find((x) => y <= x.hasta)!.n;
}

export function cuotaMinima(tramo: number, t: TramosTable): number {
  return Math.round(t.tramos[tramo - 1].baseMin * t.rate * 100) / 100;
}

export type Proyeccion = {
  /** Monthly average yield if the rest of the year looks like the recent past, low / mid / high. */
  bajo: number; medio: number; alto: number;
  tramoBajo: number; tramoMedio: number; tramoAlto: number;
  /** Projected monthly yield for each remaining month (mid scenario). */
  restante: number;
};

/**
 * Projects the year-end tramo as a RANGE, never a single figure.
 * Remaining months are estimated from the mean of the last 3 recorded months, ±15%.
 */
export function proyectar(meses: Month[], t: TramosTable, r: Regimen = "persona-fisica", banda = 0.15): Proyeccion | null {
  if (meses.length === 0) return null;
  const ys = meses.map((m) => rendimientoMes(m, r));
  const acumulado = ys.reduce((a, b) => a + b, 0);
  const ult = ys.slice(-3);
  const base = ult.reduce((a, b) => a + b, 0) / ult.length;
  const faltan = 12 - meses.length;
  const media = (f: number) => (acumulado + base * f * faltan) / 12;
  const bajo = media(1 - banda), medio = media(1), alto = media(1 + banda);
  return { bajo, medio, alto, tramoBajo: tramoPara(bajo, t), tramoMedio: tramoPara(medio, t), tramoAlto: tramoPara(alto, t), restante: base };
}

export type Recomendacion =
  | { accion: "mantener"; objetivo: number; ahorro: 0 }
  | { accion: "subir" | "bajar"; objetivo: number; /** Approx. yearly € difference vs staying (positive = you avoid owing it). */ ahorro: number };

/** Compares the tramo you pay now with the projected range. */
export function recomendar(actual: number, p: Proyeccion, t: TramosTable): Recomendacion {
  if (actual >= p.tramoBajo && actual <= p.tramoAlto) return { accion: "mantener", objetivo: actual, ahorro: 0 };
  const objetivo = p.tramoMedio;
  if (objetivo === actual) return { accion: "mantener", objetivo: actual, ahorro: 0 };
  const dif = (cuotaMinima(objetivo, t) - cuotaMinima(actual, t)) * 12;
  return { accion: objetivo > actual ? "subir" : "bajar", objetivo, ahorro: Math.round(Math.abs(dif)) };
}

/** The six yearly windows to change contribution base. Requests are due by the last day of the previous month. */
export type Ventana = { efecto: Date; limite: Date };
export function ventanas(year: number): Ventana[] {
  const meses = [0, 2, 4, 6, 8, 10]; // Jan, Mar, May, Jul, Sep, Nov (effective on day 1)
  return meses.map((m) => ({ efecto: new Date(year, m, 1), limite: new Date(year, m, 0) }));
}

export function proximaVentana(hoy: Date): { ventana: Ventana; dias: number } {
  const dia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const todas = [...ventanas(hoy.getFullYear()), ...ventanas(hoy.getFullYear() + 1)];
  const v = todas.find((x) => x.limite >= dia)!;
  return { ventana: v, dias: Math.round((v.limite.getTime() - dia.getTime()) / 86400000) };
}
