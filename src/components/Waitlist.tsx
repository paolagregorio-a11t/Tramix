import { useState, type FormEvent } from "react";

export function Waitlist() {
  const [done, setDone] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // TODO: persist to waitlist backend.
    setDone(true);
  }

  if (done) {
    return <p role="status" className="badge">✓ Estás en la lista. Te avisaremos antes de la próxima ventana.</p>;
  }

  return (
    <form className="waitlist" onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="wl-email">Tu email</label>
        <input id="wl-email" type="email" required autoComplete="email" placeholder="tu@email.com" />
      </div>
      <button className="btn" type="submit">Apuntarme a la lista de espera</button>
    </form>
  );
}
