// Brand images for social media -> marketing/social/. Run: node scripts/make-social.cjs
// All figures come from the 2026 table (Orden PJC/297/2026, BOE) used by the app.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright");
const path = require("path"), fs = require("fs");
const OUT = path.join(__dirname, "..", "marketing", "social");
const RATE = 0.315;
const HASTA = [670, 900, 1166.7, 1300, 1500, 1700, 1850, 2030, 2330, 2760, 3190, 3620, 4050, 6000, Infinity];
const BMIN = [653.59, 718.95, 849.67, 950.98, 960.78, 960.78, 1143.79, 1209.15, 1274.51, 1356.21, 1437.91, 1519.61, 1601.31, 1732.03, 1928.1];
const g = (s) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const e2 = (n) => { const [i, d] = n.toFixed(2).split("."); return `${g(i)},${d}&nbsp;€`; };
const e0 = (n) => `${g(String(Math.round(n)))}&nbsp;€`;
const cuota = (t) => Math.round(BMIN[t - 1] * RATE * 100) / 100;

const MARK = (s = 64, a = "#8fa6d8", b = "#fff") => `<svg width="${s}" height="${s}" viewBox="0 0 64 64"><rect x="6" y="36" width="14" height="20" rx="4" fill="${a}"/><rect x="25" y="22" width="14" height="34" rx="4" fill="${b}"/><rect x="44" y="8" width="14" height="48" rx="4" fill="#e9b44c"/></svg>`;
const CSS = `*{box-sizing:border-box;margin:0}body{font-family:'Plus Jakarta Sans',system-ui,sans-serif}
.s{position:relative;width:1080px;height:1350px;padding:84px 84px 96px;display:flex;flex-direction:column;overflow:hidden}
.dark{background:radial-gradient(120% 90% at 10% 0%,#1d3160 0%,#0b1220 62%);color:#fff}.light{background:#f5f7fa;color:#0b1220}
.top{display:flex;align-items:center;justify-content:space-between;font-family:Manrope;font-weight:800;font-size:38px;letter-spacing:-1.5px}
.top .b{display:flex;align-items:center;gap:14px}.pg{font-family:'Plus Jakarta Sans';font-size:26px;font-weight:700;opacity:.55;letter-spacing:0}
h1{font-family:Manrope;font-weight:800;font-size:104px;line-height:1.02;letter-spacing:-4.5px;margin-top:auto}
h2{font-family:Manrope;font-weight:800;font-size:76px;line-height:1.05;letter-spacing:-3px}
em{font-style:normal;color:#e9b44c}.light em{color:#2e4c86}
p{font-size:38px;line-height:1.45;margin-top:34px;opacity:.85}
.foot{display:flex;justify-content:space-between;align-items:center;margin-top:auto;padding-top:40px;font-weight:700;font-size:28px;opacity:.7}
.card{margin-top:48px;padding:40px 44px;border-radius:36px;background:rgba(255,255,255,.07);box-shadow:inset 0 0 0 2px rgba(255,255,255,.12)}
.light .card{background:#fff;box-shadow:0 2px 0 #e1e6ee}
.big{font-family:Manrope;font-weight:800;font-size:92px;letter-spacing:-3px;color:#e9b44c;line-height:1}
.row{display:flex;justify-content:space-between;align-items:baseline;padding:16px 0;border-bottom:2px solid rgba(255,255,255,.1);font-size:34px}
.light .row{border-color:#e1e6ee}.row b{font-family:Manrope;font-weight:800}
.tbl{margin-top:26px;font-variant-numeric:tabular-nums}.tbl .row{padding:7px 0;font-size:27px}
.pill{display:inline-block;padding:12px 26px;border-radius:999px;background:#e9b44c;color:#1a1405;font-weight:800;font-size:30px;margin-top:40px}
.ladder{display:flex;align-items:flex-end;gap:14px;height:300px;margin-top:56px}.ladder i{flex:1;border-radius:14px 14px 0 0;background:rgba(255,255,255,.14)}
.ladder i.on{background:linear-gradient(180deg,#f3c765,#e9b44c)}.ladder i.now{background:#fff}
.src{font-size:24px;opacity:.6;margin-top:26px}`;
const page = (body, cls = "dark", n = "", w = 1080, h = 1350) => `<html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Manrope:wght@700;800&family=Plus+Jakarta+Sans:wght@500;700;800&display=swap" rel="stylesheet"><style>${CSS}</style></head><body style="width:${w}px;height:${h}px">${body}</body></html>`;
const slide = (inner, { cls = "dark", n = "", foot = "cuotio.es" } = {}) => page(`<div class="s ${cls}"><div class="top"><span class="b">${MARK(48, "#8fa6d8", cls === "dark" ? "#fff" : "#2e4c86")}cuotio</span><span class="pg">${n}</span></div>${inner}<div class="foot"><span>${foot}</span><span>${n && n.split("/")[0] !== n.split("/")[1] ? "Desliza →" : ""}</span></div></div>`);
const ladder = (now, a, b) => `<div class="ladder">${Array.from({ length: 15 }, (_, i) => `<i class="${i + 1 >= a && i + 1 <= b ? "on" : ""} ${i + 1 === now ? "now" : ""}" style="height:${25 + i * 5.3}%"></i>`).join("")}</div>`;

