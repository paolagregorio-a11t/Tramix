import type { Factura } from "../../api/extract";

/** Results of reading the two sample invoices with Gemini (used in sandboxed previews, where there is no server). */
export const SAMPLE_FACTURAS: Record<"ingreso" | "gasto", { file: string; factura: Factura }> = {
  ingreso: { file: "/demo/factura-ejemplo-ingreso.pdf", factura: { tipo: "ingreso", fecha: "2026-10-14", numero: "2026-041", emisor: "Ana Ejemplo Ficticia", cliente: "Estudio Norte Demo, S.L.", concepto: "Diseño de identidad visual, Adaptación a redes sociales", base: 1650, iva: 346.5, irpf: 247.5, total: 1749, cuadra: true } },
  gasto: { file: "/demo/factura-ejemplo-gasto.pdf", factura: { tipo: "gasto", fecha: "2026-10-03", numero: "NH-88213", emisor: "Nube Hosting Demo, S.L.", cliente: "Ana Ejemplo Ficticia", concepto: "Plan de alojamiento web Pro (anual) / Dominio .es (anual)", base: 190, iva: 39.9, irpf: 0, total: 229.9, cuadra: true } },
};
