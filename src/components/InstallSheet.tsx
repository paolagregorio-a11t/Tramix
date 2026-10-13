import { useInstall } from "../install";
import { IconClose, IconDownload, IconShare } from "./Icons";

/** Explains, per platform, how to put Tramix on the home screen. No app store needed. */
export function InstallSheet({ onClose }: { onClose: () => void }) {
  const { platform, canPrompt, prompt, standalone } = useInstall();
  return (
    <div className="isheet" role="dialog" aria-modal="true" aria-labelledby="inst-t">
      <button className="isheet__bg" aria-label="Cerrar" onClick={onClose} />
      <div className="isheet__p">
        <button className="isheet__x" aria-label="Cerrar" onClick={onClose}><IconClose /></button>
        <h2 id="inst-t">Instala Tramix en tu móvil</h2>
        <p className="isheet__lead">Se abre como una app, a pantalla completa y con su icono. Sin tiendas ni descargas.</p>
        {standalone && <p className="isheet__ok">Ya la estás usando como app.</p>}
        {canPrompt && <button className="btn isheet__go" onClick={async () => { if (await prompt()) onClose(); }}><IconDownload /> Instalar ahora</button>}
        <ol className="isheet__steps">
          {platform === "ios" ? (<>
            <li>Abre esta página en <b>Safari</b>.</li>
            <li>Toca el botón <b>Compartir</b> <IconShare size={15} /> de la barra inferior.</li>
            <li>Elige <b>Añadir a pantalla de inicio</b> y pulsa <b>Añadir</b>.</li>
          </>) : platform === "android" ? (<>
            <li>Abre esta página en <b>Chrome</b>.</li>
            <li>Toca el menú <b>⋮</b> de arriba a la derecha.</li>
            <li>Elige <b>Instalar aplicación</b> (o <b>Añadir a pantalla de inicio</b>).</li>
          </>) : (<>
            <li>En Chrome o Edge, pulsa el icono de <b>instalar</b> en la barra de direcciones.</li>
            <li>Para probarla en el móvil, abre esta misma dirección desde tu teléfono.</li>
          </>)}
        </ol>
        <p className="isheet__fine">{platform === "ios" ? "En iPhone solo funciona desde Safari." : "Desde el móvil se instala igual: abre la web en Chrome (Android) o Safari (iPhone)."}</p>
      </div>
    </div>
  );
}
