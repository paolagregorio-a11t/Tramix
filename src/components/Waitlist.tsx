import { useRef, useState, type FormEvent } from "react";
import { confetti } from "../lib";

export function Waitlist({ id, dark = false }: { id: string; dark?: boolean }) {
  const [done, setDone] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // TODO: persist to waitlist backend (e.g. Supabase).
    const r = btn.current?.getBoundingClientRect();
    confetti(r ? r.left + r.width / 2 : innerWidth / 2, r ? r.top + r.height / 2 : innerHeight / 2);
    setDone(true);
  }

  if (done) return <p role="status" className="wl-done">🎉 ¡Estás dentro! Te avisamos antes de la próxima ventana.</p>;

  return (
    <form className={`wl ${dark ? "wl--dark" : ""}`} onSubmit={onSubmit}>
      <label htmlFor={id} className="sr">Tu email</label>
      <input id={id} type="email" required autoComplete="email" placeholder="tu@email.com" />
      <button ref={btn} className="btn" type="submit">Avísame</button>
    </form>
  );
}
