import { useEffect, useState, type ReactNode } from "react";
import { doNotTrack, optedOut, setOptOut } from "../analytics";
import { href } from "../router";
import { Logo } from "../components/Logo";
import { FECHA_LEGAL, TITULAR, pend } from "./config";
import "../styles/legal.css";

export type LegalKey = "privacidad" | "aviso-legal" | "cookies";

const pages: Record<LegalKey, { title: string; body: ReactNode }> = {
  "aviso-legal": {
    title: "Aviso legal",
    body: (
      <>
        <h2>Titular del sitio</h2>
        <p>En cumplimiento del artículo 10 de la Ley 34/2002 (LSSI-CE), se informa de que este sitio web es titularidad de:</p>
        <ul>
          <li><b>Titular:</b> {pend(TITULAR.nombre)}</li>
          <li><b>NIF:</b> {pend(TITULAR.nif)}</li>
          <li><b>Domicilio:</b> {pend(TITULAR.domicilio)}</li>
          <li><b>Email:</b> {pend(TITULAR.email)}</li>
        </ul>
        <h2>Naturaleza del servicio</h2>
        <p>Cuotio ofrece herramientas de cálculo y avisos <b>orientativos</b> sobre la base de cotización de trabajadores autónomos. La información no constituye asesoramiento fiscal, laboral ni jurídico. Las cifras dependen de los datos que introduce el usuario y de las tablas oficiales vigentes, que pueden cambiar. Antes de tomar una decisión conviene contrastarla con la Seguridad Social o con un profesional.</p>
        <h2>Propiedad intelectual</h2>
        <p>Los contenidos, el diseño, el nombre y el logotipo de Cuotio pertenecen al titular. Queda prohibida su reproducción sin autorización.</p>
        <h2>Limitación de responsabilidad</h2>
        <p>El titular no responde de las decisiones adoptadas a partir de los cálculos mostrados ni de posibles errores u omisiones en la información, que se ofrece tal cual y con fines informativos.</p>
      </>
    ),
  },
  privacidad: {
    title: "Política de privacidad",
    body: (
      <>
        <h2>Responsable del tratamiento</h2>
        <p>{pend(TITULAR.nombre)} · NIF {pend(TITULAR.nif)} · {pend(TITULAR.domicilio)} · {pend(TITULAR.email)}</p>
        <h2>Qué datos tratamos y para qué</h2>
        <ul>
          <li><b>Email de la lista de espera.</b> Para avisarte del lanzamiento de Cuotio y enviarte el correo de bienvenida. Base jurídica: tu consentimiento (art. 6.1.a RGPD).</li>
          <li><b>Tu cuenta.</b> Si creas una cuenta guardamos tu email (para que entres con un código, sin contraseña), el tramo que pagas, tu tipo de autónomo, tus preferencias de avisos y los ingresos y gastos que registras cada mes. Los usamos solo para calcular tu tramo, mostrarte la proyección y avisarte antes de cada plazo. Base jurídica: la prestación del servicio que nos pides al crear la cuenta (art. 6.1.b RGPD). Se guardan en servidores de la Unión Europea (Frankfurt, Alemania), cifrados, y cada cuenta solo puede leer sus propios datos.</li>
          <li><b>Datos introducidos en la demo.</b> Se guardan únicamente en tu navegador (almacenamiento local) y no se envían a ningún servidor, salvo que al crear tu cuenta elijas traspasarlos a ella.</li>
          <li><b>Extractos bancarios.</b> Se leen en tu propio dispositivo para calcular tus ingresos y gastos. No se envían a ningún servidor.</li>
          <li><b>Facturas.</b> Si subes una factura, se envía a Google (Gemini) únicamente para extraer sus datos (fecha, importes, emisor y cliente) y mostrártelos. No la guardamos. Solo se envía si marcas la casilla de aceptación. Base jurídica: tu consentimiento.</li>
          <li><b>Estadísticas de uso anónimas.</b> Contamos visitas y algunos pasos (por ejemplo, si se usa la calculadora, si se abre la demo o si se completa el formulario de la lista de espera) para saber qué partes de Cuotio cuestan más y mejorarlas. Usamos Umami, una herramienta sin cookies que no guarda nada en tu dispositivo ni tu dirección IP, y que no permite identificarte ni seguirte entre sitios. Nunca enviamos tu email, tus importes ni lo que escribes. Base jurídica: nuestro interés legítimo en mejorar el servicio (art. 6.1.f RGPD). Puedes desactivarlas en la <a href={href("/cookies")}>política de cookies</a>, y respetamos la opción «No rastrear» de tu navegador.</li>
          <li><b>Preguntas al asistente.</b> Si escribes una pregunta libre, se envía junto con unas cifras agregadas (tramo, rendimiento mensual previsto, plazo) a un proveedor de modelos de inteligencia artificial para generar la respuesta. No enviamos tu email ni datos que te identifiquen; no escribas datos personales en la pregunta. Base jurídica: tu iniciativa al usar la función.</li>
        </ul>
        <h2>Cuánto tiempo los conservamos</h2>
        <p>Email de la lista de espera: hasta que retires tu consentimiento o solicites la supresión; si no hay lanzamiento, se eliminarán a los 24 meses. Datos de tu cuenta: mientras la mantengas abierta. Cuando la borras, se eliminan al momento tu cuenta, tus ajustes y tus meses; las copias de seguridad del proveedor se sobrescriben en un plazo máximo de 30 días.</p>
        <h2>Destinatarios</h2>
        <p>Usamos proveedores que tratan datos por nuestra cuenta, con contrato de encargo de tratamiento: un servicio de envío de correo electrónico (Resend, región UE), la plataforma de alojamiento del sitio (Vercel, con las funciones del servidor en Frankfurt), la base de datos y el sistema de cuentas (Supabase, con servidores en Frankfurt), el servicio de estadísticas anónimas (Umami, con servidores en la Unión Europea) y un proveedor de inteligencia artificial para el asistente. No cedemos tus datos a terceros para fines propios. Algunos de estos proveedores son empresas de Estados Unidos: si alguna vez acceden a datos desde fuera de la Unión Europea, lo hacen con las garantías del RGPD (cláusulas contractuales tipo de la Comisión Europea o el Marco de Privacidad de Datos UE-EE. UU.).</p>
        <h2>Tus derechos</h2>
        <p>Puedes acceder, rectificar, suprimir, oponerte, limitar el tratamiento y solicitar la portabilidad de tus datos, y retirar el consentimiento en cualquier momento, escribiendo a {pend(TITULAR.email)}. Si tienes cuenta, desde <b>Ajustes</b> puedes además descargar todos tus datos y borrar tu cuenta tú mismo. Si consideras que no hemos atendido tus derechos, puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).</p>
        <h2>Darse de baja</h2>
        <p>Todos los correos incluyen un enlace para cancelar la suscripción.</p>
      </>
    ),
  },
  cookies: {
    title: "Política de cookies",
    body: (
      <>
        <p>Este sitio <b>no utiliza cookies</b> de seguimiento, publicidad ni analítica, por lo que no muestra banner de consentimiento.</p>
        <h2>Estadísticas de uso sin cookies</h2>
        <p>Para saber qué partes de Cuotio cuestan más, contamos visitas y algunos pasos de forma anónima con Umami. No usa cookies, no guarda nada en tu dispositivo ni tu dirección IP, y no te identifica ni te sigue entre sitios. Si tu navegador tiene activada la opción «No rastrear», no se cuenta nada.</p>
        <OptOut />
        <h2>Almacenamiento local</h2>
        <p>La demo guarda tus datos de ejemplo en el almacenamiento local de tu navegador para que no los pierdas al recargar. Es un almacenamiento estrictamente necesario para esa función, no se comparte y puedes borrarlo desde los ajustes de tu navegador o con el botón «Restablecer datos de ejemplo».</p>
        <p>Si tienes cuenta, el navegador guarda también tu sesión en el almacenamiento local para que no tengas que entrar cada vez. Es estrictamente necesario para usar tu cuenta y se borra al cerrar sesión.</p>
        <p>Si en el futuro incorporamos cookies, actualizaremos esta política y te pediremos tu consentimiento antes de activarlas.</p>
      </>
    ),
  },
};

