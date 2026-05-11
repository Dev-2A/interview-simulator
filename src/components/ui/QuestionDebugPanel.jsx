import { useEffect, useState } from "react";
import clsx from "clsx";
import { Bug, ChevronDown, ChevronUp } from "lucide-react";
import {
  listQuestionsBySession,
  listQuestionsForGuard,
} from "../../services/messagesRepo";

/**
 * 개발 모드에서만 노출되는 질문 히스토리 디버그 패널.
 * - 이번 세션에서 면접관이 던진 질문 목록
 * - guard 컨텍스트(이번 세션 + 최근 5개 세션)에 들어가는 질문 총합
 *
 * messages가 바뀔 때마다 자동 갱신.
 */
function QuestionDebugPanel({ sessionId, refreshKey }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState([]);
  const [guardAll, setGuardAll] = useState([]);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    (async () => {
      const [c, g] = await Promise.all([
        listQuestionsBySession(sessionId),
        listQuestionsForGuard(sessionId),
      ]);
      if (cancelled) return;
      setCurrent(c);
      setGuardAll(g);
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, refreshKey]);

  if (!import.meta.env.DEV) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm w-[320px] rounded-lg border border-slate-700 bg-slate-950/90 backdrop-blur shadow-xl text-xs">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          "w-full flex items-center justify-between px-3 py-2 rounded-t-lg",
          "text-slate-300 hover:bg-slate-900 transition",
        )}
      >
        <span className="inline-flex items-center gap-1.5">
          <Bug className="w-3.5 h-3.5 text-amber-400" />
          질문 가드 디버그
          <span className="text-slate-500">
            ({current.length} 이번 / {guardAll.length} 가드)
          </span>
        </span>
        {open ? (
          <ChevronDown className="w-3.5 h-3.5" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5" />
        )}
      </button>

      {open && (
        <div className="border-t border-slate-800 p-3 max-h-[40vh] overflow-y-auto space-y-3">
          <Section
            title={`이번 세션 (${current.length})`}
            items={current}
            tone="sky"
          />
          <Section
            title={`가드 컨텍스트 합산 (${guardAll.length})`}
            items={guardAll}
            tone="amber"
          />
          <p className="text-[10px] text-slate-500 leading-relaxed">
            💡 가드 컨텍스트가 시스템 프롬프트에 주입돼 LLM이 같은 질문을
            피하도록 유도해. 그래도 비슷하게 나오면 응답 후 자동 재요청으로 1회
            갱신을 시도해.
          </p>
        </div>
      )}
    </div>
  );
}

function Section({ title, items, tone }) {
  const labelColor = tone === "sky" ? "text-sky-300" : "text-amber-300";

  return (
    <div>
      <div
        className={clsx(
          "text-[10px] uppercase tracking-wider mb-1",
          labelColor,
        )}
      >
        {title}
      </div>
      {items.length === 0 ? (
        <div className="text-slate-500 text-[11px] italic">없음</div>
      ) : (
        <ol className="list-decimal pl-4 space-y-0.5 text-slate-300">
          {items.map((q, i) => (
            <li key={i} className="leading-snug wrap-break-words">
              {q}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default QuestionDebugPanel;
