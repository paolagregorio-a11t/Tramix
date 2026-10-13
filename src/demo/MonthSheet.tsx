import { useState } from "react";
import { IconClose } from "../components/Icons";
import { rendimientoMes, type Month, type Regimen } from "../engine/calc";
import { fmt } from "../lib";

type Props = { nombre: string; inicial: Month; regimen: Regimen; esNuevo: boolean; esUltimo: boolean; onSave: (m: Month) => void; onDelete: () => void; onClose: () => void };

/** Edit a month with sliders: quicker and friendlier than typing in a table. */
export function MonthSheet({ nombre, inicial, regimen, esNuevo, esUltimo, onSave, onDelete, onClose }: Props) {
  const [m, setM] = useState(inicial);
  const set = (k: keyof Month, v: string) => setM({ ...m, [k]: Math.max(0, Number(v.replace(",", ".")) || 0) });
  const comp = rendimientoMes(m, regimen);
  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label={`${esNuevo ? "Añadir" : "Editar"} ${nombre}`}>
      <button className="sheet__bg" aria-label="Cerrar" onClick={onClose} />
      <div className="sheet__p">
        <div className="sheet__h"><h2>{esNuevo ? `Añadir ${nombre}` : nombre}</h2><button className="iconbtn" aria-label="Cerrar" onClick={onClose}><IconClose /></button></div>
        {([["ingresos", "Ingresos", 8000, 50], ["gastos", "Gastos", 3000, 10]] as const).map(([k, l, max, step]) => (
          <div className="slider" key={k}>
            <div className="slider__top"><label htmlFor={`m-${k}`}>{l}</label>
              <span><input aria-label={`${l} en euros`} inputMode="decimal" value={m[k]} onChange={(e) => set(k, e.target.value)} /> €</span></div>
            <input id={`m-${k}`} type="range" min={0} max={max} step={step} value={Math.min(max, m[k])} onChange={(e) => set(k, e.target.value)} style={{ ["--p" as string]: `${(Math.min(max, m[k]) / max) * 100}%` }} />
          </div>
        ))}
        <div className="sheet__calc"><span>Rendimiento computable</span><b className="num">{fmt(Math.round(comp))} €</b></div>
        <p className="muted small">Gastos sin incluir la cuota de autónomo. Se aplica la deducción genérica del {regimen === "societario" ? 3 : 7} %.</p>
        <div className="sheet__btns">
          {!esNuevo && esUltimo && <button className="btn btn--ghost" onClick={onDelete}>Eliminar mes</button>}
          <button className="btn" onClick={() => onSave(m)}>{esNuevo ? "Añadir mes" : "Guardar"}</button>
        </div>
      </div>
    </div>
  );
}
