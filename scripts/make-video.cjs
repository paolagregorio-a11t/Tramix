// Records a vertical (1080x1920) promo video of the real demo app, driven by a script.
// 1) VITE_PREVIEW=1 npm run build:spa   2) npx http-server dist -p 4300 -s   3) node scripts/make-video.cjs
// Frames come from the browser's screencast (sharp text), assembled with ffmpeg into H.264 MP4.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright");
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const BASE = process.env.BASE || "http://localhost:4300";
const OUT = path.join(__dirname, "..", "marketing", "video");
const TMP = process.env.TMPDIR_FRAMES || path.join(require("os").tmpdir(), "cuotio-frames");
const MARK = (s) => `<svg width="${s}" height="${s}" viewBox="0 0 64 64"><rect x="6" y="36" width="14" height="20" rx="4" fill="#8fa6d8"/><rect x="25" y="22" width="14" height="34" rx="4" fill="#fff"/><rect x="44" y="8" width="14" height="48" rx="4" fill="#e9b44c"/></svg>`;

const STUDIO = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@700;800&family=Plus+Jakarta+Sans:wght@600;700&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0}html,body{width:1080px;height:1920px;overflow:hidden}
body{background:radial-gradient(110% 70% at 15% 0%,#1d3160 0%,#0b1220 62%);font-family:'Plus Jakarta Sans',sans-serif;color:#fff;position:relative}
.top{position:absolute;top:70px;left:80px;right:80px;display:flex;align-items:center;gap:16px;font:800 44px Manrope;letter-spacing:-1.5px}
.cap{position:absolute;top:170px;left:80px;right:80px;height:250px;display:flex;align-items:center}
.cap h1{font:800 82px/1.04 Manrope;letter-spacing:-3.5px;transition:opacity .35s,transform .35s}.cap h1.out{opacity:0;transform:translateY(24px)}
.cap em{font-style:normal;color:#e9b44c}
.phone{position:absolute;left:50%;top:450px;transform:translateX(-50%);width:774px;height:1366px;border-radius:84px;padding:17px;background:linear-gradient(145deg,#1a2338,#05080f);box-shadow:0 60px 120px -30px rgba(0,0,0,.8),inset 0 0 0 3px rgba(255,255,255,.16)}
.screen{width:740px;height:1332px;border-radius:68px;overflow:hidden;background:#f1f4f9;position:relative}
iframe{border:0;width:400px;height:720px;transform:scale(1.85);transform-origin:0 0;position:absolute;top:0;left:0}
.bar{position:absolute;bottom:60px;left:80px;right:80px;height:8px;border-radius:8px;background:rgba(255,255,255,.15)}.bar i{display:block;height:100%;width:0;border-radius:8px;background:#e9b44c;transition:width .4s}
.card{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;padding:0 90px;gap:40px;background:radial-gradient(110% 70% at 15% 0%,#1d3160 0%,#0b1220 62%);transition:opacity .6s;z-index:5}
.card.hide{opacity:0;pointer-events:none}.card h2{font:800 112px/1.02 Manrope;letter-spacing:-5px}.card h2 em{font-style:normal;color:#e9b44c}
.card p{font-size:46px;line-height:1.4;opacity:.85}.card .pill{align-self:flex-start;padding:22px 40px;border-radius:999px;background:#e9b44c;color:#1a1405;font:800 52px Manrope;letter-spacing:-1px}
.card .logo{display:flex;align-items:center;gap:22px;font:800 64px Manrope;letter-spacing:-2.5px}</style></head><body>
<div class="top">${MARK(56)}cuotio</div><div class="cap"><h1 id="cap"></h1></div>
<div class="phone"><div class="screen"><iframe id="app" src="${BASE}/#demo"></iframe></div></div><div class="bar"><i id="bar"></i></div>
<div class="card" id="intro"><div class="logo">${MARK(110)}cuotio</div><h2>Tu cuota de autónomo, <em>sin sorpresas.</em></h2><p>Sigue tus ingresos, proyecta tu tramo y te avisa antes de cada plazo.</p></div>
<div class="card hide" id="outro"><div class="logo">${MARK(110)}cuotio</div><h2>Pruébalo <em>gratis.</em></h2><p>Demo sin registro, con datos de ejemplo.</p><span class="pill">cuotio.es/demo</span></div>
<script>window.cap=(t)=>{const h=document.getElementById('cap');h.classList.add('out');setTimeout(()=>{h.innerHTML=t;h.classList.remove('out')},350)};
window.bar=(p)=>document.getElementById('bar').style.width=(p*100)+'%';window.show=(id,v)=>document.getElementById(id).classList.toggle('hide',!v);</script></body></html>`;

const TAP = `(() => { const s = document.createElement('style'); s.textContent = '.tapdot{position:fixed;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;background:rgba(233,180,76,.55);box-shadow:0 0 0 3px rgba(233,180,76,.9);pointer-events:none;z-index:99999;animation:tap .6s ease-out forwards}@keyframes tap{from{transform:scale(.4);opacity:1}to{transform:scale(1.4);opacity:0}}'; document.head.appendChild(s);
  addEventListener('pointerdown', (e) => { const d = document.createElement('div'); d.className = 'tapdot'; d.style.left = e.clientX + 'px'; d.style.top = e.clientY + 'px'; document.body.appendChild(d); setTimeout(() => d.remove(), 700); }, true); })()`;

(async () => {
  fs.rmSync(TMP, { recursive: true, force: true }); fs.mkdirSync(TMP, { recursive: true }); fs.mkdirSync(OUT, { recursive: true });
  const studioFile = path.join(TMP, "studio.html"); fs.writeFileSync(studioFile, STUDIO);
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium", args: ["--allow-file-access-from-files"] });
  const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1" });
  const page = await ctx.newPage();
  // Serve the studio from the same origin as the app so the script can drive the iframe.
  await page.route(`${BASE}/__studio`, (r) => r.fulfill({ contentType: "text/html", body: STUDIO }));
  await page.goto(`${BASE}/__studio`); await page.evaluate(() => document.fonts.ready);
  const app = page.frame({ url: /#demo/ }) || page.frames()[1];
  await app.waitForSelector(".tabs"); await app.evaluate(TAP);
  const W = (ms) => page.waitForTimeout(ms);
  const tap = async (sel, opt = {}) => { await app.locator(sel).first().click(opt); };
  const cap = (t) => page.evaluate((x) => window.cap(x), t);
  const bar = (p) => page.evaluate((x) => window.bar(x), p);
  const slide = async (sel, from, to, ms) => { const n = 24; for (let i = 0; i <= n; i++) { await app.evaluate(([s, v]) => { const el = document.querySelector(s); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, String(v)); el.dispatchEvent(new Event("input", { bubbles: true })); }, [sel, Math.round(from + ((to - from) * i) / n)]); await W(ms / n); } };
  const scrollBody = (y) => app.evaluate((v) => document.querySelector(".app__body").scrollTo({ top: v, behavior: "smooth" }), y);

  // screencast
  const cdp = await ctx.newCDPSession(page); const frames = [];
  cdp.on("Page.screencastFrame", async (f) => { const file = path.join(TMP, `f${String(frames.length).padStart(5, "0")}.jpg`); fs.writeFileSync(file, Buffer.from(f.data, "base64")); frames.push({ file, t: f.metadata.timestamp }); cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {}); });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: 1080, maxHeight: 1920, everyNthFrame: 1 });

  const S = 10; let k = 0; const next = () => bar(++k / S);
  await W(2600); await page.evaluate(() => window.show("intro", false)); await W(500);
  await cap("¿En qué tramo vas a <em>cerrar el año</em>?"); next(); await W(2600);
  await cap("Toca cada mes y mira <em>tu evolución</em>"); next(); await scrollBody(560); await W(900);
  const svg = app.locator(".yc svg"); const bb = await svg.boundingBox();
  for (let i = 0; i <= 11; i++) { await svg.hover({ position: { x: (bb.width / 1.85) * (0.04 + i * 0.083), y: (bb.height / 1.85) * 0.5 } }); await W(170); }
  await cap("¿Y si ganas más? <em>Simúlalo</em> al instante"); next(); await scrollBody(2000); await W(900);
  const v0 = Number(await app.locator("#sim").inputValue()); await slide("#sim", v0, 5200, 1800); await W(900);
  await cap("Te decimos <em>qué hacer</em> antes del plazo"); next(); await slide("#sim", 5200, v0, 500); await scrollBody(0); await W(700);
  await tap(".next__go"); await W(2600); await tap(".sheet .iconbtn"); await W(500);
  await cap("Sube el <em>extracto</em> de tu banco"); next(); await tap(".tabs button:nth-child(2)"); await W(700); await tap(".imp__go"); await W(700);
  await tap("text=Probar con un extracto de ejemplo"); await W(1600); await tap(".sheet__p .btn"); await W(1300);
  await cap("…o una factura: <em>la IA la lee</em> por ti"); next(); await tap(".sheet .seg button:nth-child(2)"); await W(600);
  await tap(".imp__consent input"); await W(400); await tap("text=Factura de ejemplo (ingreso)"); await W(2400); await tap(".sheet__p .btn"); await W(1200); await tap(".sheet .iconbtn"); await W(400);
  await cap("Tu proyección se <em>actualiza sola</em>"); next(); await tap(".tabs button:nth-child(1)"); await W(2600);
  await cap("Pregunta <em>lo que quieras</em>"); next(); await tap(".tabs button:nth-child(3)"); await W(700); await tap(".chat__chips button:nth-child(2)"); await W(4200);
  await cap("Avisos antes de <em>cada fecha</em>"); next(); await tap(".tabs button:nth-child(4)"); await W(900); await tap(".wins li.next .sw"); await W(600); await tap(".wins li.next .sw"); await W(1200);
  await cap("Instálala en tu <em>móvil</em>"); next(); await tap(".pillbtn"); await W(2600);
  await page.evaluate(() => window.show("outro", true)); await W(3200);

  await cdp.send("Page.stopScreencast"); await b.close();
  // Assemble: each frame lasts until the next one (screencast only sends frames when something changes).
  const list = frames.map((f, i) => `file '${f.file}'\nduration ${Math.max(0.001, ((frames[i + 1]?.t ?? f.t + 1) - f.t)).toFixed(4)}`).join("\n") + `\nfile '${frames[frames.length - 1].file}'\n`;
  fs.writeFileSync(path.join(TMP, "list.txt"), list);
  const out = path.join(OUT, "cuotio-demo-vertical.mp4");
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", path.join(TMP, "list.txt"), "-vf", "scale=1080:1920:flags=lanczos,fps=30,format=yuv420p", "-c:v", "libx264", "-preset", "slow", "-crf", "19", "-movflags", "+faststart", out]);
  console.log(`${frames.length} frames -> ${out}`);
})();
