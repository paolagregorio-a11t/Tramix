import { Logo } from "./components/Logo";
import { HookCalculator } from "./components/HookCalculator";
import { Waitlist } from "./components/Waitlist";
import "./styles/global.css";
import "./styles/landing.css";

export default function App() {
  return (
    <>
      <header className="container nav">
        <a href="/" aria-label="Tramix, inicio" style={{ color: "inherit", textDecoration: "none" }}>
          <Logo />
        </a>
        <a className="btn btn--ghost" href="#lista">Lista de espera</a>
      </header>

      <main>
        <section className="hero">
          <div className="container hero__grid">
            <div>
              <span className="badge">Regularización de autónomos</span>
              <h1 style={{ marginTop: 16 }}>
                Sube de tramo <em>antes</em> de que te toque pagar de más.
              </h1>
              <p className="lead muted">
                Tramix sigue tus ingresos mes a mes, proyecta cómo vas a cerrar el año y te avisa
                antes de cada plazo para cambiar de tramo.
              </p>
              <div className="hero__cta">
                <a className="btn" href="#lista">Quiero que me avise</a>
                <a className="btn btn--ghost" href="#como">Cómo funciona</a>
              </div>
            </div>
            <HookCalculator />
          </div>
        </section>

        <section className="section" id="como">
          <div className="container">
            <span className="eyebrow">Cómo funciona</span>
            <h2 style={{ marginTop: 8 }}>Una película, no una foto</h2>
            <p className="muted" style={{ marginTop: 12, maxWidth: "40em" }}>
              Las calculadoras te dicen el tramo de hoy. Tramix mira el año completo y te avisa a tiempo.
            </p>
            <div className="steps">
              <div className="card step"><div className="step__num">1</div><h3>Apunta cada mes</h3><p className="muted">Ingresos y gastos: dos números y listo.</p></div>
              <div className="card step"><div className="step__num">2</div><h3>Mira tu proyección</h3><p className="muted">Un rango de cierre de año, nunca una cifra inventada.</p></div>
              <div className="card step"><div className="step__num">3</div><h3>Recibe el aviso</h3><p className="muted">Te decimos qué tramo elegir y cómo cambiarlo, paso a paso.</p></div>
            </div>
            <div className="card alert-example" style={{ marginTop: 24 }}>
              <span aria-hidden="true" style={{ fontSize: "1.6rem" }}>🔔</span>
              <div>
                <h3>Ejemplo de aviso</h3>
                <p className="muted">«Si no cambias de tramo antes del plazo, te tocará pagar unos 1.100 € en la regularización.»</p>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="lista">
          <div className="container">
            <span className="eyebrow">Acceso anticipado</span>
            <h2 style={{ margin: "8px 0 20px" }}>Sé de las primeras en probarlo</h2>
            <Waitlist />
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          <p>Tramix ofrece cálculos orientativos y no constituye asesoramiento fiscal.</p>
          <p>© {new Date().getFullYear()} Tramix</p>
        </div>
      </footer>
    </>
  );
}
