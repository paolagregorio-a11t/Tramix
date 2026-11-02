import { useEffect } from "react";
import type { Route } from "./useRoute";

/** Unique title and description per page (the app uses hash routes, so we set them on navigation). */
const META: Record<Route, { title: string; description: string }> = {
  home: { title: "Tramix · Elige tu tramo de autónomo a tiempo", description: "Tramix sigue tus ingresos, proyecta cómo cierras el año y te avisa antes de cada plazo para cambiar de tramo de autónomo. Sin sorpresas en la regularización." },
  demo: { title: "Demo interactiva · Tramix", description: "Prueba Tramix con datos de ejemplo: proyección de tu tramo, simulador, avisos de plazo y asistente. Gratis y sin registro." },
  privacidad: { title: "Política de privacidad · Tramix", description: "Qué datos trata Tramix, para qué, cuánto tiempo y cómo ejercer tus derechos." },
  "aviso-legal": { title: "Aviso legal · Tramix", description: "Titular del sitio, naturaleza orientativa del servicio y condiciones de uso de Tramix." },
  cookies: { title: "Política de cookies · Tramix", description: "Tramix no usa cookies de seguimiento ni publicidad. Detalle del almacenamiento local de la demo." },
};

export function useMeta(route: Route) {
  useEffect(() => {
    const m = META[route];
    document.title = m.title;
    let d = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!d) { d = document.createElement("meta"); d.name = "description"; document.head.appendChild(d); }
    d.content = m.description;
    document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.setAttribute("content", m.title);
    document.querySelector<HTMLMetaElement>('meta[property="og:description"]')?.setAttribute("content", m.description);
  }, [route]);
}