const jobs = [];
const add = (file, html, w = 1080, h = 1350) => jobs.push({ file, html, w, h });

// Profile pictures and LinkedIn assets
add("perfil-instagram-1080.png", page(`<div style="width:1080px;height:1080px;display:grid;place-items:center;background:radial-gradient(100% 100% at 20% 0%,#1d3160,#0b1220 65%)">${MARK(640)}</div>`, "", "", 1080, 1080), 1080, 1080);
add("linkedin-logo-400.png", page(`<div style="width:400px;height:400px;display:grid;place-items:center;background:#0b1220">${MARK(250)}</div>`, "", "", 400, 400), 400, 400);
add("linkedin-banner-1128x191.png", page(`<div style="width:1128px;height:191px;display:flex;align-items:center;justify-content:flex-end;padding:0 64px;gap:28px;background:radial-gradient(120% 200% at 0% 0%,#1d3160,#0b1220 60%);color:#fff;font-family:Manrope"><div style="text-align:right"><div style="font-weight:800;font-size:40px;letter-spacing:-1.5px">Elige tu tramo <span style="color:#e9b44c">a tiempo.</span></div><div style="font-family:'Plus Jakarta Sans';font-size:20px;opacity:.75;margin-top:6px">Seguimiento, proyección y avisos para autónomos · cuotio.es</div></div>${MARK(96)}</div>`, "", "", 1128, 191), 1128, 191);

// 1. Presentación
add("01-presentacion.png", slide(`<h1>Tu cuota de autónomo, <em>sin sorpresas.</em></h1><p>Cuotio sigue tus ingresos, te dice entre qué tramos vas a cerrar el año y te avisa <b>antes</b> de cada plazo para cambiar.</p>${ladder(5, 8, 9)}`));

// 2. Regularización (carrusel)
add("02-regularizacion-1.png", slide(`<h1>¿Te va a llegar una <em>carta</em> de la Seguridad Social?</h1><p>Se llama regularización. Te contamos cómo funciona y cómo evitar el susto.</p>`, { n: "1/5" }));
add("02-regularizacion-2.png", slide(`<h2 style="margin-top:auto">Durante el año cotizas por una <em>previsión</em>.</h2><p>Eliges tu tramo según lo que crees que vas a ganar. Después, Hacienda le dice a la Seguridad Social lo que ganaste <b>de verdad</b>.</p><p>Y entonces comparan.</p>`, { n: "2/5" }));
add("02-regularizacion-3.png", slide(`<h2 style="margin-top:auto">Si cotizaste <em>por debajo</em>, te reclaman la diferencia.</h2><div class="card"><div class="row"><span>Pagas el tramo 5</span><b>${e2(960.78)} de base</b></div><div class="row"><span>Ganas de media</span><b>${e0(2100)} al mes</b></div><div class="row" style="border:0"><span>Te correspondía</span><b>tramo 9</b></div><div style="margin-top:22px;font-size:30px;opacity:.8">Te reclamarían unos</div><div class="big">${e2(1185.9)}</div></div>`, { n: "3/5" }));
add("02-regularizacion-4.png", slide(`<h2 style="margin-top:auto">Si cotizaste <em>por encima</em> del máximo de tu tramo, te devuelven.</h2><p>Y si tu base estaba dentro de los límites de tu tramo real, no hay ajuste.</p><p>La clave es <b>ajustar a tiempo</b>: puedes cambiar de base hasta 6 veces al año.</p>`, { n: "4/5" }));
add("02-regularizacion-5.png", slide(`<h1>Calcula la tuya <em>gratis</em>.</h1><p>Dinos lo que ganas y el tramo que pagas: te decimos si te reclamarán o te devolverán, con el cálculo explicado.</p><span class="pill">cuotio.es/regularizacion-cuota-autonomos</span>`, { n: "5/5", foot: "Cálculo orientativo con la tabla oficial del BOE" }));

