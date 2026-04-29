import { Link, NavLink } from "react-router-dom";
import { Theater, Settings, History } from "lucide-react";

function Header() {
  const navLinkClass = ({ isActive }) =>
    `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition ${
      isActive
        ? "bg-sky-500/10 text-sky-300"
        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
    }`;

  return (
    <header className="sticky top-0 z-30 backdrop-blur bg-slate-950/70 border-b border-slate-800">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <Theater className="w-5 h-5 text-sky-400 group-hover:text-sky-300 transition" />
          <span className="font-semibold bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent">
            Interview Simulator
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <NavLink to="/setup" className={navLinkClass}>
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">설정</span>
          </NavLink>
          <NavLink to="/history" className={navLinkClass}>
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">히스토리</span>
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

export default Header;
