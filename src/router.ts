import { useEffect, useState } from "react";

/**
 * Real URLs (/demo, /cuota-autonomo/2000-euros-mes...) so search engines index every page.
 * In sandboxed previews (a single HTML file) paths are encoded in the hash as a plain token:
 * "/cuota-autonomo/2000-euros-mes" <-> "#cuota-autonomo~2000-euros-mes".
 */
export const PREVIEW = import.meta.env.VITE_PREVIEW === "1";
const LEGACY = ["demo", "privacidad", "aviso-legal", "cookies"];

export function href(path: string): string {
  if (!PREVIEW) return path;
  const [p, frag] = path.split("#");
  if (p === "/" || p === "") return frag ? `#${frag}` : "#";
  return `#${p.slice(1).replace(/\//g, "~")}`;
}

function readPath(): string {
  if (typeof window === "undefined") return "/";
  if (PREVIEW) {
    const h = location.hash.slice(1);
    return h && /^[a-z0-9-]+(~[a-z0-9-]+)*$/.test(h) ? "/" + h.replace(/~/g, "/") : "/";
  }
  return location.pathname.replace(/\/+$/, "") || "/";
}

export function usePath(initial?: string): string {
  const [path, setPath] = useState(() => initial ?? readPath());
  useEffect(() => {
    // Old links like cuotio.es/#demo keep working.
    const h = location.hash.slice(1);
    if (!PREVIEW && location.pathname === "/" && LEGACY.includes(h)) { location.replace("/" + h); return; }
    setPath(readPath());
    const on = PREVIEW
      ? () => { setPath(readPath()); scrollTo(0, 0); }
      : () => { const k = location.hash.slice(1); if (LEGACY.includes(k)) location.assign("/" + k); };
    addEventListener("hashchange", on);
    return () => removeEventListener("hashchange", on);
  }, []);
  return path;
}