// 3. Tramos 2026 (carrusel)
add("03-tramos-1.png", slide(`<h1>¿Cuánto pagas de cuota en <em>2026</em>?</h1><p>Los 15 tramos oficiales, de un vistazo. Guárdalo 📌</p>`, { n: "1/3" }));
add("03-tramos-2.png", slide(`<h2 style="font-size:64px">Cuota mínima por tramo · 2026</h2><div class="tbl">${HASTA.map((h, i) => `<div class="row"><span>Tramo ${i + 1} · ${i === 0 ? `hasta ${e0(h)}` : h === Infinity ? `más de ${e0(HASTA[i - 1])}` : `${e0(HASTA[i - 1])} – ${e0(h)}`}</span><b>${e2(cuota(i + 1))}</b></div>`).join("")}</div><div class="src">Rendimiento neto mensual · Fuente: Orden PJC/297/2026 (BOE)</div>`, { cls: "light", n: "2/3" }));
add("03-tramos-3.png", slide(`<h1>¿En qué tramo <em>estás tú</em>?</h1><p>Escribe lo que ganas y te lo decimos en 5 segundos: tramo, bases y cuota.</p><span class="pill">cuotio.es/cuota-autonomo</span>`, { n: "3/3" }));

// 4. Fechas para cambiar de base (carrusel)
const F = [["28 de febrero", "1 de marzo"], ["30 de abril", "1 de mayo"], ["30 de junio", "1 de julio"], ["31 de agosto", "1 de septiembre"], ["31 de octubre", "1 de noviembre"], ["31 de diciembre", "1 de enero"]];
add("04-fechas-1.png", slide(`<h1>Las <em>6 fechas</em> para cambiar de tramo.</h1><p>Si tus ingresos cambian, no esperes a la regularización: ajusta tu base a tiempo.</p>`, { n: "1/2" }));
add("04-fechas-2.png", slide(`<h2>Pídelo antes del…</h2><div class="card">${F.map(([a, b]) => `<div class="row"><b>${a}</b><span>efecto el ${b}</span></div>`).join("")}</div><p style="font-size:32px">Se pide en Import@ss. Cuotio te avisa antes de cada fecha con el tramo recomendado.</p>`, { n: "2/2", foot: "cuotio.es/cambio-base-cotizacion" }));

// 5. Rendimiento neto
add("05-rendimiento-neto.png", slide(`<h2 style="margin-top:auto">Facturo 2.500 € al mes. ¿Estoy en el <em>tramo 10</em>?</h2><div class="card"><div class="row"><span>Ingresos</span><b>${e0(2500)}</b></div><div class="row"><span>− Gastos del mes</span><b>${e0(400)}</b></div><div class="row"><span>− Deducción genérica (7 %)</span><b>${e0(147)}</b></div><div class="row" style="border:0"><span>Rendimiento neto</span><b>${e0(1953)}</b></div><div style="margin-top:20px;font-size:30px;opacity:.8">Tu tramo real</div><div class="big">Tramo 8</div><div style="font-size:30px;margin-top:10px;opacity:.85">desde ${e2(cuota(8))}/mes, no ${e2(cuota(10))}</div></div>`));

// 6. Ejemplo 2.000 €
add("06-gano-2000.png", slide(`<h2 style="margin-top:auto">Si ganas <em>2.000 €</em> al mes…</h2><div class="card"><div style="font-size:30px;opacity:.8">Estás en el</div><div class="big">Tramo 8</div><div class="row" style="margin-top:18px"><span>Cuota mínima</span><b>${e2(380.88)}</b></div><div class="row"><span>Cuota máxima</span><b>${e2(639.45)}</b></div><div class="row" style="border:0"><span>Al año (mínima)</span><b>${e0(380.88 * 12)}</b></div></div><p style="font-size:32px">Te faltan solo 30 € al mes para pasar al tramo 9.</p>`, { foot: "cuotio.es/cuota-autonomo/2000-euros-mes" }));

// 7. Beta / demo
add("07-prueba-la-demo.png", slide(`<span class="pill" style="margin-top:auto;align-self:flex-start">Beta abierta</span><h1 style="margin-top:28px">Sube tu extracto. <em>Mira tu año.</em></h1><p>Prueba la demo: arrastra el extracto del banco o una factura y Cuotio calcula tu tramo y te dice qué hacer antes del próximo plazo.</p>`, { foot: "cuotio.es/demo" }));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium" });
  for (const j of jobs) {
    const p = await b.newPage({ viewport: { width: j.w, height: j.h } });
    await p.setContent(j.html, { waitUntil: "networkidle" }); await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(OUT, j.file) }); await p.close();
  }
  await b.close(); console.log(`${jobs.length} imágenes en marketing/social/`);
})();
