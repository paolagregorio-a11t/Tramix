# Puesta en marcha (web + emails)

Todo lo que necesita cuentas tuyas. Tiempo estimado: 30–40 minutos.

## 1. Dominio
`cuotio.es` ya está comprado. Los registros DNS que hay que añadir están en [DNS.md](DNS.md).

## 2. Resend (envío de emails)
1. Crea una cuenta en [resend.com](https://resend.com) (el plan gratuito cubre 3.000 emails/mes).
2. `cuotio.es` ya está dado de alta en Resend (región UE). Añade en tu DNS los registros de [DNS.md](DNS.md) y pulsa *Verify*. Sin esto, los correos no llegan a otras personas.
3. La *Audience* "General" ya existe y es la que usa la lista de espera.
4. **API Keys → Create** con permiso **Full access**. Una clave de solo envío (*Sending access*) no sirve: la lista de espera necesita gestionar contactos y daría error. Copia la clave.

## 3. Vercel (alojamiento)
1. Sube el repositorio a GitHub.
2. En [vercel.com](https://vercel.com): **Add New → Project**, importa el repositorio. Los ajustes por defecto valen.
3. **Settings → Environment Variables:** añade todas las de `.env.example`.
   - `SITE_URL` es la dirección final con `https://`, sin barra al final.
   - `UNSUBSCRIBE_SECRET`: genera una con `openssl rand -hex 32`.
4. **Settings → Domains:** conecta tu dominio.
5. Haz un nuevo *Deploy* para que las variables se apliquen.

## 4. Prueba antes de enseñarlo
1. Abre la web, apúntate con tu email y acepta la casilla. Debes ver "Estás dentro" y recibir el correo en 1–2 minutos.
2. Comprueba el correo en Gmail y en el móvil (mira también en spam la primera vez).
3. Pulsa **Darme de baja** y comprueba que te saca de la lista en Resend.
4. Apúntate otra vez con el mismo email: no debe llegar un segundo correo.

Si algo falla, **Vercel → Logs** muestra qué variable falta (`waitlist: missing environment variables: …`).

## 5. Asistente de IA gratuito (opcional)
El asistente responde sin IA a las cuatro preguntas sugeridas. Para que también conteste preguntas libres:
1. Crea una clave gratuita en [Google AI Studio](https://aistudio.google.com/apikey) (o en [Groq](https://console.groq.com/keys)).
2. Añade en Vercel `AI_API_KEY`. Por defecto usa `gemini-flash-lite-latest`; ver `.env.example` para otros proveedores. Probado con una clave real de Gemini el 13/10/2026.
3. Antes de lanzar, **revisa los límites y las condiciones del plan gratuito**: cambian con el tiempo y algunos planes gratuitos pueden usar las consultas para mejorar sus modelos. Por eso solo se envían cifras agregadas, nunca el email ni datos que identifiquen al usuario.
4. Limita el abuso con *Vercel Firewall → Rate limiting* sobre `/api/ask` (el freno incluido solo protege cada instancia).

## 6. Estadísticas de uso sin cookies (Umami)
Sirven para ver dónde se atascan quienes prueban Cuotio: si usan la calculadora, si abren la demo, si vuelven a la web y si terminan de apuntarse a la lista de espera. Umami no usa cookies ni guarda nada en el dispositivo, así que no hace falta banner de consentimiento. El plan *Hobby* de Umami Cloud es gratuito (hasta 100.000 eventos al mes, 1 sitio, 6 meses de historial).
1. Crea la cuenta en [umami.is](https://umami.is) y elige la **región de datos UE** al registrarte (la política de privacidad dice que los servidores están en la UE).
2. **Settings → Websites → Add website** con el dominio `cuotio.es`. Copia el *Website ID* (no es secreto).
3. Pon el ID en `DEFAULT_WEBSITE_ID` de `src/analytics.ts` (así llega también a la app instalada y al APK) o como variable `VITE_UMAMI_WEBSITE_ID` en Vercel. Si el código de seguimiento que te da Umami usa otra dirección de script que `https://cloud.umami.is/script.js`, añade también `VITE_UMAMI_SRC`.
4. Publica y abre la web: en Umami deberían aparecer la visita y los eventos en uno o dos minutos. En local (`npm run dev`) no se envía nada.

Eventos que se registran (sin emails, importes ni texto libre; cada uno lleva `app`: `web`, `pwa` o `nativa`):

| Paso | Eventos |
|---|---|
| Registro (lista de espera) | `lista_espera_inicio` (toca el campo de email), `lista_espera_enviada`, `lista_espera_ok`, `lista_espera_error`; con `origen` y `desde_demo` |
| Cálculo del tramo | `calculo_tramo` (primer cambio en la calculadora), `calculo_tramo_detalle`; en la demo `demo_mes_guardado`, `demo_simulador`, `demo_importar`, `demo_hoja` (`hoja`: `rec` = ver cálculo/qué hacer, `import`, `install`, `fb`) |
| Demo y vuelta a la web | `ir_a_demo`, `demo_abierta`, `demo_pestana`, `demo_volver_web`, `web_desde_demo`, `demo_restablecer` |
| Otros | `opinion_enviada` (valoración y "¿lo usarías?"), `instalar_abierto` |

Para ver dónde se atascan: **Umami → Reports → Funnel**, por ejemplo `/` → evento `calculo_tramo` → evento `lista_espera_enviada` → evento `lista_espera_ok`, o `/demo` → `demo_volver_web` → `web_desde_demo` → `lista_espera_ok`.

## 7. Cuentas de usuario y base de datos (Supabase, Frankfurt)
La app con cuenta vive en `cuotio.es/app`. Cada persona entra con **Google** (un toque) o con **email y contraseña**; el código por email solo se usa para recuperar la contraseña. La sesión se queda abierta en cada dispositivo hasta que la persona la cierra. Sus meses, tramo y avisos se guardan en una base de datos en la UE. Las reglas de la base de datos (*Row Level Security*) hacen que cada cuenta solo pueda leer y cambiar sus propias filas, aunque fallara el código de la web. Mientras no estén puestas las variables de Supabase, `/app` muestra "Las cuentas llegan muy pronto" y el resto de la web sigue igual.

1. **Proyecto.** En [supabase.com](https://supabase.com) → **New project**, nombre `cuotio`, **Region: Central EU (Frankfurt)**. Guarda la contraseña de la base de datos en tu gestor de contraseñas (no hace falta para la web).
2. **Tablas y reglas.** **SQL Editor → New query**, pega el contenido de `supabase/migrations/20261103000000_cuentas.sql` y pulsa **Run**. Crea las tablas `perfiles` y `meses` con sus reglas.
3. **Correos desde cuotio.es (Resend).** El correo que trae Supabase de serie solo envía unos pocos emails por hora. **Authentication → Emails → SMTP Settings → Enable custom SMTP**:
   - Host `smtp.resend.com`, puerto `465`, usuario `resend`, contraseña: una clave de Resend (puede ser una nueva de solo envío, *Sending access*).
   - Remitente `hola@cuotio.es`, nombre `Cuotio`.
4. **Plantilla del código (recuperar contraseña).** **Authentication → Emails → Templates → Magic Link**: asunto `Tu código de Cuotio` y como cuerpo pega `supabase/templates/codigo.html` (se regenera con `npm run email:supabase`). Lleva `{{ .Token }}`, que es el código; sin eso el correo llega sin código.
5. **Email y contraseña.** **Authentication → Sign In / Providers → Email**: activado. Desactiva **Confirm email** para que al crear la cuenta se entre directamente, sin ir al correo. (Contrapartida: no comprobamos que el email sea de quien se registra. Antes de enviar avisos por email habrá que confirmarlo una vez.) En **Password strength** pon mínimo 8 caracteres y activa *Prevent use of leaked passwords* si tu plan lo permite.
6. **Continuar con Google.**
   - En [Google Cloud Console](https://console.cloud.google.com): crea un proyecto `Cuotio` → **APIs y servicios → Pantalla de consentimiento de OAuth**: tipo *Externo*, nombre `Cuotio`, logo, email de soporte, dominio `cuotio.es` y enlace a `https://cuotio.es/privacidad`. Permisos: solo `email`, `profile` y `openid`. Publica la app (estado *En producción*).
   - **Credenciales → Crear credenciales → ID de cliente de OAuth → Aplicación web.** En *URIs de redireccionamiento autorizados* pega la *Callback URL* que muestra Supabase en **Authentication → Sign In / Providers → Google** (algo como `https://xxxx.supabase.co/auth/v1/callback`).
   - Copia el *ID de cliente* y el *Secreto* en ese mismo apartado de Supabase y activa Google.
   - **Authentication → URL Configuration**: *Site URL* `https://cuotio.es`, y en *Redirect URLs* añade `https://cuotio.es/app` (y, si quieres probar en las vistas previas de Vercel, `https://*-paolagregoriio-1613s-projects.vercel.app/app`).
   - En la app nativa (APK) no se muestra el botón de Google: allí se entra con email y contraseña.
7. **Claves en Vercel.** En **Project Settings → API** de Supabase copia y añade en Vercel (**Settings → Environment Variables**):
   - `VITE_SUPABASE_URL` = *Project URL* (pública). La URL y la clave pública del proyecto de Cuotio ya están en `src/cuenta/supabase.ts` (así llegan también a la app instalada y al APK); estas dos variables solo hacen falta si cambias de proyecto.
   - `VITE_SUPABASE_ANON_KEY` = clave *publishable* (`sb_publishable_…`) o la antigua *anon* (pública: lo que protege los datos son las reglas del paso 2).
   - `SUPABASE_SERVICE_ROLE_KEY` = clave *secret* (`sb_secret_…`) o la antigua *service_role*. **Es secreta**: solo aquí, nunca en el código, en un chat ni en la app. Solo la usa `/api/borrar-cuenta` para borrar cuentas.
8. **Contrato de encargo de tratamiento (RGPD).** Supabase lo incluye en sus condiciones; en **Organization → Legal Documents** puedes descargarlo y guardarlo firmado junto a los de Resend, Vercel y Umami.
9. Haz un nuevo *Deploy* y prueba: abre `cuotio.es/app`, entra con Google y crea también una cuenta con email y contraseña; elige tu tramo y añade un mes. Prueba *He olvidado la contraseña*. Recarga la página: el mes debe seguir ahí. En otro navegador, con otro email, no deben verse tus datos. Prueba también **Ajustes → Descargar mis datos** y **Borrar mi cuenta**.

Qué se guarda: email (en el sistema de cuentas de Supabase), tramo, tipo de autónomo, avisos y los ingresos y gastos de cada mes. Los extractos del banco se siguen leyendo en el dispositivo y no se suben. Al borrar la cuenta se borra todo al momento (las tablas tienen `on delete cascade`).

Eventos de la app con cuenta en Umami (sin emails ni importes): `cuenta_google`, `cuenta_registro`, `cuenta_entrada_ok` (`metodo`: `google`, `password` o `codigo`), `cuenta_entrada_error` (`paso`), `cuenta_codigo_pedido`, `cuenta_password_cambiada`, `cuenta_alta` (`desde_demo`), `cuenta_exportar`, `cuenta_salir`, `cuenta_borrada`; y dentro de la app los mismos que la demo con prefijo `app_` en lugar de `demo_` (`app_abierta`, `app_mes_guardado`, `app_pestana`, `app_hoja`, `app_simulador`, `app_importar`).

### 7.1 Avisos por email antes de cada plazo

Cada día a las 7:00 (UTC) Vercel llama a `/api/avisos`. Si faltan 7 días o menos para el próximo plazo, escribe a cada cuenta que tenga ese aviso encendido y meses guardados, una sola vez por plazo, con el tramo recomendado. El enlace del pie del email apaga sus avisos.

1. Supabase > SQL Editor: ejecuta `supabase/migrations/20261104000000_avisos_enviados.sql` (la tabla donde se apunta lo ya enviado).
2. Vercel > Environment Variables: añade `CRON_SECRET` (una cadena aleatoria larga, `openssl rand -hex 32`). Comprueba que `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, `UNSUBSCRIBE_SECRET` y `SITE_URL` estén en Production.
3. Tras publicar, en Vercel > Settings > Cron Jobs verás `/api/avisos`. Con "Run" lo lanzas a mano; el resultado sale en los Logs.

## 8. Antes de hacerlo público
- Completa `src/legal/config.ts` (nombre, NIF, domicilio, email). Mientras estén vacíos, las páginas legales muestran "[pendiente de completar]".
- La tabla de tramos 2026 y las seis ventanas de cambio de base **están verificadas con el texto del BOE** (Orden PJC/297/2026, art. 18; Reglamento, art. 45). Cada año hay que actualizar `src/engine/tramos.ts` con la nueva Orden de cotización.
- Haz que una gestoría o un abogado revise los textos legales.

## Comandos
```
npm run dev            # servidor local
npm test               # tests del motor, la API y los emails
npm run typecheck      # tipos de la web, la API y los emails
npm run email:preview  # genera emails/preview/*.html para verlos
npm run email:supabase # genera la plantilla del código de acceso para Supabase
npm run build          # compila a dist/
```
