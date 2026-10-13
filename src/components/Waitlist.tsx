import { useState, type FormEvent } from "react";

export function Waitlist({ id }: { id: string }) {
  const [done, setDone] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // TODO: persist to waitlist backend (e.g. Supabase).
    setDone(true);
  }

  if (done) {
    return <p role="status" className="wl-done">✓ Estás dentro. Te avisaremos antes de la próxima ventana de cambio.</p>;
  }

  return (
    <form className="wl" onSubmit={onSubmit}>
      <label htmlFor={id} className="sr">Tu email</label>
      <input id={id} type="email" required autoComplete="email" placeholder="tu@email.com" />
      <button className="btn" type="submit">Avísame</button>
    </form>
  );
}
