import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Send, Loader2 } from "lucide-react";

/**
 * 답변 입력 컴포저.
 * - Enter 단독: 줄바꿈
 * - Ctrl/Cmd + Enter: 제출
 * - thinking=true: 비활성화 + 스피너
 * - 자동 높이 조절 (textarea가 내용에 맞게 늘어남)
 */
function AnswerComposer({ onSubmit, thinking, disabled }) {
  const [value, setValue] = useState("");
  const taRef = useRef(null);

  // 자동 높이 조절
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 240) + "px";
  }, [value]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || thinking || disabled) return;
    onSubmit(trimmed);
    setValue("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={clsx(
        "rounded-xl border bg-slate-900/70 p-2 flex items-end gap-2 transition",
        disabled
          ? "border-slate-800 opacity-60"
          : "border-slate-700 focus-within:border-sky-500/50",
      )}
    >
      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        disabled={disabled}
        placeholder={
          disabled
            ? "면접이 종료된 세션이야."
            : "답변을 입력해줘 — Ctrl + Enter 로 전송"
        }
        className="flex-1 resize-none bg-transparent text-sm text-slate-100 placeholder-slate-600 focus:outline-none px-2 py-2 leading-relaxed"
      />
      <button
        type="button"
        onClick={handleSend}
        disabled={!value.trim() || thinking || disabled}
        className={clsx(
          "shrink-0 inline-flex items-center justify-center gap-1 rounded-md text-sm font-medium px-3 py-2 transition",
          "bg-sky-500 text-slate-950 hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed",
        )}
        aria-label="답변 전송"
      >
        {thinking ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}

export default AnswerComposer;
