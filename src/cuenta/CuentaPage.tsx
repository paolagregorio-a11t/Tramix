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
import { surface, track } from "../analytics";
import { cargar, exportar, guardar } from "./datos";
import { cuentasActivas, proveedores, supabase } from "./supabase";
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
  const [nuevaPass, setNuevaPass] = useState(false);

  useEffect(() => {
    if (!cuentasActivas()) return;
    let off = () => {};
    supabase().then((c) => {
      setSb(c);
      c.auth.getSession().then(({ data }) => setSession(data.session));
      const { data } = c.auth.onAuthStateChange((evento, s) => {
        setSession(s);
        if (evento === "SIGNED_IN") {
          // Back from Google: count it once and remove ?code= from the address bar.
          if (location.search.includes("code=")) { track("cuenta_entrada_ok", { metodo: "google" }); history.replaceState(null, "", location.pathname); }
          try { setNuevaPass(sessionStorage.getItem("cuotio-nueva-pass") === "1"); } catch { /* ignore */ }
        }
      });
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
  if (nuevaPass) return <NuevaPassword sb={sb} onListo={() => { try { sessionStorage.removeItem("cuotio-nueva-pass"); } catch { /* ignore */ } setNuevaPass(false); }} />;
  return <MiCuenta key={session.user.id} sb={sb} session={session} />;
}

/* ---------- Sign in: Google in one tap, or email and password. A code by email only to recover the password. ---------- */

type Modo = "entrar" | "crear" | "olvido" | "codigo";
const MIN_PASS = 8;
const errorAcceso = (msg: string, status?: number) =>
  status === 429 ? "Demasiados intentos seguidos. Espera un minuto y vuelve a intentarlo."
    : /invalid login credentials/i.test(msg) ? "El email o la contraseña no son correctos."
      : /already registered|already exists/i.test(msg) ? "Ya hay una cuenta con este email. Entra con tu contraseña o con Google."
        : /email not confirmed/i.test(msg) ? "Tienes que confirmar tu email antes de entrar. Revisa tu correo."
          : /password/i.test(msg) ? `La contraseña debe tener al menos ${MIN_PASS} caracteres y no ser demasiado común.`
            : "No hemos podido completar la operación. Revisa los datos e inténtalo de nuevo.";

function GoogleLogo() {
  return (<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" /><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" /><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" /><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" /></svg>);
}

function Entrar({ sb }: { sb: SupabaseClient }) {
  const [modo, setModo] = useState<Modo>("entrar");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  // Google sign-in goes through the browser and comes back to cuotio.es/app, so it is not offered inside the native app.
  const [googleActivo, setGoogleActivo] = useState(false);
  useEffect(() => { if (surface() !== "nativa") proveedores().then((p) => setGoogleActivo(p.google)); }, []);
  const conGoogle = googleActivo;
  const limpio = () => email.trim().toLowerCase();
  const ir = (m: Modo) => { setModo(m); setError(""); setAviso(""); };

  async function google() {
    setError(""); track("cuenta_google");
    const { error } = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}/app` } });
    if (error) { track("cuenta_entrada_error", { paso: "google" }); setError("No hemos podido abrir Google. Inténtalo de nuevo o entra con tu email."); }
  }

  async function conPassword(e: FormEvent) {
    e.preventDefault();
    setEnviando(true); setError(""); setAviso("");
    if (modo === "crear") {
      const { data, error } = await sb.auth.signUp({ email: limpio(), password: pass, options: { emailRedirectTo: `${location.origin}/app` } });
      setEnviando(false);
      if (error) { track("cuenta_entrada_error", { paso: "registro" }); setError(errorAcceso(error.message, error.status)); return; }
      track("cuenta_registro");
      // Only when the project still asks to confirm the email (DEPLOY.md recommends not to): there is no session yet.
      if (!data.session) setAviso("Te hemos enviado un correo para confirmar tu email. Después podrás entrar con tu contraseña.");
      return;
    }
    const { error } = await sb.auth.signInWithPassword({ email: limpio(), password: pass });
    setEnviando(false);
    if (error) { track("cuenta_entrada_error", { paso: "password" }); setError(errorAcceso(error.message, error.status)); return; }
    track("cuenta_entrada_ok", { metodo: "password" });
  }

  async function pedirCodigo(e?: FormEvent) {
    e?.preventDefault();
    setEnviando(true); setError(""); setAviso("");
    const { error } = await sb.auth.signInWithOtp({ email: limpio(), options: { shouldCreateUser: false } });
    setEnviando(false);
    // Same answer whether or not the account exists, so nobody can use this form to find out who has an account.
    if (error && error.status === 429) { setError(errorAcceso(error.message, 429)); return; }
    track("cuenta_codigo_pedido");
    if (modo === "codigo") setAviso("Si hay una cuenta con este email, te hemos enviado un código nuevo.");
    setModo("codigo");
  }

  async function comprobar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const token = String(new FormData(e.currentTarget).get("codigo") ?? "").replace(/\D/g, "");
    setEnviando(true); setError(""); setAviso("");
    // Set before verifying: the sign-in event fires while verifyOtp is still running.
    const marca = (on: boolean) => { try { if (on) sessionStorage.setItem("cuotio-nueva-pass", "1"); else sessionStorage.removeItem("cuotio-nueva-pass"); } catch { /* ignore */ } };
    marca(true);
    const { error } = await sb.auth.verifyOtp({ email: limpio(), token, type: "email" });
    setEnviando(false);
    if (error) { marca(false); track("cuenta_entrada_error", { paso: "codigo" }); setError("El código no es correcto o ha caducado. Revísalo o pide uno nuevo."); return; }
    track("cuenta_entrada_ok", { metodo: "codigo" });
  }

  if (modo === "olvido" || modo === "codigo") return (
    <Pantalla titulo="Recuperar el acceso">
      {modo === "olvido" ? (
        <form className="card cu-form" onSubmit={pedirCodigo}>
          <h2>¿Has olvidado la contraseña?</h2>
          <p className="muted">Te mandamos un código al email para entrar y elegir una nueva.</p>
          <div className="fld"><label htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="email" required placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <button className="btn" type="submit" disabled={enviando}>{enviando ? "Enviando…" : "Enviarme el código"}</button>
          {error && <p role="alert" className="cu-error">{error}</p>}
          <button type="button" className="linkbtn" onClick={() => ir("entrar")}>Volver</button>
        </form>
      ) : (
        <form className="card cu-form" onSubmit={comprobar}>
          <h2>Revisa tu correo</h2>
          <p className="muted">Si hay una cuenta con <b>{email}</b>, te hemos enviado un código. Escríbelo aquí. Caduca en una hora.</p>
          <div className="fld"><label htmlFor="codigo">Código</label>
            <input id="codigo" name="codigo" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,12}" maxLength={12} required autoFocus className="cu-codigo" /></div>
          <button className="btn" type="submit" disabled={enviando}>{enviando ? "Comprobando…" : "Entrar"}</button>
          {error && <p role="alert" className="cu-error">{error}</p>}
          {aviso && <p role="status" className="muted small">{aviso}</p>}
          <p className="muted small">¿No te llega? Mira en spam o <button type="button" className="linkbtn" disabled={enviando} onClick={() => pedirCodigo()}>pide otro código</button>. <button type="button" className="linkbtn" onClick={() => ir("entrar")}>Volver</button></p>
        </form>
      )}
    </Pantalla>
  );

  const crear = modo === "crear";
  return (
    <Pantalla titulo={crear ? "Crear cuenta en Cuotio" : "Entrar en Cuotio"}>
      <div className="card cu-form">
        <h2>{crear ? "Crea tu cuenta" : "Entra en Cuotio"}</h2>
        {conGoogle && <>
          <button type="button" className="btn cu-google" onClick={google}><GoogleLogo /> Continuar con Google</button>
          <p className="cu-o"><span>o con tu email</span></p>
        </>}
        <form className="cu-form" onSubmit={conPassword}>
          <div className="fld"><label htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="email" required placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="fld"><label htmlFor="pass">Contraseña</label>
            <input id="pass" type="password" autoComplete={crear ? "new-password" : "current-password"} required minLength={crear ? MIN_PASS : undefined} value={pass} onChange={(e) => setPass(e.target.value)} />
            {crear && <small className="muted">Al menos {MIN_PASS} caracteres.</small>}</div>
          <button className="btn" type="submit" disabled={enviando}>{enviando ? (crear ? "Creando…" : "Entrando…") : crear ? "Crear cuenta" : "Entrar"}</button>
        </form>
        {error && <p role="alert" className="cu-error">{error}</p>}
        {aviso && <p role="status" className="cu-aviso">{aviso}</p>}
        {!crear && <button type="button" className="linkbtn" onClick={() => ir("olvido")}>He olvidado la contraseña</button>}
        <p className="muted small">Al {crear ? "crear la cuenta" : "continuar"} aceptas la <a href={href("/privacidad")}>política de privacidad</a>. Tus datos se guardan en servidores de la Unión Europea.</p>
      </div>
      <p className="muted small cu-pie">{crear ? <>¿Ya tienes cuenta? <button type="button" className="linkbtn" onClick={() => ir("entrar")}>Entra</button></> : <>¿Es tu primera vez? <button type="button" className="linkbtn" onClick={() => ir("crear")}>Crea tu cuenta</button></>}
        {" · "}<a href={href("/demo")}>Prueba la demo</a></p>
    </Pantalla>
  );
}

/** After entering with a recovery code: choose a new password, or skip it. */
function NuevaPassword({ sb, onListo }: { sb: SupabaseClient; onListo: () => void }) {
  const [pass, setPass] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  async function guardarPass(e: FormEvent) {
    e.preventDefault(); setEnviando(true); setError("");
    const { error } = await sb.auth.updateUser({ password: pass });
    setEnviando(false);
    if (error) { setError(errorAcceso(error.message, error.status)); return; }
    track("cuenta_password_cambiada"); onListo();
  }
  return (
    <Pantalla titulo="Nueva contraseña">
      <form className="card cu-form" onSubmit={guardarPass}>
        <h2>Elige una contraseña nueva</h2>
        <div className="fld"><label htmlFor="np">Contraseña nueva</label>
          <input id="np" type="password" autoComplete="new-password" required minLength={MIN_PASS} value={pass} onChange={(e) => setPass(e.target.value)} autoFocus />
          <small className="muted">Al menos {MIN_PASS} caracteres.</small></div>
        <button className="btn" type="submit" disabled={enviando}>{enviando ? "Guardando…" : "Guardar contraseña"}</button>
        {error && <p role="alert" className="cu-error">{error}</p>}
        <button type="button" className="linkbtn" onClick={onListo}>Ahora no</button>
      </form>
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
