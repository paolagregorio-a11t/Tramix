import { useEffect, useState } from "react";

export type Route = "home" | "demo" | "privacidad" | "aviso-legal" | "cookies";
const PAGES: Route[] = ["demo", "privacidad", "aviso-legal", "cookies"];

/** Hash routing: works on any static host, inside the native shell, and in sandboxed previews. */
export function useRoute(): Route {
  const read = (): Route => { const h = location.hash.replace("#", ""); return (PAGES as string[]).includes(h) ? (h as Route) : "home"; };
  const [r, setR] = useState<Route>(read);
  useEffect(() => {
    const on = () => { setR(read()); if (read() !== "home") scrollTo(0, 0); };
    addEventListener("hashchange", on);
    return () => removeEventListener("hashchange", on);
  }, []);
  return r;
}
