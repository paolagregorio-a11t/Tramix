import { useCallback, useEffect, useState } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { IconClose } from "../components/Icons";
import { href } from "../router";
import { surface, track } from "../analytics";
import { INCLUYE_PRO, PLANES, PRUEBA_DIAS, type Plan } from "./planes";
import { abrirPago, cobroActivo, esPro, leerSuscripcion, planDe, type Suscripcion } from "./pro";

const API = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";
const fechaLarga = (iso: string) => new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });

/** The person's subscription. `esperar` re-reads it a few times after paying, while Paddle's webhook arrives. */
export function useSuscripcion(sb: SupabaseClient, userId: string) {
  const [sub, setSub] = useState<Suscripcion | null | undefined>(cobroActivo() ? undefined : null);
  const leer = useCallback(() => leerSuscripcion(sb, userId).then((s) => { setSub(s); return s; }).catch(() => { setSub((x) => x ?? null); return null; }), [sb, userId]);
  useEffect(() => { if (cobroActivo()) void leer(); }, [leer]);
  const esperar = useCallback(async () => {
    for (let i = 0; i < 10; i++) {
      if (esPro(await leer())) return true;
      await new Promise((r) => setTimeout(r, 1500));
    }
    return false;
  }, [leer]);
  return { sub, esperar };
}

/** Plan picker. On the native app it only explains, because subscriptions are bought on the web. */
export function ProSheet({ session, donde, onClose, onPagado }: { session: Session; donde: string; onClose: () => void; onPagado: () => void }) {
  const [plan, setPlan] = useState<Plan>("anio");
  const [error, setError] = useState("");
  const [abriendo, setAbriendo] = useState(false);
  const nativa = surface() === "nativa";
  useEffect(() => { track("pro_ver", { donde }); }, [donde]);

  async function pagar() {
    setError(""); setAbriendo(true);
    track("pro_pago_abierto", { plan, donde });
    try {
      await abrirPago(plan, session.user.email ?? "", session.user.id, () => { track("pro_pago_ok", { plan }); onPagado(); });
      onClose();
    } catch { setError("No hemos podido abrir el pago. Revisa tu conexión e inténtalo de nuevo."); }
    setAbriendo(false);
  }

  return (
    <div className="isheet" role="dialog" aria-modal="true" aria-labelledby="pro-t">
      <button className="isheet__bg" aria-label="Cerrar" onClick={onClose} />
      <div className="isheet__p pro">
        <button className="isheet__x" aria-label="Cerrar" onClick={onClose}><IconClose /></button>
        <span className="pro-tag">Pro</span>
        <h2 id="pro-t">Cuotio Pro</h2>
        <ul className="pro-incluye">{INCLUYE_PRO.map((t) => <li key={t}>{t}</li>)}</ul>
        {nativa ? <p className="isheet__lead">Cuotio Pro se contrata desde la web, en cuotio.es/app, con la misma cuenta. Después lo tendrás también aquí.</p> : (<>
          <div className="pro-planes" role="radiogroup" aria-label="Plan">
            {(Object.keys(PLANES) as Plan[]).map((k) => (
              <button key={k} type="button" role="radio" aria-checked={plan === k} className={`pro-plan ${plan === k ? "on" : ""}`} onClick={() => setPlan(k)}>
                <small>{PLANES[k].nombre}</small><b>{PLANES[k].precio}</b><span>{PLANES[k].periodo}</span>{PLANES[k].nota && <em>{PLANES[k].nota}</em>}
              </button>))}
          </div>
          <button className="btn pro-go" disabled={abriendo} onClick={pagar}>{abriendo ? "Abriendo…" : `Empezar ${PRUEBA_DIAS} días gratis`}</button>
          <p className="isheet__fine">Hoy no se cobra nada. Si no cancelas, al acabar la prueba se cobra {PLANES[plan].precio} {PLANES[plan].periodo}. Cancela cuando quieras. Cobra Paddle, que emite la factura. <a href={href("/condiciones")} target="_blank" rel="noopener">Condiciones</a></p>
        </>)}
        {error && <p role="alert" className="cu-error">{error}</p>}
      </div>
    </div>
  );
}

/** "Tu plan" block in Ajustes. */
export function PlanAjustes({ sub, session, onMejorar }: { sub: Suscripcion | null | undefined; session: Session; onMejorar: () => void }) {
  const [abriendo, setAbriendo] = useState(false);
  const [error, setError] = useState("");
  if (!cobroActivo()) return null;
  const pro = esPro(sub ?? null);

  async function gestionar() {
    setAbriendo(true); setError("");
    try {
      const r = await fetch(`${API}/api/paddle-portal`, { method: "POST", headers: { authorization: `Bearer ${session.access_token}` } });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.url) throw new Error(d.error);
      track("pro_portal");
      location.href = d.url;
    } catch (e) { setError((e instanceof Error && e.message) || "No hemos podido abrir la gestión de la suscripción."); setAbriendo(false); }
  }

  let estado = "Gratis";
  if (sub && pro) {
    const plan = planDe(sub), fin = sub.periodo_fin ? fechaLarga(sub.periodo_fin) : "";
    estado = sub.estado === "trialing" ? `Pro · prueba gratis${fin ? ` hasta el ${fin}` : ""}`
      : sub.estado === "past_due" ? "Pro · hay un problema con el cobro, revisa tu tarjeta"
      : `Pro ${plan ? PLANES[plan].nombre.toLowerCase() : ""}${fin ? ` · ${sub.cancela_al_final ? "termina" : "se renueva"} el ${fin}` : ""}`;
  }
  return (
    <div className="cu-plan">
      <div className="cu-email"><small>Tu plan</small><b>{sub === undefined ? "…" : estado}</b></div>
      {sub !== undefined && (pro || sub ? <button className="btn btn--soft" disabled={abriendo} onClick={gestionar}>{abriendo ? "Abriendo…" : "Gestionar suscripción"}</button>
        : <button className="btn" onClick={onMejorar}>Probar Pro {PRUEBA_DIAS} días gratis</button>)}
      {sub && !pro && <button className="btn" onClick={onMejorar}>Volver a Pro</button>}
      {error && <p role="alert" className="cu-error">{error}</p>}
    </div>
  );
}
