import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { href } from "../router";
import { Logo } from "../components/Logo";
import { InstallSheet } from "../components/InstallSheet";
import { CuotioApp, type Sheet } from "../app/CuotioApp";
import { EJEMPLO, type DemoState } from "../demo/useDemoState";
import { cuotaMinima } from "../engine/calc";
import { tablaDe } from "../engine/tramos";
import { fmt } from "../lib";
import { track } from "../analytics";
import { cargar, exportar, guardar } from "./datos";
import { cuentasActivas, supabase } from "./supabase";
import "../styles/demo.css";
import "../styles/cuenta.css";

const API = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";
const DEMO_KEY = "cuotio-demo-v1";
const anioActual = () => new Date().getFullYear();

/** Frame shared by every screen of /app: the same look as the app, full screen. */
function Pantalla({ children, titulo = "Cuotio" }: { children: ReactNode; titulo?: string }) {
  return (
    <div className="cu">
      <div className="app app--full" role="main" aria-label={titulo}>
        <header className="app__head"><a href={href("/")} aria-label="Cuotio, inicio"><Logo size={22} tone="dark" /></a></header>
        <div className="app__body">{children}</div>
      </div>
    </div>
  );
}

/** /app: sign in with a code sent by email, first-time setup, and then the app with the person's own data. */
export function CuentaPage() {
  const [sb, setSb] = useState<SupabaseClient | null>(null);
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    if (!cuentasActivas()) return;
    let off = () => {};
    supabase().then((c) => {
      setSb(c);
      c.auth.getSession().then(({ data }) => setSession(data.session));
      const { data } = c.auth.onAuthStateChange((_e, s) => setSession(s));
      off = () => data.subscription.unsubscribe();
    }).catch(() => setFallo(true));
    return () => off();
  }, []);

  if (!cuentasActivas()) return (
    <Pantalla><section className="card"><h2>Las cuentas llegan muy pronto</h2>
      <p className="muted">Mientras tanto puedes probar la demo con datos de ejemplo o apuntarte a la lista de espera.</p>
      <a className="btn" href={href("/demo")}>Probar la demo</a></section></Pantalla>);
  if (fallo) return <Pantalla><section className="card"><h2>No hemos podido cargar Cuotio</h2><p className="muted">Revisa tu conexión y vuelve a intentarlo.</p><button className="btn" onClick={() => location.reload()}>Reintentar</button></section></Pantalla>;
  if (!sb || session === undefined) return <Pantalla><p className="cu-cargando" role="status">Cargando…</p></Pantalla>;
  if (!session) return <Entrar sb={sb} />;
  return <MiCuenta key={session.user.id} sb={sb} session={session} />;
}

/* ---------- Sign in: email, then the code we send. No passwords to keep or leak. ---------- */

function Entrar({ sb }: { sb: SupabaseClient }) {
  const [email, setEmail] = useState("");
  const [paso, setPaso] = useState<"email" | "codigo">("email");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  async function pedirCodigo(e?: FormEvent) {
    e?.preventDefault();
    setEnviando(true); setError(""); setAviso("");
    const { error } = await sb.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { shouldCreateUser: true } });
    setEnviando(false);
    if (error) {
      track("cuenta_entrada_error", { paso: "email" });
      setError(error.status === 429 ? "Has pedido varios códigos seguidos. Espera un minuto y vuelve a intentarlo." : "No hemos podido enviarte el código. Revisa el email e inténtalo de nuevo.");
      return;
    }
    track("cuenta_codigo_pedido");
    if (paso === "codigo") setAviso("Te hemos enviado un código nuevo.");
    setPaso("codigo");
  }

  async function comprobar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const token = String(new FormData(e.currentTarget).get("codigo") ?? "").replace(/\D/g, "");
    setEnviando(true); setError(""); setAviso("");
    const { error } = await sb.auth.verifyOtp({ email: email.trim().toLowerCase(), token, type: "email" });
    setEnviando(false);
    if (error) { track("cuenta_entrada_error", { paso: "codigo" }); setError("El código no es correcto o ha caducado. Revísalo o pide uno nuevo."); return; }
    track("cuenta_entrada_ok");
  }

  if (paso === "codigo") return (
    <Pantalla titulo="Entrar en Cuotio">
      <form className="card cu-form" onSubmit={comprobar}>
        <h2>Revisa tu correo</h2>
        <p className="muted">Te hemos enviado un código a <b>{email}</b>. Escríbelo aquí. Caduca en una hora.</p>
        <div className="fld"><label htmlFor="codigo">Código</label>
          <input id="codigo" name="codigo" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,12}" maxLength={12} required autoFocus className="cu-codigo" /></div>
        <button className="btn" type="submit" disabled={enviando}>{enviando ? "Comprobando…" : "Entrar"}</button>
        {error && <p role="alert" className="cu-error">{error}</p>}
        {aviso && <p role="status" className="muted small">{aviso}</p>}
        <p className="muted small">¿No te llega? Mira en spam o <button type="button" className="linkbtn" disabled={enviando} onClick={() => pedirCodigo()}>pide otro código</button>. <button type="button" className="linkbtn" onClick={() => { setPaso("email"); setError(""); }}>Cambiar email</button></p>
      </form>
    </Pantalla>
  );

  return (
    <Pantalla titulo="Entrar en Cuotio">
      <form className="card cu-form" onSubmit={pedirCodigo}>
        <h2>Entra o crea tu cuenta</h2>
        <p className="muted">Te mandamos un código al email. Sin contraseñas.</p>
        <div className="fld"><label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <label className="cu-consent"><input type="checkbox" required /> <span>He leído la <a href={href("/privacidad")}>política de privacidad</a>. Mis datos se guardan en servidores de la Unión Europea.</span></label>
        <button className="btn" type="submit" disabled={enviando}>{enviando ? "Enviando…" : "Enviarme el código"}</button>
        {error && <p role="alert" className="cu-error">{error}</p>}
      </form>
      <p className="muted small cu-pie">¿Solo quieres echar un vistazo? <a href={href("/demo")}>Prueba la demo</a> sin registrarte.</p>
    </Pantalla>
  );
}

