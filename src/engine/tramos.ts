/**
 * Versioned contribution tables. NEVER hardcode these in UI code.
 *
 * `estado` says how trustworthy a table is. The UI shows a notice until it is "verificada-boe".
 */
export type Tramo = {
  n: number;
  /** Upper bound of monthly net yield for this tramo (€). Infinity for the last one. */
  hasta: number;
  /** Minimum monthly contribution base (€). */
  baseMin: number;
};

export type Estado = "verificada-boe" | "contrastada" | "ilustrativa";

export type TramosTable = {
  year: number;
  /** verificada-boe: checked against the BOE text. contrastada: cross-checked between secondary sources. ilustrativa: example figures. */
  estado: Estado;
  source: string;
  /** Total contribution rate applied to the base. */
  rate: number;
  tramos: Tramo[];
};

/**
 * 2026: Orden PJC/297/2026, de 30 de marzo (BOE-A-2026-7296), art. 18.
 * Tramos 1-3 are the "tabla reducida"; 4-15 are the 12 tramos of the "tabla general".
 * Checked line by line against the BOE text on 2026-10-13.
 * Rate 31,50 % = 28,30 contingencias comunes + 1,30 profesionales + 0,90 MEI (art. 18.2)
 *                + 0,90 cese de actividad + 0,10 formación profesional (art. 37.5-6).
 */
const rows: [number, number][] = [
  [670, 653.59], [900, 718.95], [1166.7, 849.67],
  [1300, 950.98], [1500, 960.78], [1700, 960.78], [1850, 1143.79], [2030, 1209.15], [2330, 1274.51],
  [2760, 1356.21], [3190, 1437.91], [3620, 1519.61], [4050, 1601.31], [6000, 1732.03], [Infinity, 1928.1],
];

export const TABLA_2026: TramosTable = {
  year: 2026,
  estado: "verificada-boe",
  source: "Orden PJC/297/2026, de 30 de marzo (BOE-A-2026-7296)",
  rate: 0.315,
  tramos: rows.map(([hasta, baseMin], i) => ({ n: i + 1, hasta, baseMin })),
};

export const TABLAS: Record<number, TramosTable> = { 2026: TABLA_2026 };
export const tablaDe = (year: number): TramosTable => TABLAS[year] ?? TABLA_2026;
