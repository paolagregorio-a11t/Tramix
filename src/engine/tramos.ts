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
  /** Maximum monthly contribution base (€). */
  baseMax: number;
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
/** [upper bound of monthly net yield, minimum base, maximum base] — art. 18.1. */
const rows: [number, number, number][] = [
  [670, 653.59, 718.94], [900, 718.95, 900], [1166.7, 849.67, 1166.7],
  [1300, 950.98, 1300], [1500, 960.78, 1500], [1700, 960.78, 1700], [1850, 1143.79, 1850], [2030, 1209.15, 2030],
  [2330, 1274.51, 2330], [2760, 1356.21, 2760], [3190, 1437.91, 3190], [3620, 1519.61, 3620], [4050, 1601.31, 4050],
  [6000, 1732.03, 5101.2], [Infinity, 1928.1, 5101.2],
];

export const TABLA_2026: TramosTable = {
  year: 2026,
  estado: "verificada-boe",
  source: "Orden PJC/297/2026, de 30 de marzo (BOE-A-2026-7296)",
  rate: 0.315,
  tramos: rows.map(([hasta, baseMin, baseMax], i) => ({ n: i + 1, hasta, baseMin, baseMax })),
};

/** Link to the official text, shown wherever the table is used. */
export const BOE_URL = "https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-7296";

export const TABLAS: Record<number, TramosTable> = { 2026: TABLA_2026 };
export const tablaDe = (year: number): TramosTable => TABLAS[year] ?? TABLA_2026;
