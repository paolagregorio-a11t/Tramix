import { useState, type FormEvent } from "react";

export function Waitlist({ id, dark = false }: { id: string; dark?: boolean }) {
  const [done, setDone] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // TODO: persist to waitlist backend (e.g. Supabase).
    setDone(true);
  }

  if (done) return <p role="status" className="wl-done"><span className="wl-check">✓</span> Estás dentro. Te avisamos antes de la próxima ventana.</p>;

  return (
    <form className={`wl ${dark ? "wl--dark" : ""}`} onSubmit={onSubmit}>
      <label htmlFor={id} className="sr">Tu email</label>
      <input id={id} type="email" required autoComplete="email" placeholder="tu@email.com" />
      <button className="btn" type="submit">Avísame</button>
    </form>
  );
}
