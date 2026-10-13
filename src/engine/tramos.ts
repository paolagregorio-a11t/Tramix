/**
 * Versioned contribution tables. NEVER hardcode these in UI code.
 *
 * `verified: false` means the figures are ILLUSTRATIVE and must be checked against
 * the BOE / TGSS before the product is used with real users. The UI shows a
 * "datos de ejemplo" notice for as long as a table is unverified.
 */
export type Tramo = {
  n: number;
  /** Upper bound of monthly net yield for this tramo (€). Infinity for the last one. */
  hasta: number;
  /** Minimum monthly contribution base (€). */
  baseMin: number;
};

export type TramosTable = {
  year: number;
  verified: boolean;
  source: string;
  /** Total contribution rate applied to the base (illustrative). */
  rate: number;
  tramos: Tramo[];
};

const rows: [number, number][] = [
  [670, 653.59], [900, 718.95], [1166.7, 849.67], [1300, 950.98], [1500, 960.78],
  [1700, 960.78], [1850, 1013.07], [2030, 1029.41], [2330, 1045.75], [2760, 1062.09],
  [3190, 1078.43], [3620, 1143.79], [4050, 1209.15], [6000, 1274.51], [Infinity, 1307.19],
];

export const TABLA_2026: TramosTable = {
  year: 2026,
  verified: false,
  source: "Cifras ilustrativas pendientes de contrastar con el BOE y la TGSS",
  rate: 0.315,
  tramos: rows.map(([hasta, baseMin], i) => ({ n: i + 1, hasta, baseMin })),
};

export const TABLAS: Record<number, TramosTable> = { 2026: TABLA_2026 };
export const tablaDe = (year: number): TramosTable => TABLAS[year] ?? TABLA_2026;
