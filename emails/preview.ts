// Writes HTML previews of every email to emails/preview/. Run: npm run email:preview
import { mkdirSync, writeFileSync } from "node:fs";
import { alertaEmail } from "./alerta";
import { welcomeEmail } from "./welcome";

const site = process.env.PREVIEW_SITE ?? "file://" + process.cwd() + "/public";
const brand = { site, unsubscribeUrl: site + "/#baja", contactEmail: "hola@tramix.app", senderName: "El equipo de Tramix" };
mkdirSync("emails/preview", { recursive: true });
writeFileSync("emails/preview/welcome.html", welcomeEmail(brand).html);
writeFileSync("emails/preview/alerta.html", alertaEmail(brand, { dias: 18, limite: "31 de octubre", efecto: "1 de noviembre", tramoActual: 7, tramoObjetivo: 10, rangoTexto: "tramo 9–10", importe: 1100, accion: "subir", appUrl: site + "/#demo" }).html);
console.log("Previews in emails/preview/");
