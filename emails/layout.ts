/**
 * Shared shell for every Tramix email. Table-based, inline styles, 600px max:
 * the only layout that renders consistently in Gmail, Outlook, Apple Mail and mobile clients.
 */
export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export type Brand = { site: string; unsubscribeUrl: string; contactEmail: string; senderName: string };

const C = { navy: "#0b1220", navy2: "#121c33", steel: "#2e4c86", gold: "#e9b44c", paper: "#f5f7fa", ink: "#0b1220", muted: "#5a6478", line: "#e1e6ee" };
export const color = C;
const FONT = "Manrope,'Plus Jakarta Sans',-apple-system,'Segoe UI',Helvetica,Arial,sans-serif";

export const h1 = (t: string) => `<h1 style="margin:0 0 14px;font:800 28px/1.15 ${FONT};letter-spacing:-0.5px;color:${C.ink}">${t}</h1>`;
export const p = (t: string) => `<p style="margin:0 0 16px;font:400 16px/1.6 ${FONT};color:#2f3a52">${t}</p>`;

/** "Bulletproof" button: a padded table cell, so the colour shows even where CSS on <a> is stripped. */
export const button = (label: string, href: string) => `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 8px"><tr>
  <td align="center" bgcolor="${C.gold}" style="border-radius:999px">
    <a href="${esc(href)}" style="display:inline-block;padding:15px 30px;font:700 16px/1 ${FONT};color:#1a1405;text-decoration:none;border-radius:999px">${esc(label)}</a>
  </td></tr></table>`;

export function layout(o: { preheader: string; body: string; brand: Brand; why: string }): string {
  const { brand: b } = o;
  return `<!doctype html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">
<title>Tramix</title>
<!--[if mso]><style>td,a,p,h1{font-family:Arial,sans-serif!important}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background:${C.paper};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${esc(o.preheader)}&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.paper}"><tr><td align="center" style="padding:24px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden">
    <tr><td bgcolor="${C.navy}" style="padding:28px 36px">
      <a href="${esc(b.site)}" style="text-decoration:none"><img src="${esc(b.site)}/email/logo.png" width="140" alt="Tramix" style="display:block;border:0;height:auto;color:#fff;font:800 24px ${FONT}"></a>
    </td></tr>
    <tr><td style="height:4px;line-height:4px;font-size:0" bgcolor="${C.gold}">&nbsp;</td></tr>
    <tr><td style="padding:36px 36px 12px">${o.body}</td></tr>
    <tr><td style="padding:8px 36px 32px"><p style="margin:0;font:600 15px/1.5 ${FONT};color:${C.ink}">Un saludo,<br><span style="color:${C.steel}">${esc(b.senderName)}</span></p></td></tr>
    <tr><td style="border-top:1px solid ${C.line};padding:24px 36px;background:#fafbfd">
      <p style="margin:0 0 10px;font:400 12.5px/1.55 ${FONT};color:${C.muted}">${o.why}</p>
      <p style="margin:0;font:400 12.5px/1.55 ${FONT};color:${C.muted}">
        <a href="${esc(b.unsubscribeUrl)}" style="color:${C.muted};text-decoration:underline">Darme de baja</a> &nbsp;·&nbsp;
        <a href="${esc(b.site)}/#privacidad" style="color:${C.muted};text-decoration:underline">Privacidad</a> &nbsp;·&nbsp;
        <a href="mailto:${esc(b.contactEmail)}" style="color:${C.muted};text-decoration:underline">${esc(b.contactEmail || "Contacto")}</a>
      </p>
    </td></tr>
  </table>
  <p style="max-width:560px;margin:16px auto 0;font:400 11.5px/1.5 ${FONT};color:#8b93a7;text-align:center">Tramix ofrece cálculos orientativos y no constituye asesoramiento fiscal.</p>
</td></tr></table>
</body></html>`;
}
