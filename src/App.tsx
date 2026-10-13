import { Logo } from "./components/Logo";
import { DemoVideo } from "./components/DemoVideo";
import { Waitlist } from "./components/Waitlist";
import "./styles/global.css";
import "./styles/landing.css";

const PAINS = [
  "«¿Qué tramo me toca?»",
  "«Me han reclamado 1.400 € de regularización»",
  "«¿Hasta cuándo puedo cambiar de base?»",
  "«No sé si voy a cerrar el año en el 8 o en el 9»",
  "«Otra vez el Excel»",
];

const FEATURES = [
  { t: "Seguimiento mensual", d: "Apuntas ingresos y gastos en 30 segundos. Tramix hace el resto.", big: true },
  { t: "Tú tienes el control", d: "Tramix no hace el trámite por ti ni te pide tu certificado digital.", big: true },
  { t: "Proyección en rango", d: "Ves entre qué tramos vas a cerrar el año, con el cálculo desglosado.", big: false },
  { t: "Avisos antes de cada ventana", d: "Hasta 6 cambios de base al año, cada uno con su fecha límite. Te escribimos antes de que pase.", big: false },
  { t: "Guía paso a paso", d: "Te decimos qué tramo elegir, cuánto evitas deber y cómo cambiarlo en Import@ss.", big: false },
];

export default function App() {
  return (
    <>
      <header className="nav container">
        <a href="/" aria-label="Tramix, inicio"><Logo /></a>
        <nav>
          <a href="#como">Cómo funciona</a>
          <a className="btn btn--ghost" href="#lista">Lista de espera</a>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero__glow" aria-hidden="true" />
          <div className="container hero__grid">
            <div className="hero__copy">
              <span className="chip"><i /> Para autónomos con ingresos reales</span>
              <h1>La regularización <em>ya no te pilla.</em></h1>
              <p className="hero__lead">
                Tramix sigue tus ingresos, proyecta cómo cierras el año y te avisa antes de cada plazo para cambiar de tramo.
              </p>
              <Waitlist id="wl-hero" />
              <p className="hero__fine">Sin tarjeta · Te avisamos cuando abramos</p>
            </div>
            <DemoVideo />
          </div>
        </section>

        <div className="ticker" aria-hidden="true">
          <div className="ticker__track">
            {[...PAINS, ...PAINS].map((p, i) => <span key={i}>{p}</span>)}
          </div>
        </div>

        <section className="section container versus" aria-labelledby="vs-title">
          <div className="versus__head">
            <span className="eyebrow">La diferencia</span>
            <h2 id="vs-title">Una calculadora te da una foto. <em>Tramix, la película.</em></h2>
          </div>
          <div className="versus__grid">
            <article className="vs vs--old">
              <h3>Calculadora de cuota</h3>
              <p>Metes lo que crees que vas a ganar. Te dice el tramo de hoy. Mañana ya no sirve.</p>
              <svg viewBox="0 0 200 60" aria-hidden="true"><circle cx="100" cy="30" r="5" fill="currentColor" /></svg>
            </article>
            <article className="vs vs--new">
              <h3>Tramix</h3>
              <p>Sigue tus ingresos reales, proyecta el cierre del año y te avisa cuando toca moverse.</p>
              <svg viewBox="0 0 200 60" aria-hidden="true">
                <path d="M4 50 C 40 48, 60 40, 90 34 S 150 14, 196 8" fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />
                <circle cx="196" cy="8" r="6" fill="var(--accent)" />
              </svg>
            </article>
          </div>
        </section>

        <section className="section container" aria-labelledby="feat-title">
          <span className="eyebrow">Qué hace por ti</span>
          <h2 id="feat-title" style={{ marginTop: 12, maxWidth: "14em" }}>Todo lo que te quita el miedo al 31 de octubre.</h2>
          <div className="bento">
            {FEATURES.map((f) => (
              <article key={f.t} className={`bento__item ${f.big ? "bento__item--big" : ""}`}>
                <h3>{f.t}</h3>
                <p className="muted">{f.d}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="band" id="como" aria-labelledby="how-title">
          <div className="container">
            <span className="eyebrow eyebrow--dark">Cómo funciona</span>
            <h2 id="how-title">Tres peldaños. El último te ahorra dinero.</h2>
            <ol className="stairs">
              <li><b>Apuntas</b><p>Ingresos y gastos de cada mes.</p></li>
              <li><b>Ves tu cierre</b><p>Proyección del año en rango.</p></li>
              <li><b>Cambias a tiempo</b><p>Aviso, tramo recomendado y guía.</p></li>
            </ol>
          </div>
        </section>

        <section className="cta container" id="lista" aria-labelledby="cta-title">
          <Logo size={56} withWordmark={false} />
          <h2 id="cta-title">Sé de las primeras en usarlo.</h2>
          <p className="muted">Déjanos tu email y te avisamos antes de la próxima ventana de cambio de tramo.</p>
          <Waitlist id="wl-final" />
        </section>
      </main>

      <footer className="footer container">
        <Logo size={24} />
        <p>Tramix ofrece cálculos orientativos y no constituye asesoramiento fiscal. © {new Date().getFullYear()} Tramix</p>
      </footer>
    </>
  );
}
