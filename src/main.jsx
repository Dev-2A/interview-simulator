import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";

// DB 인스턴스를 import하면 자동으로 IndexedDB가 열린다
import "./services/db";

// 개발 모드에서 콘솔 디버깅용으로 repo 함수들을 노출
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
      <App />
    </HashRouter>
  </StrictMode>,
);
