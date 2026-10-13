import { useEffect, useState } from "react";

/** The browser fires `beforeinstallprompt` once, early; keep it at module level so any component can use it. */
type BIP = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
let deferred: BIP | null = null;
const listeners = new Set<() => void>();
if (typeof window !== "undefined") {
  addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e as BIP; listeners.forEach((l) => l()); });
  addEventListener("appinstalled", () => { deferred = null; listeners.forEach((l) => l()); });
}

export type Platform = "ios" | "android" | "desktop";
export function useInstall() {
  const [, tick] = useState(0);
  useEffect(() => { const l = () => tick((n) => n + 1); listeners.add(l); return () => { listeners.delete(l); }; }, []);
  const ua = typeof navigator === "undefined" ? "" : navigator.userAgent;
  const platform: Platform = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? "ios" : /Android/.test(ua) ? "android" : "desktop";
  const standalone = typeof matchMedia !== "undefined" && (matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true);
  return {
    platform, standalone, canPrompt: deferred !== null,
    async prompt() { if (!deferred) return false; await deferred.prompt(); const r = await deferred.userChoice; deferred = null; listeners.forEach((l) => l()); return r.outcome === "accepted"; },
  };
}
