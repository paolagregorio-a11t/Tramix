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
 * 2026: Orden PJC/297/2026, de 30 de marzo (BOE-A-2026-7296).
 * Tramos 1-3 are the "tabla reducida"; 4-15 are the 12 tramos of the "tabla general".
 * Figures come from several secondary sources that agree with each other and with the
 * published minimum quotas (205,88 € at tramo 1, 607,35 € at tramo 15 with a 31,5 % rate).
 * The BOE text itself could not be opened when this was written: confirm and then set
 * estado to "verificada-boe".
 */
const rows: [number, number][] = [
  [670, 653.59], [900, 718.95], [1166.7, 849.67],
  [1300, 950.98], [1500, 960.78], [1700, 960.78], [1850, 1143.79], [2030, 1209.15], [2330, 1274.51],
  [2760, 1356.21], [3190, 1437.91], [3620, 1519.61], [4050, 1601.31], [6000, 1732.03], [Infinity, 1928.1],
];

export const TABLA_2026: TramosTable = {
  year: 2026,
  estado: "contrastada",
  source: "Orden PJC/297/2026 (BOE-A-2026-7296), contrastada entre fuentes; pendiente de confirmar con el texto del BOE",
  rate: 0.315,
  tramos: rows.map(([hasta, baseMin], i) => ({ n: i + 1, hasta, baseMin })),
};

export const TABLAS: Record<number, TramosTable> = { 2026: TABLA_2026 };
export const tablaDe = (year: number): TramosTable => TABLAS[year] ?? TABLA_2026;
