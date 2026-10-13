import { useState, type FormEvent } from "react";
import { IconCheck } from "./Icons";

type Status = "idle" | "sending" | "done" | "preview" | "error";
const API = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";
const PREVIEW = import.meta.env.VITE_PREVIEW === "1";

export function Waitlist({ id }: { id: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (PREVIEW) { setStatus("preview"); return; }
    setStatus("sending");
    try {
      const res = await fetch(`${API}/api/waitlist`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: f.get("email"), consent: f.get("consent") === "on", website: f.get("website") }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No hemos podido guardar tu email. Inténtalo de nuevo en unos minutos.");
      setStatus("done");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Algo ha fallado. Inténtalo de nuevo.");
      setStatus("error");
    }
  }

  if (status === "done") return <p role="status" className="wl-done"><span className="wl-check"><IconCheck size={14} /></span> Estás dentro. Revisa tu correo: te acabamos de escribir.</p>;
  if (status === "preview") return <p role="status" className="wl-done"><span className="wl-check"><IconCheck size={14} /></span> Vista previa: en la web real recibirías ahora el correo de bienvenida.</p>;

  return (
    <form className="wlf" onSubmit={onSubmit} noValidate={false}>
      <div className="wl">
        <label htmlFor={id} className="sr">Tu email</label>
        <input id={id} name="email" type="email" required autoComplete="email" placeholder="tu@email.com" />
        <button className="btn" type="submit" disabled={status === "sending"}>{status === "sending" ? "Enviando…" : "Avísame"}</button>
      </div>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hp" />
      <label className="consent">
        <input type="checkbox" name="consent" required />
        <span>Acepto recibir avisos de Tramix y la <a href="#privacidad">política de privacidad</a>.</span>
      </label>
      {status === "error" && <p role="alert" className="wl-err">{msg}</p>}
    </form>
  );
}
