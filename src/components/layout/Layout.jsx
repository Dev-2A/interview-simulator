import { Outlet } from "react-router-dom";
import Header from "./Header";

function Layout() {
  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500 space-y-1">
        <p>
          🎭 Interview Simulator · Made with{" "}
          <span title="콜라 한 잔의 영감">콜라</span> and{" "}
          <span title="Claude를 향한 마음">💙</span> by{" "}
          <a
            href="https://github.com/Dev-2A"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-sky-400 transition-colors"
          >
            Dev-2A
          </a>
        </p>
        <p className="text-slate-600">
          모든 데이터는 브라우저 IndexedDB에만 저장돼 · 100% 로컬 처리 · BYOK
        </p>
      </footer>
    </div>
  );
}

export default Layout;
