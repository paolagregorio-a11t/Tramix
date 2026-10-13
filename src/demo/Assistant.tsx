import { useEffect, useRef, useState, type FormEvent } from "react";
import { IconSend, IconSpark } from "../components/Icons";
import { SUGERENCIAS, respuestaLocal, type AssistantData } from "./assistant";

type Msg = { role: "bot" | "user"; text: string; typing?: boolean };
const API = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";
const PREVIEW = import.meta.env.VITE_PREVIEW === "1";

function Reveal({ text, onDone }: { text: string; onDone: () => void }) {
  const [n, setN] = useState(0);
  const cb = useRef(onDone);
  cb.current = onDone; // keep the latest callback without restarting the animation
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setN(text.length); cb.current(); return; }
    let c = 0;
    const id = setInterval(() => { c = Math.min(text.length, c + 3); setN(c); if (c >= text.length) { clearInterval(id); cb.current(); } }, 16);
    return () => clearInterval(id);
  }, [text]);
  return <>{text.slice(0, n)}</>;
}

export function Assistant({ data, context }: { data: AssistantData; context: Record<string, unknown> }) {
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "bot", text: "Hola, soy el asistente de Tramix. Te explico tus números con tus propios datos. ¿Qué quieres saber?" }]);
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: "end", behavior: "smooth" }); }, [msgs, busy]);

  function say(text: string) { setMsgs((m) => [...m, { role: "bot", text, typing: true }]); setBusy(false); }
  const done = (i: number) => () => setMsgs((m) => m.map((x, j) => (j === i ? { ...x, typing: false } : x)));

  async function ask(q: string, local?: (typeof SUGERENCIAS)[number]["k"]) {
    if (busy) return;
    setMsgs((m) => [...m, { role: "user", text: q }]); setBusy(true);
    if (local) { setTimeout(() => say(respuestaLocal(local, data)), 550); return; }
    if (PREVIEW) { setTimeout(() => say("En la web publicada, esta pregunta la responde un modelo de IA con tus datos. En esta vista previa funcionan las preguntas sugeridas."), 500); return; }
    try {
      const res = await fetch(`${API}/api/ask`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question: q, context }) });
      const j = await res.json().catch(() => ({}));
      say(res.ok && j.answer ? j.answer : j.error || "No he podido responder ahora mismo. Prueba con una de las preguntas sugeridas.");
    } catch { say("No he podido conectar. Prueba con una de las preguntas sugeridas."); }
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = e.currentTarget; const input = f.elements.namedItem("q") as HTMLInputElement;
    const q = input.value.trim(); if (q.length < 3) return;
    input.value = ""; void ask(q);
  }

  return (
    <div className="chat">
      <div className="chat__log" role="log" aria-live="polite">
        {msgs.map((m, i) => (
          <div key={i} className={`bubble bubble--${m.role}`}>
            {m.role === "bot" && <span className="bubble__ic"><IconSpark size={14} /></span>}
            <p>{m.role === "bot" && m.typing ? <Reveal text={m.text} onDone={done(i)} /> : m.text}</p>
          </div>
        ))}
        {busy && <div className="bubble bubble--bot"><span className="bubble__ic"><IconSpark size={14} /></span><p className="dots" aria-label="Escribiendo"><i /><i /><i /></p></div>}
        <div ref={end} />
      </div>
      <div className="chat__chips">
        {SUGERENCIAS.map((s) => <button key={s.k} type="button" disabled={busy} onClick={() => ask(s.q, s.k)}>{s.q}</button>)}
      </div>
      <form className="chat__in" onSubmit={submit}>
        <label className="sr" htmlFor="chat-q">Tu pregunta</label>
        <input id="chat-q" name="q" maxLength={400} autoComplete="off" placeholder="Pregunta sobre tu cuota…" />
        <button type="submit" aria-label="Enviar" disabled={busy}><IconSend /></button>
      </form>
      <p className="chat__fine">Respuestas orientativas generadas con tus datos. No es asesoramiento fiscal.</p>
    </div>
  );
}
