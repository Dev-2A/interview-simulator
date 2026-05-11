import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
} from "react";
import clsx from "clsx";
import {
  Send,
  Loader2,
  Undo2,
  Mic,
  MicOff,
  AlertTriangle,
  X,
} from "lucide-react";
import { useSpeechRecognition } from "../../hooks/useSpeechRecognition";

/**
 * 답변 입력 컴포저.
 * - Enter 단독: 줄바꿈
 * - Ctrl/Cmd + Enter: 제출
 * - 마이크 버튼: 음성 인식 토글 (확정 텍스트는 입력란 끝에 누적, 인식 중 텍스트는 회색 미리보기)
 *
 * forwardRef로 노출하는 메서드:
 * - setText(text)
 * - focus()
 */
const AnswerComposer = forwardRef(function AnswerComposer(
  { onSubmit, onRollback, canRollback, thinking, disabled },
  ref,
) {
  const [value, setValue] = useState("");
  const taRef = useRef(null);

  // ─── 음성 인식 ───────────────────────────────────────────
  const {
    supported: speechSupported,
    listening,
    interim,
    error: speechError,
    start: startListening,
    stop: stopListening,
    reset: resetSpeech,
  } = useSpeechRecognition({
    onFinal: (text) => {
      // 확정된 텍스트는 기존 입력에 이어붙임
      setValue((prev) => {
        const needsSpace = prev && !/\s$/.test(prev);
        return prev + (needsSpace ? " " : "") + text.trim();
      });
    },
  });

  useImperativeHandle(ref, () => ({
    setText: (text) => {
      setValue(text ?? "");
      requestAnimationFrame(() => taRef.current?.focus());
    },
    focus: () => taRef.current?.focus(),
  }));

  // 자동 높이 조절
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 240) + "px";
  }, [value, interim]);

  // 컴포넌트가 disabled로 바뀌면 인식도 자동 정지
  useEffect(() => {
    if (disabled && listening) stopListening();
  }, [disabled, listening, stopListening]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || thinking || disabled) return;
    if (listening) stopListening();
    onSubmit(trimmed);
    setValue("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleListening = () => {
    if (listening) {
      stopListening();
    } else {
      resetSpeech();
      startListening();
    }
  };

  return (
    <div className="space-y-1.5">
      {/* 음성 인식 에러 알림 */}
      {speechError && (
        <div className="rounded-md border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-xs text-rose-200 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <div className="flex-1">{speechError}</div>
          <button
            type="button"
            onClick={resetSpeech}
            className="text-rose-300/70 hover:text-rose-200 transition shrink-0"
            aria-label="음성 인식 에러 닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div
        className={clsx(
          "rounded-xl border bg-slate-900/70 p-2 flex items-end gap-2 transition",
          disabled
            ? "border-slate-800 opacity-60"
            : listening
              ? "border-rose-400/60 ring-1 ring-rose-400/30"
              : "border-slate-700 focus-within:border-sky-500/50",
        )}
      >
        <div className="flex-1 relative">
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
                : listening
                  ? "듣고 있어... 말해줘 🎙️"
                  : "답변을 입력해줘 — Ctrl + Enter 로 전송"
            }
            className="w-full resize-none bg-transparent text-sm text-slate-100 placeholder-slate-600 focus:outline-none px-2 py-2 leading-relaxed"
          />

          {/* 인식 중 미확정 텍스트 미리보기 */}
          {listening && interim && (
            <div className="px-2 pb-1 text-xs italic text-slate-500 wrap-break-words">
              <span className="text-slate-400">{value && "… "}</span>
              {interim}
            </div>
          )}
        </div>

        {/* 마이크 버튼 — 지원 브라우저에서만 노출 */}
        {speechSupported && (
          <button
            type="button"
            onClick={toggleListening}
            disabled={disabled || thinking}
            className={clsx(
              "shrink-0 inline-flex items-center justify-center rounded-md w-9 h-9 transition",
              listening
                ? "bg-rose-500/20 text-rose-100 hover:bg-rose-500/30 animate-pulse"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700",
              "disabled:opacity-40 disabled:cursor-not-allowed",
            )}
            aria-label={listening ? "음성 인식 중지" : "음성 인식 시작"}
            title={listening ? "음성 인식 중지" : "음성 입력 — 한국어"}
          >
            {listening ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>
        )}

        {/* 전송 버튼 */}
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

      <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
        <button
          type="button"
          onClick={onRollback}
          disabled={!canRollback || thinking || disabled}
          className={clsx(
            "inline-flex items-center gap-1 px-2 py-1 rounded transition",
            "hover:bg-slate-800/60 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed",
          )}
          title="마지막 답변과 그에 대한 피드백을 함께 되돌려"
        >
          <Undo2 className="w-3 h-3" />
          답변 다시 쓰기
        </button>
        <span className="text-slate-600">
          {listening ? (
            <span className="inline-flex items-center gap-1 text-rose-300/80">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              듣는 중 · 마이크 다시 누르면 종료
            </span>
          ) : (
            "Ctrl + Enter 전송 · Enter 줄바꿈"
          )}
        </span>
      </div>
    </div>
  );
});

export default AnswerComposer;
