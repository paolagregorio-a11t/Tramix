import { cuotaMaxima, cuotaMinima, regularizacion, tablaOficial, tramoPara } from "../engine/calc";
import { TABLA_2026 } from "../engine/tramos";
import type { RouteDef } from "../routes";
import { eur0, eur2 } from "./format";

export type QA = { q: string; a: string };
const T = TABLA_2026, Y = T.year;

/** Same text is rendered on the page and emitted as FAQPage structured data. */
export function faqFor(r: RouteDef): QA[] {
  if (r.kind === "cuota-x" && r.x) {
    const x = r.x, n = tramoPara(x, T), of = tablaOficial(n), prev = n > 1 ? regularizacion(T.tramos[n - 2].baseMin, x, T) : null;
    return [
      { q: `¿Qué tramo de autónomo me corresponde si gano ${eur0(x)} al mes?`, a: `Con un rendimiento neto de ${eur0(x)} al mes estás en el tramo ${n} (tramo ${of.n} de la tabla ${of.tabla} del BOE). Tu base de cotización puede ir de ${eur2(T.tramos[n - 1].baseMin)} a ${eur2(T.tramos[n - 1].baseMax)} al mes.` },
      { q: `¿Cuánto pago de cuota de autónomo con ${eur0(x)} al mes en ${Y}?`, a: `Entre ${eur2(cuotaMinima(n, T))} y ${eur2(cuotaMaxima(n, T))} al mes, según la base que elijas dentro de tu tramo. Con la base mínima son ${eur2(cuotaMinima(n, T) * 12)} al año. El tipo total es del 31,5 %.` },
      ...(prev ? [{ q: "¿Qué pasa si pago la cuota del tramo anterior?", a: `Si cotizas por la base mínima del tramo ${n - 1} y al final del año tu rendimiento medio es de ${eur0(x)} al mes, en la regularización la Seguridad Social te reclamaría unos ${eur2(prev.importe)}.` }] : []),
      { q: "¿Es el rendimiento neto lo mismo que lo que facturo?", a: "No. El rendimiento neto es lo que ingresas menos tus gastos deducibles, y a esa cifra se le aplica una deducción genérica del 7 % (3 % si eres autónomo societario). Por eso puedes facturar más y estar en un tramo menor." },
    ];
  }
  if (r.kind === "cuota") return [
    { q: `¿Cómo se calcula la cuota de autónomo en ${Y}?`, a: "Se calcula tu rendimiento neto mensual (ingresos menos gastos, con la deducción genérica del 7 %), se busca el tramo que le corresponde y se aplica el 31,5 % a la base de cotización que elijas dentro de ese tramo." },
    { q: `¿Cuál es la cuota mínima de autónomo en ${Y}?`, a: `${eur2(cuotaMinima(1, T))} al mes, que corresponde a la base mínima del tramo 1 (rendimientos de hasta 670 € al mes).` },
    { q: `¿Cuál es la cuota máxima de autónomo en ${Y}?`, a: `${eur2(cuotaMaxima(15, T))} al mes, con la base máxima de 5.101,20 €, disponible en los tramos de más de 4.050 € al mes.` },
    { q: "¿Puedo elegir cuánto pago dentro de mi tramo?", a: "Sí. Cada tramo tiene una base mínima y una máxima y puedes elegir cualquier base entre las dos. Una base más alta implica más cuota pero también mejores prestaciones." },
  ];
  if (r.kind === "tramos") return [
    { q: `¿Cuántos tramos de autónomos hay en ${Y}?`, a: "15: tres en la tabla reducida (rendimientos de hasta 1.166,70 € al mes) y doce en la tabla general." },
    { q: `¿De dónde sale la tabla de tramos de ${Y}?`, a: "Del artículo 18 de la Orden PJC/297/2026, de 30 de marzo, publicada en el BOE (BOE-A-2026-7296)." },
    { q: "¿Qué porcentaje se paga sobre la base de cotización?", a: "Un 31,5 %: 28,30 % por contingencias comunes, 1,30 % por contingencias profesionales, 0,90 % de mecanismo de equidad intergeneracional, 0,90 % por cese de actividad y 0,10 % por formación profesional." },
  ];
  if (r.kind === "regularizacion") return [
    { q: "¿Qué es la regularización de la cuota de autónomos?", a: "Cuando Hacienda comunica a la Seguridad Social tus rendimientos reales del año, esta compara la base por la que cotizaste con la que te correspondía. Si cotizaste por debajo de la base mínima de tu tramo real, te reclama la diferencia; si cotizaste por encima de la base máxima, te la devuelve." },
    { q: "¿Me devuelven dinero si he pagado de más?", a: "Solo lo que supere la base máxima del tramo que te correspondía. Si tu base estaba dentro de los límites de tu tramo real, no hay devolución: has cotizado más, y eso cuenta para tus prestaciones." },
    { q: "¿Cómo evito una regularización con sorpresa?", a: "Revisando tus ingresos durante el año y cambiando de base a tiempo. Hay seis ventanas al año para hacerlo; Cuotio te avisa antes de cada una con el tramo recomendado." },
  ];
  if (r.kind === "cambio-base") return [
    { q: "¿Cuántas veces al año puedo cambiar mi base de cotización?", a: "Hasta seis veces al año, según el artículo 45 del Reglamento de inscripción, modificado por el Real Decreto-ley 13/2022." },
    { q: "¿Cuándo tiene efecto el cambio de base?", a: "El 1 de marzo, 1 de mayo, 1 de julio, 1 de septiembre, 1 de noviembre o 1 de enero, según cuándo lo pidas: cada solicitud tiene efecto el primer día del bimestre siguiente." },
    { q: "¿Dónde se pide el cambio de base?", a: "En Import@ss, el portal de la Seguridad Social, con certificado digital o Cl@ve, indicando la nueva base y tu previsión de rendimientos." },
  ];
  return [];
}
