import type { SupabaseClient } from "@supabase/supabase-js";
import type { Month, Regimen } from "../engine/calc";
import type { DemoState } from "../demo/useDemoState";

/** Rows as stored in Supabase (see supabase/migrations). */
export type FilaPerfil = { user_id: string; tramo_actual: number; regimen: Regimen; avisos: boolean[] };
export type FilaMes = { user_id: string; anio: number; mes: number; ingresos: number | string; gastos: number | string };

const cents = (n: number) => Math.round(Math.max(0, Number(n) || 0) * 100) / 100;
const AVISOS = [true, true, true, true, true, true];

/**
 * The app works with the months of one year in order, from January. Months saved for later months
 * without the ones before them (should not happen) are left out instead of being shown in the wrong place.
 */
export function aEstado(perfil: FilaPerfil, filas: FilaMes[]): DemoState {
  const porMes = new Map(filas.map((f) => [f.mes, f]));
  const meses: Month[] = [];
  for (let m = 1; m <= 12 && porMes.has(m); m++) {
    const f = porMes.get(m)!;
    meses.push({ ingresos: cents(Number(f.ingresos)), gastos: cents(Number(f.gastos)) });
  }
  const avisos = Array.isArray(perfil.avisos) && perfil.avisos.length === 6 ? perfil.avisos : AVISOS;
  return { meses, tramoActual: perfil.tramo_actual, regimen: perfil.regimen, avisos };
}

export const aPerfil = (userId: string, s: DemoState): FilaPerfil =>
  ({ user_id: userId, tramo_actual: s.tramoActual, regimen: s.regimen, avisos: s.avisos });

/** What has to be written so the database matches `nuevo`: months to upsert and month numbers to delete. */
export function cambios(userId: string, anio: number, antes: DemoState | null, nuevo: DemoState) {
  const perfil = !antes || antes.tramoActual !== nuevo.tramoActual || antes.regimen !== nuevo.regimen || antes.avisos.join() !== nuevo.avisos.join();
  const guardar: FilaMes[] = [];
  nuevo.meses.forEach((m, i) => {
    const a = antes?.meses[i];
    if (!a || a.ingresos !== m.ingresos || a.gastos !== m.gastos) guardar.push({ user_id: userId, anio, mes: i + 1, ingresos: cents(m.ingresos), gastos: cents(m.gastos) });
  });
  const borrar: number[] = [];
  for (let i = nuevo.meses.length; i < (antes?.meses.length ?? 0); i++) borrar.push(i + 1);
  return { perfil, guardar, borrar };
}

/** Loads the person's settings and the months of `anio`. `null` means the account has no profile yet (new sign-up). */
export async function cargar(sb: SupabaseClient, userId: string, anio: number): Promise<DemoState | null> {
  const [p, m] = await Promise.all([
    sb.from("perfiles").select("user_id, tramo_actual, regimen, avisos").eq("user_id", userId).maybeSingle(),
    sb.from("meses").select("user_id, anio, mes, ingresos, gastos").eq("user_id", userId).eq("anio", anio),
  ]);
  if (p.error) throw p.error;
  if (m.error) throw m.error;
  return p.data ? aEstado(p.data as FilaPerfil, (m.data ?? []) as FilaMes[]) : null;
}

export async function guardar(sb: SupabaseClient, userId: string, anio: number, antes: DemoState | null, nuevo: DemoState) {
  const c = cambios(userId, anio, antes, nuevo);
  if (c.perfil) { const r = await sb.from("perfiles").upsert(aPerfil(userId, nuevo)); if (r.error) throw r.error; }
  if (c.guardar.length) { const r = await sb.from("meses").upsert(c.guardar); if (r.error) throw r.error; }
  if (c.borrar.length) { const r = await sb.from("meses").delete().eq("user_id", userId).eq("anio", anio).in("mes", c.borrar); if (r.error) throw r.error; }
}

/** Everything we keep about the person, for the "Descargar mis datos" button (RGPD art. 15 and 20). */
export async function exportar(sb: SupabaseClient, userId: string, email: string) {
  const [p, m] = await Promise.all([
    sb.from("perfiles").select("*").eq("user_id", userId).maybeSingle(),
    sb.from("meses").select("anio, mes, ingresos, gastos, actualizado_at").eq("user_id", userId).order("anio").order("mes"),
  ]);
  if (p.error) throw p.error;
  if (m.error) throw m.error;
  return { exportado: new Date().toISOString(), cuenta: { email }, perfil: p.data, meses: m.data };
}
