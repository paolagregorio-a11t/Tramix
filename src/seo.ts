import { useEffect } from "react";
import type { RouteDef } from "./routes";

/** Keeps title/description in sync on client-side navigation (pages are also prerendered with them). */
export function useMeta(r: RouteDef) {
  useEffect(() => {
    document.title = r.title;
    const set = (sel: string, attr: string, v: string) => document.querySelector(sel)?.setAttribute(attr, v);
    set('meta[name="description"]', "content", r.description);
    set('meta[property="og:title"]', "content", r.title);
    set('meta[property="og:description"]', "content", r.description);
  }, [r]);
}
