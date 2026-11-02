import { renderToString } from "react-dom/server";
import App from "./App";
import { ROUTES } from "./routes";
import { schemaFor } from "./pages/schema";

/** Used at build time only (scripts/prerender.mjs): one static HTML file per route. */
export const routes = ROUTES;
export const render = (path: string) => renderToString(<App path={path} />);
export const schema = (path: string, site: string) => schemaFor(ROUTES.find((r) => r.path === path)!, site);
