import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { DeviceTierProvider } from "./hooks/useDeviceTier";

/**
 * iOS Safari: жүйелік «лупа / іздеу / аудару» толық өшіре алмайды — Apple веб-бетке сақталған.
 * Тек жеңіл блок: ұзақ басу/сүйреудің бір бөлігі.
 */
function blockSelectionChrome(e: Event) {
  e.preventDefault();
}
document.addEventListener("selectstart", blockSelectionChrome, { capture: true });
document.addEventListener("dragstart", blockSelectionChrome, { capture: true });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* Оптимизация: режим өнімділігі (auto/high/low) бүкіл қосымшаға бір контекстпен */}
    <DeviceTierProvider>
      <App />
    </DeviceTierProvider>
  </StrictMode>
);
