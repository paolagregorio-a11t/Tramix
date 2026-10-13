import { useEffect, useRef, useState } from "react";
import { Logo } from "./components/Logo";
import { PhoneDemo } from "./components/PhoneDemo";
import { Film } from "./components/Film";
import { Waitlist } from "./components/Waitlist";
import { Bell } from "./components/Icons";
import { Count, Reveal, useInView } from "./lib";
import { useRoute } from "./useRoute";
import { DemoApp } from "./demo/DemoApp";
import { LegalPage } from "./legal/LegalPage";
import "./styles/global.css";
import "./styles/landing.css";

const PAINS = ["¿Qué tramo me toca?", "Me han reclamado 1.400 €", "¿Hasta cuándo puedo cambiar de base?", "¿Cierro en el 8 o en el 9?", "Otra vez el Excel", "Regularización"];

function Words({ text, base = 0 }: { text: string; base?: number }) {
  return <>{text.split(" ").map((w, i) => <span className="w" key={i}><span style={{ ["--d" as string]: `${base + i * 0.09}s` }}>{w}&nbsp;</span></span>)}</>;
}

export default function App() {
  const route = useRoute();
  if (route === "demo") return <DemoApp />;
  if (route !== "home") return <LegalPage page={route} />;
  return <Home />;
}

