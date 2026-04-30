import clsx from "clsx";
import { Check } from "lucide-react";

/**
 * 토글 가능한 칩.
 * - selected: 현재 선택 여부
 * - onToggle: 클릭 시 호출
 */
function Chip({ children, selected, onToggle, className }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition",
        selected
          ? "border-sky-400/60 bg-sky-500/15 text-sky-100"
          : "border-slate-700 bg-slate-900/50 text-slate-300 hover:border-slate-600 hover:text-slate-100",
        className,
      )}
    >
      {selected && <Check className="w-3 h-3" />}
      {children}
    </button>
  );
}

export default Chip;
