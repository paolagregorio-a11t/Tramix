/**
 * Privacy-friendly usage analytics with Umami (umami.is): no cookies, nothing stored on the device,
 * no IPs or personal data kept. We only send anonymous events to see where testers get stuck:
 * joining the waitlist, calculating their tramo and going back from the demo to the website.
 *
 * Off until a website ID is set (here or with VITE_UMAMI_WEBSITE_ID). Never runs in local dev,
 * in sandboxed previews or for visitors with "Do Not Track" or who opted out on /cookies.
 * NEVER pass emails, amounts or free text as event data.
 */
type Data = Record<string, string | number | boolean>;
type Umami = { track: (event: string, data?: Data) => void };

/** Public ID from Umami Cloud > Settings > Websites. It is not a secret, so it can live here and reach the web and the apps alike. */
const DEFAULT_WEBSITE_ID = "a3de0e78-de0c-4598-bd28-28c30e6525af";
const WEBSITE_ID = (import.meta.env.VITE_UMAMI_WEBSITE_ID as string | undefined) || DEFAULT_WEBSITE_ID;
const SCRIPT = (import.meta.env.VITE_UMAMI_SRC as string | undefined) || "https://cloud.umami.is/script.js";
const OPT_OUT_KEY = "umami.disabled"; // the key Umami's own script checks

const queue: [string, Data | undefined][] = [];
let started = false;

function browser() { return typeof window !== "undefined" && typeof document !== "undefined"; }

/** The browser's "Do Not Track" setting. */
export function doNotTrack(): boolean {
  if (!browser()) return false;
  const dnt = (navigator as Navigator & { doNotTrack?: string }).doNotTrack ?? (window as unknown as { doNotTrack?: string }).doNotTrack;
  return dnt === "1" || dnt === "yes";
}

/** True when the visitor switched statistics off on /cookies or has "Do Not Track" on. */
export function optedOut(): boolean {
  if (!browser()) return true;
  try { if (localStorage.getItem(OPT_OUT_KEY)) return true; } catch { /* storage blocked */ }
  return doNotTrack();
}

export function setOptOut(off: boolean) {
  try { if (off) localStorage.setItem(OPT_OUT_KEY, "1"); else localStorage.removeItem(OPT_OUT_KEY); } catch { /* storage blocked */ }
}

export const analyticsEnabled = () =>
  browser() && !!WEBSITE_ID && import.meta.env.PROD && import.meta.env.VITE_PREVIEW !== "1" && !optedOut();

/** Where the visitor is using Cuotio: the website, the installed PWA or the native app (Capacitor). */
export function surface(): "web" | "pwa" | "nativa" {
  if (!browser()) return "web";
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  if (cap?.isNativePlatform?.()) return "nativa";
  const standalone = matchMedia?.("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
  return standalone ? "pwa" : "web";
}

function umami(): Umami | undefined { return (window as unknown as { umami?: Umami }).umami; }

function flush() {
  const u = umami(); if (!u) return;
  while (queue.length) { const [e, d] = queue.shift()!; try { u.track(e, d); } catch { /* never break the app */ } }
}

/** Loads the Umami script once. It also records page views on its own. Call at startup. */
export function initAnalytics() {
  if (started || !analyticsEnabled()) return;
  started = true;
  const s = document.createElement("script");
  s.defer = true;
  s.src = SCRIPT;
  s.dataset.websiteId = WEBSITE_ID;
  s.dataset.doNotTrack = "true";
  s.addEventListener("load", flush);
  document.head.appendChild(s);
}

/** Records an anonymous event. Safe to call anywhere: it does nothing when analytics is off. */
export function track(event: string, data?: Data) {
  if (!analyticsEnabled()) return;
  const d = { app: surface(), ...data };
  if (umami()) { try { umami()!.track(event, d); } catch { /* ignore */ } return; }
  if (queue.length < 50) queue.push([event, d]);
}

/** Same as track, but at most once per page load for a given key (e.g. "first use of the calculator"). */
const seen = new Set<string>();
export function trackOnce(key: string, event: string, data?: Data) {
  if (seen.has(key)) return;
  seen.add(key);
  track(event, data);
}

/** True when this page was opened from the demo ("Volver a la web"). Uses the referrer, so nothing is stored. */
export function fromDemo(): boolean {
  if (!browser() || !document.referrer) return false;
  try { const r = new URL(document.referrer); return r.origin === location.origin && /^\/demo\/?$/.test(r.pathname); } catch { return false; }
}
