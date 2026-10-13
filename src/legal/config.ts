/**
 * Data the law requires on the site (LSSI art. 10, RGPD art. 13).
 * Fill these in BEFORE going public. Empty values render as a visible "pendiente" marker.
 */
export const TITULAR = {
  nombre: "",        // Nombre y apellidos o razón social
  nif: "",           // NIF
  domicilio: "",     // Domicilio
  email: "",         // Email de contacto
  dominio: "",       // p. ej. tramix.app
};
export const pend = (v: string) => v || "[pendiente de completar]";
export const FECHA_LEGAL = "13 de octubre de 2026";
