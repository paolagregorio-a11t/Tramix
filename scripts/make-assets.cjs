// Renders brand PNGs (email logo, PWA/app icons) from SVG. Run: node scripts/make-assets.cjs
// Needs Playwright with a Chromium available (set CHROMIUM_PATH if not at the default).
const { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright");
const fs = require("fs"), path = require("path");
const out = (p) => path.join(__dirname, "..", "public", p);

const mark = (s = "#8fa6d8", m = "#fff") =>
  `<rect x="6" y="36" width="14" height="20" rx="4" fill="${s}"/><rect x="25" y="22" width="14" height="34" rx="4" fill="${m}"/><rect x="44" y="8" width="14" height="48" rx="4" fill="#e9b44c"/>`;

const jobs = [
  // Email header logo: light wordmark for the navy header (rendered at 2x, shown at ~140px wide)
  { file: "email/logo.png", w: 560, h: 136, transparent: true,
    html: `<div style="display:flex;align-items:center;gap:22px;height:136px;font:800 96px Manrope,system-ui;color:#fff;letter-spacing:-5px"><svg width="104" height="104" viewBox="0 0 64 64">${mark()}</svg>tramix</div>` },
  // App icons: navy tile with the steps
  ...[[512, "icons/icon-512.png"], [192, "icons/icon-192.png"], [180, "icons/apple-touch-icon.png"]].map(([n, f]) => ({
    file: f, w: n, h: n,
    html: `<svg width="${n}" height="${n}" viewBox="0 0 64 64"><rect width="64" height="64" fill="#0b1220"/>${mark()}</svg>` })),
  // Maskable: content kept inside the central safe zone
  { file: "icons/maskable-512.png", w: 512, h: 512,
    html: `<svg width="512" height="512" viewBox="0 0 64 64"><rect width="64" height="64" fill="#0b1220"/><g transform="translate(12.8 12.8) scale(.6)">${mark()}</g></svg>` },
  // Social share image
  { file: "og-image.png", w: 1200, h: 630,
    html: `<div style="width:1200px;height:630px;background:radial-gradient(120% 120% at 15% 0%,#1d3160,#0b1220 60%);color:#fff;font-family:Manrope,system-ui;display:flex;flex-direction:column;justify-content:center;padding:0 90px;box-sizing:border-box;gap:30px"><div style="display:flex;align-items:center;gap:20px;font:800 56px Manrope;letter-spacing:-3px"><svg width="64" height="64" viewBox="0 0 64 64">${mark()}</svg>tramix</div><div style="font:800 96px/1 Manrope;letter-spacing:-4px">Elige tu tramo<br><span style="color:#e9b44c">a tiempo.</span></div><div style="font:500 30px Manrope;color:#9fb0cf;max-width:800px">Seguimiento, proyección y avisos antes de cada plazo de cambio de base.</div></div>` },
];

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium" });
  for (const j of jobs) {
    const p = await b.newPage({ viewport: { width: j.w, height: j.h }, deviceScaleFactor: 1 });
    await p.setContent(`<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;800&display=swap" rel="stylesheet"><body style="margin:0;background:${j.transparent ? "transparent" : "#fff"}">${j.html}</body>`);
    await p.evaluate(() => document.fonts.ready);
    fs.mkdirSync(path.dirname(out(j.file)), { recursive: true });
    await p.screenshot({ path: out(j.file), omitBackground: !!j.transparent });
    await p.close();
  }
  await b.close();
})();
