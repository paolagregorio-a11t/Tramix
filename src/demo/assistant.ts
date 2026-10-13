import type { Proyeccion, Recomendacion } from "../engine/calc";
import { cuotaMinima } from "../engine/calc";
import type { TramosTable } from "../engine/tramos";
import { fmt } from "../lib";

export type AssistantData = {
  tabla: TramosTable; tramoActual: number; proy: Proyeccion | null; rec: Recomendacion | null;
  dias: number; limite: string; efecto: string; meses: number;
};

export const SUGERENCIAS = [
  { k: "why", q: "¿Por qué me recomiendas ese tramo?" },
  { k: "nochange", q: "¿Qué pasa si no cambio nada?" },
  { k: "how", q: "¿Cómo cambio la base?" },
  { k: "when", q: "¿Hasta cuándo puedo hacerlo?" },
] as const;

const eur = (n: number) => `${fmt(Math.round(n))} €`;
const rango = (p: Proyeccion) => (p.tramoBajo === p.tramoAlto ? `tramo ${p.tramoBajo}` : `tramos ${p.tramoBajo} a ${p.tramoAlto}`);

/** Deterministic answers built from the same engine numbers shown on screen. */
export function respuestaLocal(k: (typeof SUGERENCIAS)[number]["k"], d: AssistantData): string {
  const { proy, rec } = d;
  if (k === "when") return `El próximo plazo termina el ${d.limite}. Quedan ${d.dias} días, y el cambio tendría efecto el ${d.efecto}. Hay seis ventanas al año, así que si lo dejas pasar, la siguiente llega en dos meses.`;
  if (k === "how") return "El cambio lo pides tú desde Import@ss, el portal de la Seguridad Social: entras con certificado digital o Cl@ve, vas a la opción de cambio de base de cotización del RETA, eliges la nueva base dentro de tu tramo y confirmas. Tramix no lo hace por ti ni te pide tus claves. Los nombres exactos del menú pueden cambiar.";
  if (!proy || !rec) return "Añade al menos un mes en la pestaña Meses y podré calcularlo con tus datos.";
  if (k === "why") {
    const base = `Con tus ${d.meses} meses registrados, tu rendimiento medio previsto para este año es de ${eur(proy.bajo)} a ${eur(proy.alto)} al mes, lo que encaja en ${rango(proy)}. Hoy pagas el tramo ${d.tramoActual}.`;
    return rec.accion === "mantener" ? `${base} Estás dentro del rango, así que no hace falta cambiar nada.`
      : rec.accion === "subir" ? `${base} Vas por debajo de lo que ganas, por eso te sugiero subir al tramo ${rec.objetivo}: así la diferencia no se te acumula para la regularización.`
        : `${base} Vas por encima de lo que ganas, por eso te sugiero bajar al tramo ${rec.objetivo} y no pagar de más.`;
  }
  const ahora = cuotaMinima(d.tramoActual, d.tabla), nueva = cuotaMinima(rec.objetivo, d.tabla);
  return rec.accion === "mantener" ? "Nada: tu tramo está dentro del rango previsto, así que la regularización saldría prácticamente a cero."
    : rec.accion === "subir" ? `Al terminar el año, la Seguridad Social compara lo que has ganado con la base que cotizaste. Si cotizas por debajo, te reclama la diferencia. Con tus números, serían unos ${eur(rec.ahorro)} (cuota de ${eur(ahora)} frente a ${eur(nueva)} al mes). Es una estimación orientativa.`
      : `Seguirías pagando de más: unos ${eur(rec.ahorro)} al año (cuota de ${eur(ahora)} frente a ${eur(nueva)}). Es algo que luego te devuelven, pero tardan y mientras tanto es dinero tuyo parado.`;
}
