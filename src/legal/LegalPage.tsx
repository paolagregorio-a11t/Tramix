import type { ReactNode } from "react";
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
        <p>Tramix ofrece herramientas de cálculo y avisos <b>orientativos</b> sobre la base de cotización de trabajadores autónomos. La información no constituye asesoramiento fiscal, laboral ni jurídico. Las cifras dependen de los datos que introduce el usuario y de las tablas oficiales vigentes, que pueden cambiar. Antes de tomar una decisión conviene contrastarla con la Seguridad Social o con un profesional.</p>
        <h2>Propiedad intelectual</h2>
        <p>Los contenidos, el diseño, el nombre y el logotipo de Tramix pertenecen al titular. Queda prohibida su reproducción sin autorización.</p>
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
          <li><b>Email de la lista de espera.</b> Para avisarte del lanzamiento de Tramix y enviarte el correo de bienvenida. Base jurídica: tu consentimiento (art. 6.1.a RGPD).</li>
          <li><b>Datos introducidos en la demo.</b> Se guardan únicamente en tu navegador (almacenamiento local) y no se envían a ningún servidor.</li>
        </ul>
        <h2>Cuánto tiempo los conservamos</h2>
        <p>Hasta que retires tu consentimiento o solicites la supresión. Si no hay lanzamiento, se eliminarán a los 24 meses.</p>
        <h2>Destinatarios</h2>
        <p>Usamos proveedores que tratan datos por nuestra cuenta, con contrato de encargo de tratamiento: un servicio de envío de correo electrónico y la plataforma de alojamiento del sitio. No cedemos tus datos a terceros para fines propios.</p>
        <h2>Tus derechos</h2>
        <p>Puedes acceder, rectificar, suprimir, oponerte, limitar el tratamiento y solicitar la portabilidad de tus datos, y retirar el consentimiento en cualquier momento, escribiendo a {pend(TITULAR.email)}. Si consideras que no hemos atendido tus derechos, puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).</p>
        <h2>Darse de baja</h2>
        <p>Todos los correos incluyen un enlace para cancelar la suscripción.</p>
      </>
    ),
  },
  cookies: {
    title: "Política de cookies",
    body: (
      <>
        <p>Este sitio <b>no utiliza cookies de seguimiento, publicidad ni analítica</b>, por lo que no muestra banner de consentimiento.</p>
        <h2>Almacenamiento local</h2>
        <p>La demo guarda tus datos de ejemplo en el almacenamiento local de tu navegador para que no los pierdas al recargar. Es un almacenamiento estrictamente necesario para esa función, no se comparte y puedes borrarlo desde los ajustes de tu navegador o con el botón «Restablecer datos de ejemplo».</p>
        <p>Si en el futuro incorporamos analítica u otras cookies, actualizaremos esta política y te pediremos tu consentimiento antes de activarlas.</p>
      </>
    ),
  },
};

export function LegalPage({ page }: { page: LegalKey }) {
  const p = pages[page];
  return (
    <div className="legal">
      <header className="container legal__top">
        <a href="#" aria-label="Tramix, inicio"><Logo tone="dark" /></a>
        <a href="#" className="legal__back">← Volver</a>
      </header>
      <main className="container legal__main">
        <h1>{p.title}</h1>
        <p className="legal__date">Última actualización: {FECHA_LEGAL}</p>
        {p.body}
        <nav className="legal__nav" aria-label="Documentos legales">
          {(Object.keys(pages) as LegalKey[]).map((k) => <a key={k} href={`#${k}`} aria-current={k === page ? "page" : undefined}>{pages[k].title}</a>)}
        </nav>
      </main>
    </div>
  );
}
