import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

/**
 * SEO files that need the public URL: canonical/og:url, absolute URLs in the JSON-LD,
 * sitemap.xml and the Sitemap line in robots.txt. Set SITE_URL at build time (Vercel env var).
 */
function seo(site: string): Plugin {
  const url = site.replace(/\/$/, "");
  return {
    name: "tramix-seo",
    transformIndexHtml(html) {
      const out = html.replaceAll("%SITE_URL%", url);
      if (!url) return out;
      return out.replace("</head>", `  <link rel="canonical" href="${url}/" />\n    <meta property="og:url" content="${url}/" />\n    <meta property="og:image" content="${url}/og-image.png" />\n  </head>`)
        .replace('<meta property="og:image" content="/og-image.png" />', "");
    },
    generateBundle() {
      if (!url) { this.warn("SITE_URL is not set: sitemap.xml and canonical URL are skipped"); return; }
      // Hash routes (#demo, #privacidad...) are not separate URLs for search engines, so the sitemap lists the home page.
      const today = new Date().toISOString().slice(0, 10);
      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${url}/</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>\n</urlset>\n` });
      this.emitFile({ type: "asset", fileName: "robots.txt", source: `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${url}/sitemap.xml\n` });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const site = env.SITE_URL || env.VITE_SITE_URL || (env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : "");
  return { plugins: [react(), seo(site)] };
});
