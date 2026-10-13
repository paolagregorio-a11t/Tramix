/** The brand staircase as a data viz: 15 tramos, where you pay now vs where the year is heading. */
export function Ladder({ actual, bajo, alto }: { actual: number; bajo: number; alto: number }) {
  return (
    <div className="ladder" role="img" aria-label={`Pagas el tramo ${actual}. Previsión de cierre: tramo ${bajo === alto ? bajo : `${bajo} a ${alto}`}.`}>
      <div className="ladder__steps">
        {Array.from({ length: 15 }, (_, i) => {
          const n = i + 1; const inR = n >= bajo && n <= alto; const isA = n === actual;
          return (
            <div key={n} className={`ladder__s ${inR ? "range" : ""} ${isA ? "now" : ""}`} style={{ ["--h" as string]: `${28 + (i / 14) * 72}%` }}>
              {isA && <span className="ladder__tag ladder__tag--now">Pagas</span>}
              {inR && n === Math.round((bajo + alto) / 2) && !isA && <span className="ladder__tag">Previsto</span>}
              <i />
            </div>
          );
        })}
      </div>
      <div className="ladder__axis" aria-hidden="true"><span>1</span><span>5</span><span>10</span><span>15</span></div>
    </div>
  );
}
