// Records a promo video of the real demo app, driven by a script, with a gliding touch indicator,
// caption cross-fades and gentle camera moves. FORMAT=vertical (1080x1920) or FORMAT=square (1080x1080).
// 1) VITE_PREVIEW=1 npm run build:spa   2) npx http-server dist -p 4300 -s   3) [FORMAT=square] node scripts/make-video.cjs
const { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright");
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const BASE = process.env.BASE || "http://localhost:4300";
const OUT = path.join(__dirname, "..", "marketing", "video");
const TMP = process.env.TMPDIR_FRAMES || path.join(require("os").tmpdir(), "cuotio-frames");
const SQ = process.env.FORMAT === "square";
const VW = 1080, VH = SQ ? 1080 : 1920, SCALE = SQ ? 1.22 : 1.85;
const EASE = "cubic-bezier(.22,.8,.2,1)";
const MARK = (s) => `<svg width="${s}" height="${s}" viewBox="0 0 64 64"><rect x="6" y="36" width="14" height="20" rx="4" fill="#8fa6d8"/><rect x="25" y="22" width="14" height="34" rx="4" fill="#fff"/><rect x="44" y="8" width="14" height="48" rx="4" fill="#e9b44c"/></svg>`;

const L = SQ
  ? { top: "top:64px;left:70px", cap: "top:170px;left:70px;width:400px;height:640px;align-items:flex-start", h1: "58px", phone: "right:60px;top:87px", pw: 516, ph: 906, pad: 14, r: 62, bar: "left:70px;width:400px;bottom:70px", cardH: "88px", cardP: "38px" }
  : { top: "top:70px;left:80px", cap: "top:170px;left:80px;right:80px;height:250px;align-items:center", h1: "82px", phone: "left:153px;top:450px", pw: 774, ph: 1366, pad: 17, r: 84, bar: "left:80px;right:80px;bottom:60px", cardH: "112px", cardP: "46px" };
const SW = L.pw - L.pad * 2, SH = L.ph - L.pad * 2;

const STUDIO = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@700;800&family=Plus+Jakarta+Sans:wght@600;700&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0}html,body{width:${VW}px;height:${VH}px;overflow:hidden}
body{background:radial-gradient(110% 70% at 15% 0%,#1d3160 0%,#0b1220 62%);font-family:'Plus Jakarta Sans',sans-serif;color:#fff;position:relative}
.top{position:absolute;${L.top};display:flex;align-items:center;gap:16px;font:800 ${SQ ? 38 : 44}px Manrope;letter-spacing:-1.5px}
.cap{position:absolute;${L.cap};display:flex}
.cap h1{position:absolute;font:800 ${L.h1}/1.05 Manrope;letter-spacing:-.04em;transition:opacity .7s ${EASE},transform .7s ${EASE},filter .7s ${EASE};opacity:0;transform:translateY(28px);filter:blur(10px)}
.cap h1.in{opacity:1;transform:none;filter:none}.cap h1.gone{opacity:0;transform:translateY(-22px);filter:blur(10px)}
.cap em{font-style:normal;color:#e9b44c}
.stage{position:absolute;${L.phone};width:${L.pw}px;height:${L.ph}px;transition:transform 1.1s ${EASE},opacity 1.1s ${EASE};transform-origin:50% 40%}
.stage.pre{transform:translateY(${SQ ? 260 : 420}px) scale(.94);opacity:0}.stage.post{transform:scale(.9);opacity:0}
.phone{width:100%;height:100%;border-radius:${L.r}px;padding:${L.pad}px;background:linear-gradient(145deg,#1a2338,#05080f);box-shadow:0 60px 120px -30px rgba(0,0,0,.8),inset 0 0 0 3px rgba(255,255,255,.16);transition:transform 4.5s cubic-bezier(.4,0,.2,1)}
.screen{width:${SW}px;height:${SH}px;border-radius:${L.r - 16}px;overflow:hidden;background:#f1f4f9;position:relative}
iframe{border:0;width:400px;height:720px;transform:scale(${SCALE});transform-origin:0 0;position:absolute;top:0;left:0}
#touch{position:absolute;left:0;top:0;width:${SQ ? 38 : 50}px;height:${SQ ? 38 : 50}px;margin:${SQ ? -19 : -25}px 0 0 ${SQ ? -19 : -25}px;border-radius:50%;background:rgba(255,255,255,.38);
  box-shadow:0 0 0 2px rgba(255,255,255,.85),0 6px 18px rgba(11,18,32,.35);z-index:10;opacity:0;pointer-events:none;transition:transform .45s ${EASE},opacity .3s ease;will-change:transform}
#touch i{position:absolute;inset:-2px;border-radius:50%;box-shadow:0 0 0 2px rgba(255,255,255,.75);opacity:0}
#touch.press{transition:transform .14s ease,opacity .35s ease}#touch.ripple i{animation:rip .55s ease-out}
@keyframes rip{from{opacity:.9;transform:scale(1)}to{opacity:0;transform:scale(2.1)}}
.bar{position:absolute;${L.bar};height:6px;border-radius:6px;background:rgba(255,255,255,.14)}.bar i{display:block;height:100%;width:0;border-radius:6px;background:#e9b44c;transition:width .9s ${EASE}}
.card{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;padding:0 ${SQ ? 80 : 90}px;gap:${SQ ? 30 : 40}px;background:radial-gradient(110% 70% at 15% 0%,#1d3160 0%,#0b1220 62%);transition:opacity .9s ${EASE};z-index:20}
.card>*{transition:transform 1s ${EASE},opacity 1s ${EASE}}.card.hide{opacity:0;pointer-events:none}.card.hide>*{transform:translateY(-30px);opacity:0}
.card h2{font:800 ${L.cardH}/1.02 Manrope;letter-spacing:-.045em}.card h2 em{font-style:normal;color:#e9b44c}.card p{font-size:${L.cardP};line-height:1.4;opacity:.85}
.card .pill{align-self:flex-start;padding:${SQ ? "18px 34px" : "22px 40px"};border-radius:999px;background:#e9b44c;color:#1a1405;font:800 ${SQ ? 44 : 52}px Manrope;letter-spacing:-1px}
.card .logo{display:flex;align-items:center;gap:22px;font:800 ${SQ ? 56 : 64}px Manrope;letter-spacing:-2.5px}
.card.enter>*{transform:translateY(30px);opacity:0}
#tick{position:absolute;width:4px;height:4px;left:0;bottom:0;animation:tk .5s steps(30) infinite alternate}@keyframes tk{from{background:#0b1220}to{background:#0c1322}}
</style></head><body><div id="tick"></div>
<div class="top">${MARK(SQ ? 48 : 56)}cuotio</div><div class="cap" id="cap"></div>
<div class="stage pre" id="stage"><div class="phone" id="phone"><div class="screen"><iframe id="app" src="${BASE}/#demo"></iframe></div></div></div>
<div id="touch"><i></i></div><div class="bar"><i id="bar"></i></div>
<div class="card" id="intro"><div class="logo">${MARK(SQ ? 96 : 110)}cuotio</div><h2>Tu cuota de autónomo, <em>sin sorpresas.</em></h2><p>Sigue tus ingresos, proyecta tu tramo y te avisa antes de cada plazo.</p></div>
<div class="card hide" id="outro"><div class="logo">${MARK(SQ ? 96 : 110)}cuotio</div><h2>Pruébalo <em>gratis.</em></h2><p>Demo sin registro, con datos de ejemplo.</p><span class="pill">cuotio.es/demo</span></div>
<script>
let zoom=false;
window.cap=(t)=>{const c=document.getElementById('cap');c.querySelectorAll('h1.in').forEach(h=>{h.classList.remove('in');h.classList.add('gone');setTimeout(()=>h.remove(),800)});
  const h=document.createElement('h1');h.innerHTML=t;c.appendChild(h);requestAnimationFrame(()=>requestAnimationFrame(()=>h.classList.add('in')));
  zoom=!zoom;document.getElementById('phone').style.transform=zoom?'scale(1.025)':'scale(1)';};
window.bar=(p)=>document.getElementById('bar').style.width=(p*100)+'%';
window.card=(id,v)=>document.getElementById(id).classList.toggle('hide',!v);
window.stage=(c)=>{const s=document.getElementById('stage');s.classList.remove('pre','post');if(c)s.classList.add(c)};
const T=document.getElementById('touch');let tx=${VW / 2},ty=${VH};
window.touchTo=(x,y,show=true)=>{tx=x;ty=y;T.classList.remove('press');T.style.opacity=show?1:0;T.style.transform='translate('+x+'px,'+y+'px)'};
window.press=(down)=>{T.classList.add('press');T.style.transform='translate('+tx+'px,'+ty+'px) scale('+(down?.82:1)+')';if(!down){T.classList.remove('ripple');void T.offsetWidth;T.classList.add('ripple')}};
window.touchHide=()=>{T.style.opacity=0};
</script></body></html>`;

(async () => {
  fs.rmSync(TMP, { recursive: true, force: true }); fs.mkdirSync(TMP, { recursive: true }); fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium" });
  const ctx = await b.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1" });
  const page = await ctx.newPage();
  await page.route(`${BASE}/__studio`, (r) => r.fulfill({ contentType: "text/html", body: STUDIO }));
  await page.goto(`${BASE}/__studio`); await page.evaluate(() => document.fonts.ready);
  const app = page.frame({ url: /#demo/ }) || page.frames()[1];
  await app.waitForSelector(".tabs");
  const W = (ms) => page.waitForTimeout(ms);
  const js = (fn, ...a) => page.evaluate(fn, ...a);
  const cap = (t) => js((x) => window.cap(x), t);
  // Glide the touch indicator to an element (page coordinates), press, click for real, release.
  const tap = async (sel, { dx = 0.5, dy = 0.5, hold = 110 } = {}) => {
    const loc = app.locator(sel).first(); await loc.scrollIntoViewIfNeeded(); const bb = await loc.boundingBox();
    const x = bb.x + bb.width * dx, y = bb.y + bb.height * dy;
    await js(([a, c]) => window.touchTo(a, c), [x, y]); await W(470);
    await js(() => window.press(true)); await W(hold);
    await loc.click({ position: { x: (bb.width * dx) / SCALE, y: (bb.height * dy) / SCALE } });
    await js(() => window.press(false)); await W(200);
  };
  const setRange = (sel, v) => app.evaluate(([s, val]) => { const el = document.querySelector(s); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, String(val)); el.dispatchEvent(new Event("input", { bubbles: true })); }, [sel, v]);
  // Drag a slider with the touch indicator following the thumb.
  const drag = async (sel, to, ms) => {
    const el = app.locator(sel); const bb = await el.boundingBox(); const max = Number(await el.getAttribute("max")); const from = Number(await el.inputValue());
    const px = (v) => bb.x + 14 * (SCALE / 1.85) + (bb.width - 28 * (SCALE / 1.85)) * (v / max), y = bb.y + bb.height / 2;
    await js(([a, c]) => window.touchTo(a, c), [px(from), y]); await W(600); await js(() => window.press(true)); await W(150);
    const n = 30; for (let i = 1; i <= n; i++) { const v = Math.round(from + ((to - from) * i) / n); await setRange(sel, v); await js(([a, c]) => { const T = document.getElementById("touch"); T.style.transition = "transform .06s linear,opacity .35s"; T.style.transform = `translate(${a}px,${c}px) scale(.82)`; }, [px(v), y]); await W(ms / n); }
    await js(() => { document.getElementById("touch").style.transition = ""; }); await js(() => window.press(false)); await W(250);
  };
  const scrollBody = (y) => app.evaluate((v) => document.querySelector(".app__body").scrollTo({ top: v, behavior: "smooth" }), y);

  const cdp = await ctx.newCDPSession(page); const frames = [];
  cdp.on("Page.screencastFrame", async (f) => { const file = path.join(TMP, `f${String(frames.length).padStart(5, "0")}.jpg`); fs.writeFileSync(file, Buffer.from(f.data, "base64")); frames.push({ file, t: f.metadata.timestamp }); cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {}); });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: VW, maxHeight: VH, everyNthFrame: 1 });

  const S = 10; let k = 0; const next = () => js((p) => window.bar(p), ++k / S);
  await W(2600);
  await js(() => { window.stage(""); window.card("intro", false); }); await W(900);
  await cap("¿En qué tramo vas a <em>cerrar el año</em>?"); next(); await W(2200);

  await cap("Toca cada mes y mira <em>tu evolución</em>"); next(); await scrollBody(560); await W(800);
  { const svg = app.locator(".yc svg"); const bb = await svg.boundingBox(); const y = bb.y + bb.height * 0.5;
    await js(([a, c]) => window.touchTo(a, c), [bb.x + bb.width * 0.04, y]); await W(600); await js(() => window.press(true));
    for (let i = 0; i <= 11; i++) { const fx = 0.04 + i * 0.083; await svg.hover({ position: { x: (bb.width / SCALE) * fx, y: (bb.height / SCALE) * 0.5 } }); await js(([a, c]) => { const T = document.getElementById("touch"); T.style.transition = "transform .16s linear,opacity .35s"; T.style.transform = `translate(${a}px,${c}px) scale(.82)`; }, [bb.x + bb.width * fx, y]); await W(150); }
    await js(() => { document.getElementById("touch").style.transition = ""; }); await js(() => window.press(false)); await W(400); }

  await cap("¿Y si ganas más? <em>Simúlalo</em> al instante"); next(); await js(() => window.touchHide()); await scrollBody(2000); await W(900);
  const v0 = Number(await app.locator("#sim").inputValue()); await drag("#sim", 5200, 1500); await W(700);

  await cap("Te decimos <em>qué hacer</em> antes del plazo"); next(); await js(() => window.touchHide()); await setRange("#sim", v0); await scrollBody(0); await W(700);
  await tap(".next__go"); await W(2000); await tap(".sheet .iconbtn"); await W(300);

  await cap("Sube el <em>extracto</em> de tu banco"); next(); await tap(".tabs button:nth-child(2)"); await W(400); await tap(".imp__go"); await W(500);
  await tap("text=Probar con un extracto de ejemplo"); await W(1300); await tap(".sheet__p .btn"); await W(900);

  await cap("…o una factura: <em>la IA la lee</em> por ti"); next(); await tap(".sheet .seg button:nth-child(2)"); await W(300);
  await tap(".imp__consent input"); await W(150); await tap("text=Factura de ejemplo (ingreso)"); await W(1900); await tap(".sheet__p .btn"); await W(800); await tap(".sheet .iconbtn"); await W(250);

  await cap("Tu proyección se <em>actualiza sola</em>"); next(); await tap(".tabs button:nth-child(1)"); await js(() => window.touchHide()); await W(2000);
  await cap("Pregunta <em>lo que quieras</em>"); next(); await tap(".tabs button:nth-child(3)"); await W(400); await tap(".chat__chips button:nth-child(2)"); await js(() => window.touchHide()); await W(3300);
  await cap("Avisos antes de <em>cada fecha</em>"); next(); await tap(".tabs button:nth-child(4)"); await W(500); await tap(".wins li.next .sw"); await W(400); await tap(".wins li.next .sw"); await js(() => window.touchHide()); await W(700);
  await cap("Instálala en tu <em>móvil</em>"); next(); await tap(".pillbtn"); await js(() => window.touchHide()); await W(2200);

  await js(() => { window.stage("post"); setTimeout(() => window.card("outro", true), 350); }); await W(3300);

  await cdp.send("Page.stopScreencast"); await b.close();
  const list = frames.map((f, i) => `file '${f.file}'\nduration ${Math.max(0.001, ((frames[i + 1]?.t ?? f.t + 1) - f.t)).toFixed(4)}`).join("\n") + `\nfile '${frames[frames.length - 1].file}'\n`;
  fs.writeFileSync(path.join(TMP, "list.txt"), list);
  const out = path.join(OUT, SQ ? "cuotio-demo-cuadrado.mp4" : "cuotio-demo-vertical.mp4");
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", path.join(TMP, "list.txt"), "-vf", `scale=${VW}:${VH}:flags=lanczos,fps=30,format=yuv420p`, "-c:v", "libx264", "-preset", "slow", "-crf", "19", "-movflags", "+faststart", out]);
  console.log(`${frames.length} frames -> ${out}`);
})();
