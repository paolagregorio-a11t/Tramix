# Puesta en marcha (web + emails)

Todo lo que necesita cuentas tuyas. Tiempo estimado: 30–40 minutos.

## 1. Dominio
Compra el dominio elegido (por ejemplo `tramix.app`) **después** de comprobarlo en el localizador de la OEPM y en TMview.

## 2. Resend (envío de emails)
1. Crea una cuenta en [resend.com](https://resend.com) (el plan gratuito cubre 3.000 emails/mes).
2. **Domains → Add Domain**, y añade en tu DNS los registros SPF, DKIM y DMARC que te indica. Espera a que aparezca como *Verified*. Sin esto, los correos no llegan a otras personas.
3. **Audiences → Create Audience** ("Lista de espera"). Copia su ID.
4. **API Keys → Create** (permiso *Sending access* y *Full access* si quieres gestionar contactos). Copia la clave.

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
1. Crea una clave gratuita en [Groq](https://console.groq.com/keys) (modelos Llama) o en [Google AI Studio](https://aistudio.google.com/apikey) (Gemini).
2. Añade en Vercel `AI_API_KEY` (y `AI_BASE_URL` / `AI_MODEL` si usas Gemini; ver `.env.example`).
3. Antes de lanzar, **revisa los límites y las condiciones del plan gratuito**: cambian con el tiempo y algunos planes gratuitos pueden usar las consultas para mejorar sus modelos. Por eso solo se envían cifras agregadas, nunca el email ni datos que identifiquen al usuario.
4. Limita el abuso con *Vercel Firewall → Rate limiting* sobre `/api/ask` (el freno incluido solo protege cada instancia).

## 6. Antes de hacerlo público
- Completa `src/legal/config.ts` (nombre, NIF, domicilio, email). Mientras estén vacíos, las páginas legales muestran "[pendiente de completar]".
- **Confirma la tabla de tramos** de `src/engine/tramos.ts` con el texto de la Orden PJC/297/2026 (BOE-A-2026-7296) y cambia `estado` a `"verificada-boe"`. Hoy está "contrastada" entre fuentes secundarias, no leída del BOE.
- Confirma también las fechas límite de cambio de base (`ventanas()` en `src/engine/calc.ts`).
- Haz que una gestoría o un abogado revise los textos legales.

## Comandos
```
npm run dev            # servidor local
npm test               # tests del motor, la API y los emails
npm run typecheck      # tipos de la web, la API y los emails
npm run email:preview  # genera emails/preview/*.html para verlos
npm run build          # compila a dist/
```
