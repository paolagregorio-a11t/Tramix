/** Cuotio Pro prices, shown in the app and in the terms. The real prices live in Paddle (VITE_PADDLE_PRICE_*): keep both in step. */
export const PRUEBA_DIAS = 14;
export const PLANES = {
  mes: { nombre: "Mensual", precio: "3,99 €", periodo: "al mes", nota: "" },
  anio: { nombre: "Anual", precio: "35 €", periodo: "al año", nota: "Ahorras 12,88 € (unos 3 meses)" },
} as const;
export type Plan = keyof typeof PLANES;
export const INCLUYE_PRO = ["Avisos por email antes de cada plazo, con el tramo que te conviene", "Asistente para tus dudas sobre la cuota", "Importar extractos y facturas"];
export const INCLUYE_GRATIS = ["Calculadora de tramo y proyección del año", "Tus meses guardados en tu cuenta", "Calendario de plazos"];
