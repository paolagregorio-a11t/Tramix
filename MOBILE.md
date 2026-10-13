# Apps para iOS y Android

Hay cuatro formas de llevar Tramix al móvil, de la más rápida a la más completa. Las dos primeras no necesitan tiendas, Mac ni Android Studio.

## 1. Instalarla desde el navegador (PWA) · gratis · hoy mismo
Es la opción recomendada para la demo. La web ya es una PWA: icono propio, pantalla completa y funcionamiento sin conexión.

- **Android (Chrome):** menú ⋮ → *Instalar aplicación*. La web también muestra un botón **Instalar** que lo hace con un toque.
- **iPhone (Safari):** botón Compartir → *Añadir a pantalla de inicio*.
- **Ordenador (Chrome/Edge):** icono de instalar en la barra de direcciones.

La demo incluye un botón **Instalar** y una hoja con estas instrucciones según el dispositivo. Requiere que la web esté publicada con HTTPS (ver `DEPLOY.md`).

## 2. APK de Android sin Android Studio · gratis
Un APK es el archivo de instalación de Android: puedes pasarlo por WhatsApp o email e instalarlo (hay que permitir "instalar apps de origen desconocido").

1. Sube el repositorio a GitHub y, en **Settings → Secrets and variables → Actions → Variables**, crea `SITE_URL` con la dirección de tu web (`https://tu-dominio.com`).
2. Ve a **Actions → Android APK → Run workflow**.
3. Cuando termine (unos 5–10 minutos), descarga `tramix-debug-apk` desde la ejecución.

Es un APK de pruebas, válido para enseñarlo y probarlo, no para Google Play. El flujo está escrito pero **todavía no lo he podido ejecutar**: si un paso falla, el registro de GitHub dice cuál.

## 3. Google Play sin Android Studio · 25 € (pago único)
Con [PWABuilder](https://www.pwabuilder.com) pegas la dirección de tu web ya publicada y genera el paquete para Google Play. Necesitas una cuenta de Google Play Console. Es la ruta más corta a la tienda de Android.

## 4. App Store de iPhone · 99 €/año
Apple exige una cuenta de desarrollador de pago y una compilación firmada. No hace falta tener un Mac propio: servicios en la nube como Codemagic o Expo EAS compilan en Macs remotos. Con esta base (Capacitor) los pasos son:
```
npm install && npm run build
npx cap add ios && npm run cap:sync
```
y subir el resultado desde el servicio de compilación. Apple además revisa que la app sea más que una web envuelta; añadir notificaciones push nativas ayuda.

## Antes de publicar en cualquier tienda
- Cambia `appId` en `capacitor.config.ts` (es permanente).
- Iconos: `public/icons/icon-512.png` como base.
- Política de privacidad pública (ya hay una en la web) y, en Google Play, el formulario *Data safety*.
- La app nativa llama a la API de la web desplegada (`VITE_API_BASE`), así que primero hay que desplegar `DEPLOY.md`.
