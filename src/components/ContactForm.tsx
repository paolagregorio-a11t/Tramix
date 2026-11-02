import { useState, type FormEvent } from "react";
import { href } from "../router";
import { PREVIEW, postJSON } from "../api";
import { IconCheck } from "./Icons";

export function ContactForm() {
  const [st, setSt] = useState<"idle" | "sending" | "done" | "preview" | "error">("idle");
  const [err, setErr] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (PREVIEW) { setSt("preview"); return; }
    setSt("sending");
    const r = await postJSON("/api/contact", { kind: "contacto", name: f.get("name"), email: f.get("email"), message: f.get("message"), consent: f.get("consent") === "on", website: f.get("website") });
    if (r.ok) setSt("done"); else { setErr(r.error); setSt("error"); }
  }
  if (st === "done" || st === "preview") return (
    <div className="cform__ok" role="status"><span className="wl-check"><IconCheck size={14} /></span>
      {st === "done" ? "Mensaje enviado. Te respondemos en uno o dos días." : "Vista previa: en la web publicada, este mensaje llegaría a nuestro correo."}</div>
  );
  return (
    <form className="cform" onSubmit={submit}>
      <div className="cform__row">
        <div className="cform__f"><label htmlFor="c-name">Nombre</label><input id="c-name" name="name" autoComplete="name" maxLength={80} /></div>
        <div className="cform__f"><label htmlFor="c-email">Email</label><input id="c-email" name="email" type="email" required autoComplete="email" /></div>
      </div>
      <div className="cform__f"><label htmlFor="c-msg">Mensaje</label><textarea id="c-msg" name="message" required minLength={5} maxLength={3000} rows={5} placeholder="Cuéntanos qué necesitas o qué te ha parecido la demo" /></div>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hp" />
      <label className="consent consent--dark"><input type="checkbox" name="consent" required /><span>Acepto la <a href={href("/privacidad")}>política de privacidad</a>. Solo usaremos tu email para responderte.</span></label>
      {st === "error" && <p role="alert" className="cform__err">{err}</p>}
      <button className="btn btn--navy" type="submit" disabled={st === "sending"}>{st === "sending" ? "Enviando…" : "Enviar mensaje"}</button>
    </form>
  );
}
