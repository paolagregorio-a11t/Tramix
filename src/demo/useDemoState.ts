import { useEffect, useState } from "react";
import type { Month, Regimen } from "../engine/calc";

export type DemoState = { meses: Month[]; tramoActual: number; regimen: Regimen; avisos: boolean[] };

/** Sample freelancer: nine recorded months, paying tramo 5 while the year trends higher. */
export const EJEMPLO: DemoState = {
  meses: [
    { ingresos: 1700, gastos: 250 }, { ingresos: 1900, gastos: 280 }, { ingresos: 1650, gastos: 300 },
    { ingresos: 2250, gastos: 350 }, { ingresos: 2450, gastos: 340 }, { ingresos: 2050, gastos: 300 },
    { ingresos: 2700, gastos: 380 }, { ingresos: 2850, gastos: 400 }, { ingresos: 3050, gastos: 420 },
  ],
  tramoActual: 5,
  regimen: "persona-fisica",
  avisos: [true, true, true, true, true, true],
};

const KEY = "tramix-demo-v1";

export function useDemoState() {
  const [state, setState] = useState<DemoState>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return { ...EJEMPLO, ...JSON.parse(raw) } as DemoState;
    } catch { /* storage unavailable: start from the sample */ }
    return EJEMPLO;
  });
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);
  return [state, setState, () => setState(EJEMPLO)] as const;
}
