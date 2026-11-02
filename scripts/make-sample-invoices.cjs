// Generates the two fictitious sample invoices in public/demo/ (node scripts/make-sample-invoices.cjs).
const { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright");
const path = require("path");
const inv = (o) => `<html><head><meta charset="utf-8"><style>
body{font-family:Helvetica,Arial,sans-serif;color:#1b2333;margin:48px;font-size:13px}
.wm{position:fixed;top:40%;left:5%;font-size:64px;color:rgba(200,40,40,.12);transform:rotate(-24deg);font-weight:800;letter-spacing:4px}
h1{font-size:28px;margin:0 0 4px} .muted{color:#667} table{width:100%;border-collapse:collapse;margin-top:24px}
th,td{padding:10px;border-bottom:1px solid #dde;text-align:left} td.r,th.r{text-align:right} .tot td{font-weight:bold;font-size:15px}
.grid{display:flex;justify-content:space-between;margin-top:28px} .box{width:45%}
</style></head><body><div class="wm">EJEMPLO · FICTICIA</div>
<h1>FACTURA</h1><div class="muted">Nº ${o.num} · Fecha: ${o.fecha}</div>
<div class="grid"><div class="box"><b>Emisor</b><br>${o.emisor}</div><div class="box"><b>Cliente</b><br>${o.cliente}</div></div>
<table><tr><th>Concepto</th><th class="r">Importe</th></tr>${o.lineas.map(([c, v]) => `<tr><td>${c}</td><td class="r">${v}</td></tr>`).join("")}
<tr><td class="r">Base imponible</td><td class="r">${o.base}</td></tr><tr><td class="r">IVA 21 %</td><td class="r">${o.iva}</td></tr>
${o.irpf ? `<tr><td class="r">Retención IRPF 15 %</td><td class="r">${o.irpf}</td></tr>` : ""}
<tr class="tot"><td class="r">TOTAL</td><td class="r">${o.total}</td></tr></table>
<p class="muted" style="margin-top:40px">Documento de ejemplo con datos ficticios para probar Cuotio. No es una factura real.</p></body></html>`;
const docs = [
  { file: "factura-ejemplo-ingreso.pdf", num: "2026-041", fecha: "14/10/2026",
    emisor: "Ana Ejemplo Ficticia<br>NIF 00000000T<br>Calle Inventada 1, Bilbao", cliente: "Estudio Norte Demo, S.L.<br>CIF B00000000<br>Avenida Ficticia 22, Madrid",
    lineas: [["Diseño de identidad visual", "1.200,00 €"], ["Adaptación a redes sociales", "450,00 €"]], base: "1.650,00 €", iva: "346,50 €", irpf: "−247,50 €", total: "1.749,00 €" },
  { file: "factura-ejemplo-gasto.pdf", num: "NH-88213", fecha: "03/10/2026",
    emisor: "Nube Hosting Demo, S.L.<br>CIF B11111111<br>Polígono Imaginario 5, Valencia", cliente: "Ana Ejemplo Ficticia<br>NIF 00000000T<br>Calle Inventada 1, Bilbao",
    lineas: [["Plan de alojamiento web Pro (anual)", "180,00 €"], ["Dominio .es (anual)", "10,00 €"]], base: "190,00 €", iva: "39,90 €", total: "229,90 €" },
];
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium" });
  for (const d of docs) { const p = await b.newPage(); await p.setContent(inv(d)); await p.pdf({ path: path.join(__dirname, "..", "public", "demo", d.file), format: "A4" }); }
  await b.close();
})();
