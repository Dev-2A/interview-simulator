import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { ToastProvider } from "./components/ui/ToastContext";
import { ApiKeyProvider } from "./hooks/useApiKey";

import "./services/db";

if (import.meta.env.DEV) {
  Promise.all([
    import("./services/sessionsRepo"),
    import("./services/messagesRepo"),
    import("./services/settingsRepo"),
  ]).then(([sessions, messages, settings]) => {
    window.repos = { sessions, messages, settings };
    console.log(
      "%c🛠️ Dev mode",
      "color:#7dd3fc;font-weight:bold",
      "window.db, window.repos 사용 가능",
    );
  });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HashRouter>
      <ApiKeyProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </ApiKeyProvider>
    </HashRouter>
  </StrictMode>,
);
