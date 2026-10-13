import { type Brand, button, color, esc, h1, layout, p } from "./layout";

export type Rendered = { subject: string; html: string; text: string };

const li = (t: string) => `<tr><td valign="top" style="padding:0 12px 10px 0;font:700 16px/1.5 Arial,sans-serif;color:${color.gold}">&#9679;</td><td style="padding:0 0 10px;font:400 16px/1.5 Arial,sans-serif;color:#2f3a52">${t}</td></tr>`;

/** Sent right after joining the waitlist. */
export function welcomeEmail(b: Brand): Rendered {
  const body =
    h1("Ya estás en la lista de Tramix") +
    p("Gracias por apuntarte. Tramix sigue tus ingresos durante el año, proyecta cómo vas a cerrarlo y te avisa <b>antes</b> de cada plazo para cambiar de tramo, para que la regularización no te pille por sorpresa.") +
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 20px">` +
    li("<b>Apuntas</b> tus ingresos y gastos cada mes.") +
    li("<b>Ves</b> entre qué tramos vas a cerrar el año.") +
    li("<b>Recibes</b> un aviso con el tramo recomendado antes de cada plazo.") +
    `</table>` +
    p("Mientras preparamos el lanzamiento, puedes probar cómo funciona con la demo interactiva. Cambia los ingresos de cualquier mes y mira cómo se mueve la proyección.") +
    button("Probar la demo", `${b.site}/#demo`) +
    p(`<span style="color:${color.muted};font-size:14px">No hace falta que hagas nada más. Te escribiremos cuando abramos, y solo entonces.</span>`);
  return {
    subject: "Estás en la lista de Tramix",
    html: layout({ body, brand: b, preheader: "Te avisaremos antes del lanzamiento. Mientras tanto, prueba la demo.", why: "Recibes este correo porque te apuntaste a la lista de espera de Tramix y aceptaste recibir avisos." }),
    text: `Ya estás en la lista de Tramix\n\nGracias por apuntarte. Tramix sigue tus ingresos durante el año, proyecta cómo vas a cerrarlo y te avisa antes de cada plazo para cambiar de tramo.\n\n- Apuntas tus ingresos y gastos cada mes.\n- Ves entre qué tramos vas a cerrar el año.\n- Recibes un aviso con el tramo recomendado antes de cada plazo.\n\nPrueba la demo: ${b.site}/#demo\n\nNo hace falta que hagas nada más. Te escribiremos cuando abramos, y solo entonces.\n\nUn saludo,\n${b.senderName}\n\n--\nDarme de baja: ${b.unsubscribeUrl}\nPrivacidad: ${b.site}/#privacidad\nTramix ofrece cálculos orientativos y no constituye asesoramiento fiscal.`,
  };
}

export { esc };
