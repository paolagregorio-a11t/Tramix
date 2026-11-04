import type { TramosTable } from "./tramos.js";

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

const cents = (n: number) => Math.round(n * 100) / 100;
export function cuotaMinima(tramo: number, t: TramosTable): number {
  return cents(t.tramos[tramo - 1].baseMin * t.rate);
}
export function cuotaMaxima(tramo: number, t: TramosTable): number {
  return cents(t.tramos[tramo - 1].baseMax * t.rate);
}
/** "Tabla reducida" (tramos 1-3) or "tabla general" (4-15), and the tramo number inside that table, as the BOE names them. */
export function tablaOficial(tramo: number): { tabla: "reducida" | "general"; n: number } {
  return tramo <= 3 ? { tabla: "reducida", n: tramo } : { tabla: "general", n: tramo - 3 };
}

export type Regularizacion = { tramoReal: number; resultado: "pagar" | "devolver" | "nada"; importe: number };
/**
 * Year-end regularisation for a full year at a constant base: if the base you paid is below the minimum base of
 * the tramo your real yield falls in, you pay the difference; if it is above that tramo's maximum, you get it back.
 * (Real cases prorate by months and by each base actually paid; this is the orientative yearly figure.)
 */
export function regularizacion(basePagada: number, rendimientoMensualReal: number, t: TramosTable, meses = 12): Regularizacion {
  const tramoReal = tramoPara(rendimientoMensualReal, t);
  const { baseMin, baseMax } = t.tramos[tramoReal - 1];
  if (basePagada < baseMin) return { tramoReal, resultado: "pagar", importe: cents((baseMin - basePagada) * t.rate * meses) };
  if (basePagada > baseMax) return { tramoReal, resultado: "devolver", importe: cents((basePagada - baseMax) * t.rate * meses) };
  return { tramoReal, resultado: "nada", importe: 0 };
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
 * Remaining months are estimated from the mean of the last 3 recorded months, ±15%,
 * or from a scenario value (monthly computable yield) supplied by the user.
 */
export function proyectar(meses: Month[], t: TramosTable, r: Regimen = "persona-fisica", banda = 0.15, restanteOverride?: number): Proyeccion | null {
  if (meses.length === 0) return null;
  const ys = meses.map((m) => rendimientoMes(m, r));
  const acumulado = ys.reduce((a, b) => a + b, 0);
  const ult = ys.slice(-3);
  // A user-supplied scenario replaces the trend and removes the ±band: it is an assumption, not an estimate.
  const base = restanteOverride ?? ult.reduce((a, b) => a + b, 0) / ult.length;
  if (restanteOverride !== undefined) banda = 0;
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

/**
 * The six yearly windows to change contribution base. Art. 45 of the Reglamento de inscripción (as amended by
 * RDL 13/2022): a request made between the 1st of one window's first month and its last day takes effect on the
 * 1st of the following month, i.e. effective Mar 1 (by end Feb), May 1 (Apr 30), Jul 1 (Jun 30), Sep 1 (Aug 31),
 * Nov 1 (Oct 31) and Jan 1 (Dec 31). Verified against the BOE text on 2026-10-13.
 */
export type Ventana = { efecto: Date; limite: Date };
export function ventanas(year: number): Ventana[] {
  const meses = [0, 2, 4, 6, 8, 10]; // Jan, Mar, May, Jul, Sep, Nov (effective on day 1)
  return meses.map((m) => ({ efecto: new Date(year, m, 1), limite: new Date(year, m, 0) }));
}

/** The six windows whose request deadline falls within `year` (28 Feb … 31 Dec): what people mean by "this year's dates". */
export function ventanasDelAno(year: number): Ventana[] {
  return [...ventanas(year), ...ventanas(year + 1)].filter((v) => v.limite.getFullYear() === year);
}

export function proximaVentana(hoy: Date): { ventana: Ventana; dias: number } {
  const dia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const todas = [...ventanas(hoy.getFullYear()), ...ventanas(hoy.getFullYear() + 1)];
  const v = todas.find((x) => x.limite >= dia)!;
  return { ventana: v, dias: Math.round((v.limite.getTime() - dia.getTime()) / 86400000) };
}