function Home() {
  const hero = useRef<HTMLDivElement>(null);
  const [filmRef, filmSeen] = useInView<HTMLDivElement>(0.2);
  const [lineRef, lineSeen] = useInView<HTMLDivElement>(0.4);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let raf = 0;
    const on = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { document.documentElement.style.setProperty("--sy", String(scrollY)); setScrolled(scrollY > 40); }); };
    addEventListener("scroll", on, { passive: true });
    return () => removeEventListener("scroll", on);
  }, []);

  function tilt(e: React.MouseEvent) {
    const el = hero.current; if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--rx", `${((e.clientY - r.top) / r.height - 0.5) * -8}deg`);
    el.style.setProperty("--ry", `${((e.clientX - r.left) / r.width - 0.5) * 10}deg`);
  }

  return (
    <>
      <header className={`nav ${scrolled ? "nav--solid" : ""}`}>
        <div className="container nav__in">
          <a href="/" aria-label="Tramix, inicio"><Logo tone={scrolled ? "dark" : "light"} /></a>
          <nav>
            <a href="#corto">El corto</a>
            <a href="#demo">Probar la demo</a>
            <a href="#como">Cómo funciona</a>
            <a className="btn btn--ink" href="#lista">Lista de espera</a>
          </nav>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="hero" onMouseMove={tilt}>
          <div className="hero__bg" aria-hidden="true">
            <i style={{ ["--h" as string]: "34%" }} /><i style={{ ["--h" as string]: "58%" }} /><i style={{ ["--h" as string]: "86%" }} />
            <span className="orb orb--1" /><span className="orb orb--2" />
          </div>
          <div className="container hero__grid">
            <div className="hero__copy">
              <span className="tag"><i /> Nuevo · Para autónomos</span>
              <h1>
                <Words text="Elige tu tramo" /><br />
                <span className="hl"><Words text="a tiempo." base={0.35} /></span>
              </h1>
              <p className="hero__lead">Tramix sigue tus ingresos, proyecta cómo cierras el año y te avisa <b>antes</b> de cada plazo para cambiar de tramo.</p>
              <Waitlist id="wl-hero" />
              <a className="hero__demo" href="#demo">Probar la demo interactiva →</a>
              <p className="hero__fine">Sin tarjeta · Sin spam · Te das de baja cuando quieras</p>
            </div>
            <div className="stage" ref={hero}>
              <div className="stage__inner">
                <PhoneDemo />
                <div className="float f1"><b>−1.100 €</b> evitados</div>
                <div className="float f2"><Bell size={16} /> Plazo en 12 días</div>
                <div className="float f3">Tramo 9 ✓</div>
              </div>
            </div>
          </div>
        </section>

        {/* TICKERS */}
        <div className="tickers" aria-hidden="true">
          <div className="tick"><div>{[...PAINS, ...PAINS, ...PAINS].map((p, i) => <span key={i}>{p}</span>)}</div></div>
        </div>

        {/* EL CORTO */}
        <section className="film-sec" id="corto" ref={filmRef}>
          <div className="container">
            <Reveal><span className="kicker">El corto · 32 segundos</span></Reveal>
            <Reveal delay={0.05}><h2>Mira lo que <em>no</em> te va a pasar.</h2></Reveal>
            <Reveal delay={0.1}><Film active={filmSeen} /></Reveal>
            <p className="film__note">Animación con datos de ejemplo. La app llega pronto.</p>
          </div>
        </section>

        {/* FOTO vs PELÍCULA */}
        <section className="versus">
          <div className="container">
            <Reveal><h2>Una calculadora te da una <span className="strike">foto</span>.<br />Tramix te da <em>la película.</em></h2></Reveal>
            <div className="vs-grid" ref={lineRef}>
              <Reveal className="vs vs--old">
                <h3>Calculadora de cuota</h3>
                <p>Metes lo que crees que vas a ganar y te dice el tramo de hoy. Mañana ya no sirve.</p>
                <svg viewBox="0 0 240 90" aria-hidden="true"><circle cx="120" cy="45" r="8" fill="currentColor" /></svg>
              </Reveal>
              <Reveal className="vs vs--new" delay={0.12}>
                <h3>Tramix</h3>
                <p>Sigue tus ingresos reales, proyecta el año y te avisa justo cuando toca moverse.</p>
                <svg viewBox="0 0 240 90" aria-hidden="true">
                  <path className={`draw ${lineSeen ? "go" : ""}`} d="M6 78 C 50 74, 70 58, 110 50 S 170 24, 220 12" pathLength="1" />
                  <circle cx="220" cy="12" r="8" fill="var(--gold)" style={{ opacity: lineSeen ? 1 : 0, transition: "opacity .3s 1.5s" }} />
                </svg>
              </Reveal>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="feat" id="como">
          <div className="container">
            <Reveal><span className="kicker kicker--ink">Qué hace por ti</span></Reveal>
            <Reveal delay={0.05}><h2>Todo lo que te quita el miedo al <em>31 de octubre.</em></h2></Reveal>
            <div className="feat__grid">
              <Reveal className="fc fc--big fc--navy"><div className="viz viz--bars" aria-hidden="true">{[40, 62, 48, 80, 70, 95].map((h, i) => <i key={i} style={{ ["--h" as string]: `${h}%`, ["--i" as string]: i }} />)}</div><h3>Seguimiento mensual</h3><p>Apuntas ingresos y gastos en 30 segundos. Tramix hace el resto.</p></Reveal>
              <Reveal className="fc fc--big fc--paper" delay={0.08}><div className="viz viz--toggle" aria-hidden="true"><span><i /></span> Tú decides</div><h3>Tú tienes el control</h3><p>Tramix no hace el trámite por ti ni te pide tu certificado digital.</p></Reveal>
              <Reveal className="fc fc--gold" delay={0.08}><div className="viz viz--bell" aria-hidden="true"><span><Bell size={64} /></span><i /><i /></div><h3>Avisos antes de cada ventana</h3><p>Hasta 6 cambios de base al año, cada uno con su fecha límite.</p></Reveal>
              <Reveal className="fc fc--coral" delay={0.16}><div className="viz viz--line" aria-hidden="true"><svg viewBox="0 0 200 80"><path d="M4 70 C 40 66, 60 40, 100 34 S 160 12, 196 6" pathLength="1" /></svg></div><h3>Proyección en rango</h3><p>Ves entre qué tramos cierras el año, con el cálculo desglosado.</p></Reveal>
              <Reveal className="fc fc--ink" delay={0.08}><div className="viz viz--check" aria-hidden="true">{["Elige tramo", "Entra en Import@ss", "Confirma"].map((x, i) => <span key={x} style={{ ["--i" as string]: i }}><i>✓</i>{x}</span>)}</div><h3>Guía paso a paso</h3><p>Te decimos qué tramo elegir y cómo cambiarlo, sin perderte.</p></Reveal>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="stats">
          <div className="container stats__grid">
            <div><strong><Count to={6} /></strong><span>cambios de base al año, todos vigilados</span></div>
            <div><strong><Count to={12} /></strong><span>meses de película, no una foto</span></div>
            <div><strong><Count to={30} suffix=" s" /></strong><span>para apuntar tu mes</span></div>
            <div><strong><Count to={0} /></strong><span>certificados digitales que te pedimos</span></div>
          </div>
        </section>

        {/* CÓMO CALCULAMOS */}
        <section className="how" aria-labelledby="how2-title">
          <div className="container">
            <Reveal><span className="kicker kicker--ink">Transparencia</span></Reveal>
            <Reveal delay={0.05}><h2 id="how2-title" style={{ marginTop: 16 }}>Ves <em>cómo</em> sale cada número.</h2></Reveal>
            <div className="how__grid">
              <Reveal className="how__c"><b>1</b><h3>Rendimiento neto</h3><p>Ingresos menos gastos de cada mes, con la deducción genérica del 7 % (3 % si eres societario).</p></Reveal>
              <Reveal className="how__c" delay={0.08}><b>2</b><h3>Proyección en rango</h3><p>Estimamos el resto del año con tus últimos meses y un margen de ±15 %. Nunca una cifra exacta.</p></Reveal>
              <Reveal className="how__c" delay={0.16}><b>3</b><h3>Tramo y plazo</h3><p>Comparamos con la tabla de tramos del año y te avisamos antes de cada ventana de cambio.</p></Reveal>
            </div>
            <p className="how__note">Las tablas de tramos son datos configurables por año, no cifras escritas en el código. Cada cálculo es orientativo y no sustituye el consejo de un profesional.</p>
          </div>
        </section>

        {/* FAQ */}
        <section className="faq" aria-labelledby="faq-title">
          <div className="container">
            <Reveal><h2 id="faq-title">Preguntas <em>frecuentes</em></h2></Reveal>
            <div className="faq__list">
              <details><summary>¿Tramix presenta los trámites por mí?</summary><p>No. Te decimos qué tramo conviene y cómo cambiarlo paso a paso en Import@ss, pero el trámite lo haces tú. Por eso no necesitamos tu certificado digital.</p></details>
              <details><summary>¿Los cálculos son oficiales?</summary><p>Son orientativos. Se basan en lo que introduces y en las tablas de tramos de cada año, y no sustituyen el consejo de un gestor ni la información de la Seguridad Social.</p></details>
              <details><summary>¿Qué hacéis con mis datos?</summary><p>De momento solo guardamos tu email si te apuntas a la lista de espera, con tu consentimiento y para avisarte del lanzamiento. Los datos de la demo se quedan en tu navegador. Puedes leer los detalles en la <a href="#privacidad">política de privacidad</a>.</p></details>
              <details><summary>¿Cuándo estará disponible?</summary><p>Estamos preparando la primera versión. Quien se apunte a la lista recibirá un aviso antes que nadie, sin enviarte nada más mientras tanto.</p></details>
              <details><summary>¿Habrá app para móvil?</summary><p>Sí, la idea es tenerla en iPhone y Android. La demo ya funciona desde el navegador del móvil.</p></details>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta" id="lista">
          <div className="hero__bg" aria-hidden="true"><i style={{ ["--h" as string]: "30%" }} /><i style={{ ["--h" as string]: "55%" }} /><i style={{ ["--h" as string]: "80%" }} /></div>
          <div className="container cta__in">
            <Reveal><h2>Sé de las primeras en <em>subir de tramo.</em></h2></Reveal>
            <Reveal delay={0.1}><p>Déjanos tu email y te avisamos antes de la próxima ventana de cambio.</p></Reveal>
            <Reveal delay={0.15}><Waitlist id="wl-final" /></Reveal>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer__in">
          <Logo size={26} tone="light" />
          <nav className="footer__links" aria-label="Legal"><a href="#aviso-legal">Aviso legal</a><a href="#privacidad">Privacidad</a><a href="#cookies">Cookies</a></nav>
          <p>Cálculos orientativos; no es asesoramiento fiscal. © {new Date().getFullYear()} Tramix</p>
        </div>
      </footer>
    </>
  );
}
