import { type Brand, color, h1, layout, p } from "./layout.js";

/** Supabase replaces this with the sign-in code when it sends the email. */
export const TOKEN = "{{ .Token }}";

/**
 * Sign-in code for the account (Supabase Auth > Email Templates). Supabase sends it, not our API,
 * so this is exported once to supabase/templates/codigo.html and pasted into the dashboard (see DEPLOY.md).
 * A code instead of a link: it also works when the email is opened on another device or inside the installed app.
 */
export function codigoEmail(b: Omit<Brand, "unsubscribeUrl">): { subject: string; html: string } {
  const body =
    h1("Tu código para recuperar el acceso") +
    p("Escribe este código en Cuotio para entrar y elegir una contraseña nueva:") +
    `<p style="margin:8px 0 22px;padding:18px 0;border-radius:16px;background:${color.paper};text-align:center;font:800 34px/1 Manrope,Arial,sans-serif;letter-spacing:8px;color:${color.ink}">${TOKEN}</p>` +
    p(`<span style="color:${color.muted};font-size:14px">Caduca en una hora. Si no has pedido entrar en Cuotio, ignora este correo: sin el código nadie puede acceder a tu cuenta.</span>`);
  return {
    subject: "Tu código de Cuotio",
    html: layout({ body, brand: { ...b, unsubscribeUrl: "" }, preheader: "Escríbelo en Cuotio para entrar. Caduca en una hora.", why: "Recibes este correo porque alguien ha pedido entrar en Cuotio con esta dirección." }),
  };
}
