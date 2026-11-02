import type { ReactNode } from "react";
import { Logo } from "../components/Logo";
import { href } from "../router";
import type { RouteDef } from "../routes";
import { cuotaXPath } from "../routes";
import type { QA } from "./faq";
import { num0 } from "./format";
import "../styles/pages.css";

export function SeoShell({ route, children }: { route: RouteDef; children: ReactNode }) {
  return (
    <div className="sp">
      <header className="sp__nav">
        <div className="container sp__nav-in">
          <a href={href("/")} aria-label="Cuotio, inicio"><Logo tone="light" /></a>
          <nav aria-label="Principal">
            <a href={href("/cuota-autonomo")}>Calculadora</a>
            <a href={href("/tramos-autonomos-2026")}>Tramos 2026</a>
            <a href={href("/regularizacion-cuota-autonomos")}>Regularización</a>
            <a href={href("/cambio-base-cotizacion")}>Plazos</a>
            <a className="sp__cta" href={href("/demo")}>Probar Cuotio</a>
          </nav>
        </div>
      </header>
      <nav className="container sp__crumbs" aria-label="Migas de pan">
        <ol>{route.crumbs.map((c, i) => <li key={c.path}>{i < route.crumbs.length - 1 ? <a href={href(c.path)}>{c.name}</a> : <span aria-current="page">{c.name}</span>}</li>)}</ol>
      </nav>
      <main>{children}</main>
      <Promo />
      <footer className="sp__foot">
        <div className="container sp__foot-in">
          <div><Logo tone="light" size={26} /><p>Cálculos orientativos con la tabla oficial del BOE. No es asesoramiento fiscal.</p></div>
          <nav aria-label="Herramientas">
            <b>Herramientas</b>
            <a href={href("/cuota-autonomo")}>Calculadora de cuota</a>
            <a href={href("/tramos-autonomos-2026")}>Tramos de autónomos 2026</a>
            <a href={href("/regularizacion-cuota-autonomos")}>Calculadora de regularización</a>
            <a href={href("/cambio-base-cotizacion")}>Plazos de cambio de base</a>
          </nav>
          <nav aria-label="Cuota por ingresos">
            <b>Cuota según lo que ganas</b>
            {[1000, 1500, 2000, 2500, 3000, 4000].map((x) => <a key={x} href={href(cuotaXPath(x))}>{num0(x)}{"\u00a0"}€ al mes</a>)}
          </nav>
          <nav aria-label="Cuotio">
            <b>Cuotio</b>
            <a href={href("/demo")}>Demo</a>
            <a href={href("/#lista")}>Lista de espera</a>
            <a href={href("/aviso-legal")}>Aviso legal</a>
            <a href={href("/privacidad")}>Privacidad</a>
            <a href={href("/cookies")}>Cookies</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function Promo() {
  return (
    <section className="promo" aria-labelledby="promo-t">
      <div className="container promo__in">
        <div>
          <h2 id="promo-t">Una calculadora te da una foto. <em>Cuotio, la película.</em></h2>
          <p>Cuotio sigue tus ingresos mes a mes, proyecta cómo cierras el año y te avisa antes de cada plazo para cambiar de tramo. Sin sorpresas en la regularización.</p>
        </div>
        <div className="promo__btns"><a className="btn" href={href("/demo")}>Probar la demo</a><a className="btn btn--ghost-l" href={href("/#lista")}>Apuntarme a la lista</a></div>
      </div>
    </section>
  );
}

export function Faq({ items, title = "Preguntas frecuentes" }: { items: QA[]; title?: string }) {
  if (!items.length) return null;
  return (
    <section className="sp__sec" aria-labelledby="faq-t">
      <h2 id="faq-t">{title}</h2>
      <div className="sp__faq">{items.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}</div>
    </section>
  );
}

export const Source = () => (
  <p className="sp__src">Fuente: Orden PJC/297/2026, de 30 de marzo, art. 18 (<a href="https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-7296" rel="noopener" target="_blank">BOE-A-2026-7296</a>). Cálculos orientativos.</p>
);
