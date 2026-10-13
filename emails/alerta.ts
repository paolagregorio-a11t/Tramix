import { type Brand, button, color, esc, h1, layout, p } from "./layout";
import type { Rendered } from "./welcome";

export type AlertaData = {
  dias: number;
  limite: string;          // "31 de octubre"
  efecto: string;          // "1 de noviembre"
  tramoActual: number;
  tramoObjetivo: number;
  rangoTexto: string;      // "tramo 8–9"
  importe: number;         // approx. € at stake per year
  accion: "subir" | "bajar" | "mantener";
  appUrl: string;
};

const fila = (k: string, v: string) => `<tr><td style="padding:10px 0;border-bottom:1px solid ${color.line};font:400 14px Arial,sans-serif;color:${color.muted}">${k}</td><td align="right" style="padding:10px 0;border-bottom:1px solid ${color.line};font:700 15px Arial,sans-serif;color:${color.ink}">${v}</td></tr>`;
const eur = (n: number) => `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".")} €`;

/** The recurring product email: sent shortly before each change-of-base deadline. */
export function alertaEmail(b: Brand, d: AlertaData): Rendered {
  const titulo = d.accion === "mantener" ? `Mantén tu tramo ${d.tramoActual}` : d.accion === "subir" ? `Conviene subir al tramo ${d.tramoObjetivo}` : `Conviene bajar al tramo ${d.tramoObjetivo}`;
  const frase =
    d.accion === "mantener" ? "Tu tramo está dentro del rango previsto para el cierre del año. No hace falta tocar nada."
    : d.accion === "subir" ? `Vas a cerrar el año por encima de tu tramo. Si no lo cambias, la regularización podría reclamarte unos <b>${eur(d.importe)}</b>.`
    : `Vas a cerrar el año por debajo de tu tramo. Cambiarlo evita pagar de más: unos <b>${eur(d.importe)}</b> al año.`;
  const body =
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px"><tr><td style="padding:6px 14px;border-radius:999px;background:#fff3d6;font:700 13px Arial,sans-serif;color:#7a5410">Plazo en ${d.dias} ${d.dias === 1 ? "día" : "días"}</td></tr></table>` +
    h1(titulo) + p(frase) +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 20px">` +
    fila("Pides el cambio antes del", esc(d.limite)) + fila("Tiene efecto el", esc(d.efecto)) + fila("Tu tramo ahora", String(d.tramoActual)) + fila("Cierre previsto", esc(d.rangoTexto)) + `</table>` +
    button("Ver el cálculo completo", d.appUrl) +
    p(`<span style="color:${color.muted};font-size:14px">Tramix no hace el trámite por ti: el cambio se solicita en Import@ss. Cálculo orientativo.</span>`);
  return {
    subject: `Plazo en ${d.dias} días: ${titulo.toLowerCase()}`,
    html: layout({ body, brand: b, preheader: `Pide el cambio antes del ${d.limite}. ${titulo}.`, why: "Recibes este aviso porque activaste las alertas de cambio de tramo en Tramix." }),
    text: `Plazo en ${d.dias} días\n\n${titulo}\n${frase.replace(/<[^>]+>/g, "")}\n\nPides el cambio antes del ${d.limite} (efecto: ${d.efecto}).\nTu tramo ahora: ${d.tramoActual}. Cierre previsto: ${d.rangoTexto}.\n\nCálculo completo: ${d.appUrl}\n\nTramix no hace el trámite por ti: el cambio se solicita en Import@ss. Cálculo orientativo.\n\n--\nDarme de baja: ${b.unsubscribeUrl}`,
  };
}
