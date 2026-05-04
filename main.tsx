import {
  Component,
  StrictMode,
  type ErrorInfo,
  type ReactNode,
} from "react";
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

class RootErrorBoundary extends Component<
  { children: ReactNode },
  { err: Error | null }
> {
  state: { err: Error | null } = { err: null };

  static getDerivedStateFromError(err: Error): { err: Error } {
    return { err };
  }

  componentDidCatch(err: Error, info: ErrorInfo): void {
    console.error("[app] render error", err, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.err != null) {
      return (
        <div
          style={{
            minHeight: "100dvh",
            padding: 24,
            fontFamily: "system-ui, sans-serif",
            background: "#f5efe6",
            color: "#3d3428",
            boxSizing: "border-box",
          }}
        >
          <p style={{ fontSize: "1.05rem", marginBottom: 16 }}>
            Бір қате шықты. Бетті қайта жүктеп көріңіз.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: "12px 20px",
              fontSize: "1rem",
              borderRadius: 12,
              border: "1px solid #c4b8a8",
              cursor: "pointer",
              background: "#fffefb",
            }}
          >
            Қайта жүктеу
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("root element #root жоқ");
}

createRoot(rootEl).render(
  <StrictMode>
    <RootErrorBoundary>
      {/* Оптимизация: режим өнімділігі (auto/high/low) бүкіл қосымшаға бір контекстпен */}
      <DeviceTierProvider>
        <App />
      </DeviceTierProvider>
    </RootErrorBoundary>
  </StrictMode>
);
