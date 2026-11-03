import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { initAnalytics } from "./analytics";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

initAnalytics();

// Offline support for the installed app. Skipped on localhost and in previews.
if ("serviceWorker" in navigator && import.meta.env.PROD && import.meta.env.VITE_PREVIEW !== "1" && location.protocol === "https:") {
  addEventListener("load", () => { navigator.serviceWorker.register("/sw.js").catch(() => {}); });
}
