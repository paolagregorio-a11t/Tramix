import type { CapacitorConfig } from "@capacitor/cli";

/** Wraps the web build (dist/) as native iOS and Android apps. See MOBILE.md. */
const config: CapacitorConfig = {
  appId: "app.tramix.mobile",   // change before publishing; it is permanent once in the stores
  appName: "Tramix",
  webDir: "dist",
  backgroundColor: "#0b1220",
  ios: { contentInset: "always" },
  android: { allowMixedContent: false },
};

export default config;
