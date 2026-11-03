import { cuotaMinima, tramoPara } from "./engine/calc";
import { TABLA_2026 } from "./engine/tramos";

export type Crumb = { name: string; path: string };
export type RouteDef = {
  path: string;
  kind: "home" | "demo" | "app" | "legal" | "cuota" | "cuota-x" | "tramos" | "regularizacion" | "cambio-base";
  title: string;
  description: string;
  crumbs: Crumb[];
  /** Monthly net yield for programmatic pages. */
  x?: number;
  priority: number;
  /** Private pages (the signed-in app): prerendered so direct links work, but kept out of the sitemap and search results. */
  privada?: boolean;
};

const Y = TABLA_2026.year;
const eur0 = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const HOME: Crumb = { name: "Inicio", path: "/" };
const CUOTA: Crumb = { name: "Cuota de autónomo", path: "/cuota-autonomo" };

/** Monthly net yields that get their own page: every 100 € from 600 to 6.000, plus a few high ones. */
export const IMPORTES = [...Array.from({ length: 55 }, (_, i) => 600 + i * 100), 7000, 8000, 10000];
export const cuotaXPath = (x: number) => `/cuota-autonomo/${x}-euros-mes`;

export const ROUTES: RouteDef[] = [
  { path: "/", kind: "home", priority: 1, crumbs: [HOME],
    title: "Cuotio · Elige tu tramo de autónomo a tiempo",
    description: "Cuotio sigue tus ingresos, proyecta cómo cierras el año y te avisa antes de cada plazo para cambiar de tramo de autónomo. Sin sorpresas en la regularización." },
  { path: "/cuota-autonomo", kind: "cuota", priority: 0.9, crumbs: [HOME, CUOTA],
    title: `Calculadora cuota de autónomo ${Y}: tramo y cuota al instante · Cuotio`,
    description: `Calcula tu cuota de autónomo ${Y} según tus rendimientos netos: tramo, base mínima y máxima y cuota mensual con la tabla oficial del BOE. Gratis y sin registro.` },
  { path: "/tramos-autonomos-2026", kind: "tramos", priority: 0.9, crumbs: [HOME, { name: `Tramos ${Y}`, path: "/tramos-autonomos-2026" }],
    title: `Tramos de autónomos ${Y}: tabla oficial de bases y cuotas · Cuotio`,
    description: `Los 15 tramos de cotización de autónomos de ${Y} con base mínima, base máxima y cuota mensual, verificados con la Orden PJC/297/2026 del BOE.` },
  { path: "/regularizacion-cuota-autonomos", kind: "regularizacion", priority: 0.9, crumbs: [HOME, { name: "Regularización", path: "/regularizacion-cuota-autonomos" }],
    title: "Regularización de la cuota de autónomos: ¿te toca pagar o te devuelven? · Cuotio",
    description: "Calcula si la Seguridad Social te reclamará o te devolverá dinero en la regularización de tu cuota de autónomo, con las bases oficiales y el cálculo explicado." },
  { path: "/cambio-base-cotizacion", kind: "cambio-base", priority: 0.8, crumbs: [HOME, { name: "Cambio de base", path: "/cambio-base-cotizacion" }],
    title: `Cambio de base de cotización autónomos ${Y}: plazos y fechas · Cuotio`,
    description: "Las 6 fechas al año para cambiar tu base de cotización de autónomo, cuándo tiene efecto cada cambio y cómo pedirlo paso a paso." },
  ...IMPORTES.map((x): RouteDef => {
    const n = tramoPara(x, TABLA_2026);
    return { path: cuotaXPath(x), kind: "cuota-x", x, priority: 0.7, crumbs: [HOME, CUOTA, { name: `${eur0(x)} €/mes`, path: cuotaXPath(x) }],
      title: `Cuota de autónomo si ganas ${eur0(x)} € al mes (${Y}) · Cuotio`,
      description: `Con un rendimiento neto de ${eur0(x)} € al mes estás en el tramo ${n}: cuota mínima de ${String(cuotaMinima(n, TABLA_2026).toFixed(2)).replace(".", ",")} € al mes en ${Y}. Tramo, bases, cuota anual y qué pasa en la regularización.` };
  }),
  { path: "/demo", kind: "demo", priority: 0.8, crumbs: [HOME, { name: "Demo", path: "/demo" }],
    title: "Demo interactiva · Cuotio",
    description: "Prueba Cuotio con datos de ejemplo: proyección de tu tramo, simulador, avisos de plazo y asistente. Gratis y sin registro." },
  { path: "/app", kind: "app", priority: 0, privada: true, crumbs: [HOME, { name: "App", path: "/app" }],
    title: "Entrar · Cuotio", description: "Entra en tu cuenta de Cuotio para seguir tus ingresos y tu tramo de autónomo." },
  { path: "/privacidad", kind: "legal", priority: 0.2, crumbs: [HOME, { name: "Privacidad", path: "/privacidad" }],
    title: "Política de privacidad · Cuotio", description: "Qué datos trata Cuotio, para qué, cuánto tiempo y cómo ejercer tus derechos." },
  { path: "/aviso-legal", kind: "legal", priority: 0.2, crumbs: [HOME, { name: "Aviso legal", path: "/aviso-legal" }],
    title: "Aviso legal · Cuotio", description: "Titular del sitio, naturaleza orientativa del servicio y condiciones de uso de Cuotio." },
  { path: "/cookies", kind: "legal", priority: 0.2, crumbs: [HOME, { name: "Cookies", path: "/cookies" }],
    title: "Política de cookies · Cuotio", description: "Cuotio no usa cookies de seguimiento ni publicidad. Detalle del almacenamiento local de la demo." },
];

export const routeFor = (path: string): RouteDef => ROUTES.find((r) => r.path === path) ?? ROUTES[0];