/* ---------- The account: load, first-time setup, and saving every change. ---------- */

type Estado = "guardado" | "guardando" | "error";

/** Data typed in the demo on this browser, if it is not just the sample. Offered once when the account is created. */
function datosDeDemo(): DemoState | null {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    if (!raw) return null;
    const s = { ...EJEMPLO, ...JSON.parse(raw) } as DemoState;
    return JSON.stringify(s) === JSON.stringify(EJEMPLO) || !Array.isArray(s.meses) ? null : s;
  } catch { return null; }
}

function MiCuenta({ sb, session }: { sb: SupabaseClient; session: Session }) {
  const uid = session.user.id;
  const anio = useRef(anioActual()).current;
  const [state, setState] = useState<DemoState | null | undefined>(undefined);
  const [errorCarga, setErrorCarga] = useState(false);
  const [estado, setEstado] = useState<Estado>("guardado");
  const guardadoRef = useRef<DemoState | null>(null);   // what the database has
  const actualRef = useRef<DemoState | null>(null);     // what the screen shows
  const enCurso = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const leer = useCallback(() => {
    setErrorCarga(false);
    cargar(sb, uid, anio).then((s) => { guardadoRef.current = s; actualRef.current = s; setState(s); }).catch(() => setErrorCarga(true));
  }, [sb, uid, anio]);
  useEffect(leer, [leer]);

  const sincronizar = useCallback(async () => {
    if (enCurso.current || !actualRef.current) return;
    const objetivo = actualRef.current;
    if (objetivo === guardadoRef.current) { setEstado("guardado"); return; }
    enCurso.current = true; setEstado("guardando");
    try {
      await guardar(sb, uid, anio, guardadoRef.current, objetivo);
      guardadoRef.current = objetivo;
      enCurso.current = false;
      if (actualRef.current !== objetivo) void sincronizar(); else setEstado("guardado");
    } catch {
      enCurso.current = false;
      setEstado("error");
    }
  }, [sb, uid, anio]);

  const cambiar = useCallback((s: DemoState) => {
    actualRef.current = s; setState(s); setEstado("guardando");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void sincronizar(), 500);
  }, [sincronizar]);

  // Do not lose a change that is still on its way to the server.
  useEffect(() => {
    const avisar = (e: BeforeUnloadEvent) => { if (actualRef.current !== guardadoRef.current) e.preventDefault(); };
    addEventListener("beforeunload", avisar);
    return () => { removeEventListener("beforeunload", avisar); clearTimeout(timer.current); };
  }, []);

  if (errorCarga) return <Pantalla><section className="card"><h2>No hemos podido cargar tus datos</h2><p className="muted">Revisa tu conexión y vuelve a intentarlo.</p><button className="btn" onClick={leer}>Reintentar</button></section></Pantalla>;
  if (state === undefined) return <Pantalla><p className="cu-cargando" role="status">Cargando tus datos…</p></Pantalla>;
  if (state === null) return <Alta onListo={async (s, deDemo) => {
    await guardar(sb, uid, anio, null, s);
    guardadoRef.current = s; actualRef.current = s; setState(s);
    track("cuenta_alta", { desde_demo: deDemo });
    if (deDemo) { try { localStorage.removeItem(DEMO_KEY); } catch { /* ignore */ } }
  }} />;

  return <App sb={sb} session={session} state={state} setState={cambiar} estado={estado} reintentar={() => void sincronizar()} />;
}

