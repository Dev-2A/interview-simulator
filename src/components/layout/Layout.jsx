import { Outlet } from "react-router-dom";
import Header from "./Header";

function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        🎭 Interview Simulator · Made with 콜라 and 💙 by{" "}
        <a
          href="https://github.com/Dev-2A"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-400 hover:text-sky-400 transition"
        >
          Dev-2A
        </a>
      </footer>
    </div>
  );
}

export default Layout;
