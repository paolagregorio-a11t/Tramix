import { useState } from "react";
import { PREVIEW, postJSON } from "../api";
import { IconCheck, IconClose } from "../components/Icons";
import { track } from "../analytics";

const CARAS = ["😞", "🙁", "😐", "🙂", "😍"];
const USARIA = [["si", "Sí"], ["quiza", "Quizá"], ["no", "No"]] as const;

/** Lets testers rate the demo in ten seconds. Feedback goes to the owner's inbox. */
export function FeedbackSheet({ onClose }: { onClose: () => void }) {
  const [rating, setRating] = useState(0);
  const [usaria, setUsaria] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [email, setEmail] = useState("");
  const [st, setSt] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [err, setErr] = useState("");

  async function send() {
    if (PREVIEW) { setSt("done"); return; }
    setSt("sending");
    const r = await postJSON("/api/contact", { kind: "opinion", rating: rating || undefined, usaria: usaria ?? undefined, message: msg, email: email || undefined });
    if (r.ok) { setSt("done"); track("opinion_enviada", { valoracion: rating, usaria: usaria ?? "sin_respuesta", con_texto: msg.trim().length > 0 }); } else { setErr(r.error); setSt("error"); }
  }

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label="Tu opinión">
      <button className="sheet__bg" aria-label="Cerrar" onClick={onClose} />
      <div className="sheet__p">
        <div className="sheet__h"><h2>{st === "done" ? "¡Gracias!" : "¿Qué te parece?"}</h2><button className="iconbtn" aria-label="Cerrar" onClick={onClose}><IconClose /></button></div>
        {st === "done" ? (<>
          <p className="muted">{PREVIEW ? "Vista previa: en la web publicada, tu opinión nos llegaría por correo." : "Tu opinión nos ha llegado. Nos ayuda muchísimo a mejorar Cuotio."}</p>
          <button className="btn" onClick={onClose}><IconCheck /> Volver a la demo</button>
        </>) : (<>
          <div className="fb__faces" role="radiogroup" aria-label="Valoración de 1 a 5">
            {CARAS.map((c, i) => <button key={i} type="button" role="radio" aria-checked={rating === i + 1} aria-label={`${i + 1} de 5`} className={rating === i + 1 ? "on" : ""} onClick={() => setRating(i + 1)}>{c}</button>)}
          </div>
          <div className="fld"><span className="fb__q">¿Lo usarías para tu cuota de autónomo?</span>
            <div className="seg" role="radiogroup" aria-label="¿Lo usarías?">
              {USARIA.map(([k, l]) => <button key={k} type="button" role="radio" aria-checked={usaria === k} className={usaria === k ? "on" : ""} onClick={() => setUsaria(k)}>{l}</button>)}
            </div></div>
          <div className="fld"><label htmlFor="fb-msg">¿Qué cambiarías o qué echas de menos?</label>
            <textarea id="fb-msg" rows={3} maxLength={3000} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Opcional" /></div>
          <div className="fld"><label htmlFor="fb-email">Tu email, si quieres que te contestemos</label>
            <input id="fb-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Opcional" autoComplete="email" /></div>
          {st === "error" && <p role="alert" className="fb__err">{err}</p>}
          <button className="btn" disabled={st === "sending" || (!rating && msg.trim().length < 2)} onClick={send}>{st === "sending" ? "Enviando…" : "Enviar opinión"}</button>
        </>)}
      </div>
    </div>
  );
}
