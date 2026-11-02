import { cuotaMaxima, cuotaMinima, tablaOficial } from "../engine/calc";
import { TABLA_2026 } from "../engine/tramos";
import { eur2 } from "./format";

const T = TABLA_2026;
const rango = (i: number) => {
  const prev = i === 0 ? 0 : T.tramos[i - 1].hasta, h = T.tramos[i].hasta;
  const f = (n: number) => eur2(n).replace(",00\u00a0€", "\u00a0€");
  return i === 0 ? `Hasta ${f(h)}` : h === Infinity ? `Más de ${f(prev)}` : `${f(prev)} – ${f(h)}`;
};

/** Full official table: the snippet search engines like to show for "tramos autónomos". */
export function TramosTable({ highlight }: { highlight?: number }) {
  return (
    <div className="tt__wrap">
      <table className="tt">
        <caption>Tramos de cotización de autónomos {T.year} (rendimientos netos mensuales)</caption>
        <thead><tr><th scope="col">Tramo</th><th scope="col">Rendimiento neto / mes</th><th scope="col">Base mínima</th><th scope="col">Base máxima</th><th scope="col">Cuota mínima</th><th scope="col">Cuota máxima</th></tr></thead>
        <tbody>
          {T.tramos.map((t, i) => { const of = tablaOficial(t.n); return (
            <tr key={t.n} className={highlight === t.n ? "hl" : ""}>
              <th scope="row">{t.n}<small>{of.tabla === "reducida" ? "Reducida" : "General"} {of.n}</small></th>
              <td>{rango(i)}</td><td>{eur2(t.baseMin)}</td><td>{eur2(t.baseMax)}</td><td>{eur2(cuotaMinima(t.n, T))}</td><td>{eur2(cuotaMaxima(t.n, T))}</td>
            </tr>); })}
        </tbody>
      </table>
    </div>
  );
}
export { rango };
