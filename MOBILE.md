# Apps para iOS y Android

La web ya es una **PWA**: en el móvil, "Añadir a pantalla de inicio" la instala como app, con icono propio, pantalla completa y funcionamiento sin conexión. Es la vía más rápida para enseñarla hoy.

Para publicarla en **App Store** y **Google Play** usamos [Capacitor](https://capacitorjs.com), que envuelve la misma web en una app nativa. Así hay un solo código para web, iOS y Android.

## Requisitos
| | Qué necesitas | Coste |
|---|---|---|
| Android | Android Studio + cuenta de Google Play Console | 25 € (pago único) |
| iOS | Un Mac con Xcode + cuenta de Apple Developer | 99 €/año |

No se pueden generar los binarios desde un entorno sin Mac (iOS) ni Android Studio. Por eso los proyectos nativos no están en el repositorio: se crean en tu equipo.

## Pasos
```
npm install
npm run build
npx cap add android      # y/o: npx cap add ios
npm run cap:sync         # cada vez que cambies la web
npx cap open android     # abre Android Studio  (o: npx cap open ios)
```
Desde Android Studio o Xcode puedes probarla en un emulador o en tu móvil y luego generar el paquete para la tienda.

## Antes de subir a las tiendas
- Cambia `appId` en `capacitor.config.ts` (es permanente una vez publicada).
- Iconos y pantalla de inicio: usa `public/icons/icon-512.png` como base (herramienta: `@capacitor/assets`).
- Apple exige **política de privacidad** pública y una cuenta de prueba si hay login. Google pide el formulario de *Data safety*.
- Apple revisa que la app sea "más que una web": conviene añadir notificaciones push nativas (`@capacitor/push-notifications`) para los avisos de plazo.
- Los avisos por email siguen funcionando igual; las notificaciones push requieren un servicio aparte (Firebase Cloud Messaging / APNs).

## Cuando la app tenga cuentas de usuario
Esta versión es una demo sin cuentas ni servidor de datos. Para la app real hará falta: login, base de datos (por ejemplo Supabase, con servidores en la UE), y que los avisos se calculen en el servidor.
