# DNS de cuotio.es

Se añaden en el panel del registrador (DonDominio → tu dominio → **Zona DNS** / *Gestión DNS*).
En "Nombre" pon solo lo que aparece en la tabla: el panel añade `.cuotio.es` solo.
Si el panel pide el nombre completo, escribe por ejemplo `resend._domainkey.cuotio.es`.

## 1. Correo saliente (Resend) · dado de alta en Resend el 2/11/2026, región UE

| Tipo | Nombre | Valor | Prioridad |
|---|---|---|---|
| TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDaHB6ZBVYxA7hjb2urYQqeqtmnxApNsCOBuldyT/eIHysRp2fy89to75KdJYKvfyKrBYeu6Soi3F+GWNmQkJuoZFQR2rezCJNOE/zgpjkii7sqSSBuOm/34sHzo0QYf+Di0DRUy3o6O14SfhsVS1g0VYTbFlhTYQCZa3X8WwGY7wIDAQAB` | |
| MX | `send` | `feedback-smtp.eu-west-1.amazonses.com` | 10 |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | |
| CNAME | `rsend` | `send.forge.rmta.net` | |
| TXT | `_dmarc` | `v=DMARC1; p=none;` | |

El último (DMARC) no lo exige Resend, pero Gmail y Outlook lo piden para no mandar los correos a spam.

## 2. Web (Vercel)
Primero añade `cuotio.es` y `www.cuotio.es` en Vercel → **Settings → Domains**. Vercel te enseñará los registros;
**copia exactamente los que te muestre**. Normalmente son:

| Tipo | Nombre | Valor |
|---|---|---|
| A | `@` (o vacío) | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

Si en la zona DNS ya hay registros A o CNAME para `@` o `www` puestos por el registrador (páginas de aparcamiento), bórralos.

## 3. Correo entrante (hola@cuotio.es → tu Gmail)
Resend solo envía. Para recibir, crea una **redirección de correo** `hola@cuotio.es` → `paolagregoriio@gmail.com`
en el panel del registrador, si la ofrece. Si no, se puede mover el DNS a Cloudflare (gratis) y usar *Email Routing*.
