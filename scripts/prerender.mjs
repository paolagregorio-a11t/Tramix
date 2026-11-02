// Writes dist/<route>/index.html for every route, with its own <title>, description, canonical, Open Graph,
// JSON-LD and the page content already in the HTML, so search engines index it without running JavaScript.
// Also writes sitemap.xml. Run after `vite build` and `vite build --ssr src/entry-server.tsx`.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const site = (process.env.SITE_URL || process.env.VITE_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://cuotio.es")).replace(/\/$/, "");
const { routes, render, schema } = await import(pathToFileURL(join(root, "dist-ssr", "entry-server.js")).href);
const template = readFileSync(join(dist, "index.html"), "utf8");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

let n = 0;
for (const r of routes) {
  const url = `${site}${r.path === "/" ? "/" : r.path}`;
  let html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(r.title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${esc(r.description)}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${esc(r.title)}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${esc(r.description)}" />`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, "")
    .replace(/<meta property="og:url" content="[^"]*"\s*\/?>/, "");
  const ld = schema(r.path, site).map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`).join("\n    ");
  html = html.replace("</head>", `  <link rel="canonical" href="${url}" />\n    <meta property="og:url" content="${url}" />\n    ${ld}\n  </head>`);
  html = html.replace('<div id="root"></div>', `<div id="root">${render(r.path)}</div>`);
  const out = r.path === "/" ? join(dist, "index.html") : join(dist, r.path.slice(1), "index.html");
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
  n++;
}

const today = new Date().toISOString().slice(0, 10);
writeFileSync(join(dist, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map((r) => `  <url><loc>${site}${r.path === "/" ? "/" : r.path}</loc><lastmod>${today}</lastmod><priority>${r.priority.toFixed(1)}</priority></url>`).join("\n")}\n</urlset>\n`);
writeFileSync(join(dist, "robots.txt"), `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${site}/sitemap.xml\n`);
rmSync(join(root, "dist-ssr"), { recursive: true, force: true });
console.log(`prerender: ${n} pages, sitemap.xml and robots.txt for ${site}`);
