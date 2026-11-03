import { useState } from "react";
import { href } from "../router";
import { Logo } from "../components/Logo";
import { IconArrow, IconCheck, IconDownload } from "../components/Icons";
import { InstallSheet } from "../components/InstallSheet";
import { tablaDe } from "../engine/tramos";
import { useInstall } from "../install";
import { useDemoState } from "./useDemoState";
import { CuotioApp, estadoTabla, type Sheet } from "../app/CuotioApp";
import { track } from "../analytics";
import "../styles/demo.css";

export function DemoApp() {
  const [s, setS, reset] = useDemoState();
  const [sheet, setSheet] = useState<Sheet>(null);
  const install = useInstall();
  const estadoTxt = estadoTabla(tablaDe(new Date().getFullYear()));

  return (
    <div className="dm">
      <div className="dm__top container">
        <a href={href("/")} className="dm__back" onClick={() => track("demo_volver_web")}><IconArrow /> Volver a la web</a>
        <div className="dm__top-r">
          <span className="dm__badge">Demo · datos de ejemplo</span>
          <button className="dm__fb" onClick={() => setSheet("fb")}>Danos tu opinión</button>
        </div>
      </div>

      <div className="dm__stage container">
        <aside className="dm__side">
          <Logo size={30} tone="light" />
          <h1>Así se ve Cuotio por dentro.</h1>
          <p>Toca el gráfico, mueve el simulador, edita un mes o pregunta al asistente. Todo se calcula al momento, en tu navegador.</p>
          <ul>
            <li><IconCheck /> Proyección siempre en rango, nunca una cifra inventada</li>
            <li><IconCheck /> Cálculo desglosado paso a paso</li>
            <li><IconCheck /> Aviso antes de cada plazo de cambio</li>
          </ul>
          <div className="dm__actions">
            <button className="btn" onClick={() => setSheet("fb")}>Danos tu opinión</button>
            {!install.standalone && <button className="btn btn--line dm__install" onClick={() => setSheet("install")}><IconDownload /> Instalar en tu móvil</button>}
          </div>
          <p className="dm__warn">{estadoTxt} Este cálculo es orientativo y no es asesoramiento fiscal.</p>
        </aside>

        <div className="device">
          <div className="device__island" aria-hidden="true" />
          <CuotioApp modo="demo" state={s} setState={setS} sheet={sheet} setSheet={setSheet} onReset={reset} notaDatos="Tus datos se guardan solo en este navegador." />
        </div>
      </div>
      {sheet === "install" && <InstallSheet onClose={() => setSheet(null)} />}
    </div>
  );
}
