// Writes the Supabase Auth email template. Run: npm run email:supabase, then paste it in Supabase (DEPLOY.md, apartado 8).
import { mkdirSync, writeFileSync } from "node:fs";
import { codigoEmail } from "./codigo.js";

const mail = codigoEmail({ site: (process.env.SITE_URL ?? "https://cuotio.es").replace(/\/$/, ""), contactEmail: process.env.CONTACT_EMAIL ?? "hola@cuotio.es", senderName: "El equipo de Cuotio" });
mkdirSync("supabase/templates", { recursive: true });
writeFileSync("supabase/templates/codigo.html", mail.html + "\n");
console.log(`supabase/templates/codigo.html  (asunto: ${mail.subject})`);