/** Lets a visitor switch the anonymous statistics off (or back on) for this browser. */
function OptOut() {
  const [off, setOff] = useState<boolean | null>(null);
  useEffect(() => { setOff(optedOut()); }, []);
  if (off === null) return null;
  if (doNotTrack()) return <p>Tu navegador tiene activada la opción «No rastrear», así que no contamos nada de tu visita.</p>;
  return (
    <p>
      {off ? "Las estadísticas están desactivadas en este navegador. " : "Las estadísticas están activadas en este navegador. "}
      <button type="button" className="legal__opt" onClick={() => { setOptOut(!off); setOff(!off); }}>{off ? "Volver a activarlas" : "Desactivarlas"}</button>
      {off ? null : " (se guarda una marca en este navegador para recordarlo)."}
    </p>
  );
}

export function LegalPage({ page }: { page: LegalKey }) {
  const p = pages[page];
  return (
    <div className="legal">
      <header className="container legal__top">
        <a href={href("/")} aria-label="Cuotio, inicio"><Logo tone="dark" /></a>
        <a href={href("/")} className="legal__back">← Volver</a>
      </header>
      <main className="container legal__main">
        <h1>{p.title}</h1>
        <p className="legal__date">Última actualización: {FECHA_LEGAL}</p>
        {p.body}
        <nav className="legal__nav" aria-label="Documentos legales">
          {(Object.keys(pages) as LegalKey[]).map((k) => <a key={k} href={href(`/${k}`)} aria-current={k === page ? "page" : undefined}>{pages[k].title}</a>)}
        </nav>
      </main>
    </div>
  );
}