function Alta({ onListo }: { onListo: (s: DemoState, deDemo: boolean) => Promise<void> }) {
  const demo = useRef(datosDeDemo()).current;
  const tabla = tablaDe(anioActual());
  const [traspasar, setTraspasar] = useState(!!demo);
  const [tramo, setTramo] = useState<number | "">(demo?.tramoActual ?? "");
  const [regimen, setRegimen] = useState<DemoState["regimen"]>(demo?.regimen ?? "persona-fisica");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  async function empezar(e: FormEvent) {
    e.preventDefault();
    if (tramo === "") return;
    setEnviando(true); setError("");
    const base: DemoState = traspasar && demo ? demo : { meses: [], tramoActual: tramo, regimen, avisos: EJEMPLO.avisos };
    try { await onListo({ ...base, tramoActual: tramo, regimen }, traspasar && !!demo); }
    catch { setError("No hemos podido guardar tus ajustes. Revisa tu conexión e inténtalo de nuevo."); setEnviando(false); }
  }

  return (
    <Pantalla titulo="Prepara tu cuenta">
      <form className="card cu-form" onSubmit={empezar}>
        <h2>Dos datos para empezar</h2>
        <div className="fld"><label htmlFor="alta-tramo">Tramo que pagas ahora</label>
          <select id="alta-tramo" required value={tramo} onChange={(e) => setTramo(e.target.value ? Number(e.target.value) : "")}>
            <option value="">Elige tu tramo</option>
            {tabla.tramos.map((t) => <option key={t.n} value={t.n}>Tramo {t.n} · ≈ {fmt(Math.round(cuotaMinima(t.n, tabla)))} €/mes</option>)}
          </select>
          <small className="muted">Lo ves en tu recibo de autónomo o en Import@ss. Si no lo sabes, elige el que se acerque a lo que pagas al mes.</small></div>
        <div className="fld"><label htmlFor="alta-reg">Tipo de autónomo</label>
          <select id="alta-reg" value={regimen} onChange={(e) => setRegimen(e.target.value as DemoState["regimen"])}>
            <option value="persona-fisica">Persona física (deducción 7 %)</option><option value="societario">Societario (deducción 3 %)</option></select></div>
        {demo && <label className="cu-consent"><input type="checkbox" checked={traspasar} onChange={(e) => setTraspasar(e.target.checked)} />
          <span>Usar los {demo.meses.length} meses que metiste en la demo en este navegador (después se borran del navegador).</span></label>}
        <button className="btn" type="submit" disabled={enviando || tramo === ""}>{enviando ? "Guardando…" : "Empezar"}</button>
        {error && <p role="alert" className="cu-error">{error}</p>}
      </form>
    </Pantalla>
  );
}

function App({ sb, session, state, setState, estado, reintentar }: { sb: SupabaseClient; session: Session; state: DemoState; setState: (s: DemoState) => void; estado: Estado; reintentar: () => void }) {
  const [sheet, setSheet] = useState<Sheet>(null);
  const [confirmar, setConfirmar] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const email = session.user.email ?? "";

  async function descargar() {
    setError("");
    try {
      const datos = await exportar(sb, session.user.id, email);
      const url = URL.createObjectURL(new Blob([JSON.stringify(datos, null, 2)], { type: "application/json" }));
      const a = Object.assign(document.createElement("a"), { href: url, download: `cuotio-mis-datos-${new Date().toISOString().slice(0, 10)}.json` });
      a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      track("cuenta_exportar");
    } catch { setError("No hemos podido preparar tus datos. Inténtalo de nuevo."); }
  }

  async function salir() {
    track("cuenta_salir");
    await sb.auth.signOut({ scope: "local" });
  }

  async function borrar() {
    setOcupado(true); setError("");
    try {
      const res = await fetch(`${API}/api/borrar-cuenta`, { method: "POST", headers: { authorization: `Bearer ${session.access_token}` } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No hemos podido borrar la cuenta.");
      track("cuenta_borrada");
      await sb.auth.signOut({ scope: "local" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No hemos podido borrar la cuenta."); setOcupado(false);
    }
  }

  const ajustes = (
    <div className="cu-ajustes">
      <div className="cu-email"><small>Tu cuenta</small><b>{email}</b></div>
      <button className="btn btn--soft" onClick={descargar}>Descargar mis datos</button>
      <button className="btn btn--ghost" onClick={salir}>Cerrar sesión</button>
      {!confirmar && <button className="btn btn--ghost cu-peligro" onClick={() => setConfirmar(true)}>Borrar mi cuenta</button>}
      {confirmar && <div className="cu-confirmar" role="alertdialog" aria-label="Borrar mi cuenta">
        <p>Se borrarán tu cuenta, tus meses y tus ajustes. No se puede deshacer.</p>
        <button className="btn cu-peligro-lleno" disabled={ocupado} onClick={borrar}>{ocupado ? "Borrando…" : "Sí, borrar todo"}</button>
        <button className="btn btn--ghost" disabled={ocupado} onClick={() => setConfirmar(false)}>Cancelar</button>
      </div>}
      {error && <p role="alert" className="cu-error">{error}</p>}
    </div>
  );

  return (
    <div className="cu">
      <CuotioApp modo="cuenta" state={state} setState={setState} sheet={sheet} setSheet={setSheet} ajustesExtra={ajustes}
        notaDatos="Tus datos se guardan en tu cuenta, en servidores de la Unión Europea." />
      {estado !== "guardado" && <div className={`cu-estado ${estado === "error" ? "cu-estado--error" : ""}`} role="status">
        {estado === "guardando" ? "Guardando…" : <>No se ha podido guardar <button className="linkbtn" onClick={reintentar}>Reintentar</button></>}
      </div>}
      {sheet === "install" && <InstallSheet onClose={() => setSheet(null)} />}
    </div>
  );
}
