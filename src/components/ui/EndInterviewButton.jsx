import { useState } from "react";
import clsx from "clsx";
import { Flag, Loader2 } from "lucide-react";

/**
 * 면접 종료 버튼 — "한 번 클릭 → 확인 단계 → 두 번째 클릭으로 실제 종료" 패턴.
 *
 * - thinking=true: 종료 중 스피너
 * - disabled=true: 비활성화 (이미 종료된 세션 등)
 */
function EndInterviewButton({ onConfirm, thinking, disabled }) {
  const [armed, setArmed] = useState(false);

  if (armed) {
    return (
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={async () => {
            await onConfirm();
            setArmed(false);
          }}
          disabled={thinking || disabled}
          className={clsx(
            "inline-flex items-center gap-1.5 rounded-md text-xs font-medium px-3 py-1.5 transition",
            "bg-rose-500/80 text-slate-50 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          {thinking ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              회고 생성 중...
            </>
          ) : (
            <>정말 종료할게</>
          )}
        </button>
        {!thinking && (
          <button
            type="button"
            onClick={() => setArmed(false)}
            className="px-2 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
          >
            취소
          </button>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setArmed(true)}
      disabled={disabled}
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-md text-xs px-3 py-1.5 transition",
        "border border-slate-700 bg-slate-900/60 text-slate-300",
        "hover:border-rose-400/50 hover:text-rose-200 hover:bg-rose-500/5",
        "disabled:opacity-40 disabled:cursor-not-allowed",
      )}
    >
      <Flag className="w-3.5 h-3.5" />
      면접 종료
    </button>
  );
}

export default EndInterviewButton;
