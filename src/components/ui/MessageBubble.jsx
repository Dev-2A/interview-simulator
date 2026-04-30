import clsx from "clsx";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, User2, MessageCircleQuestion, GraduationCap } from "lucide-react";
import { MESSAGE_TYPE } from "../../constants/interview";

/**
 * 면접 메시지 1건을 말풍선 형태로 표시한다.
 * - 면접관(좌측): 아바타 + 회색 말풍선
 * - 지원자(우측): 우측 정렬 + 하늘색 말풍선
 * - 질문/꼬리질문은 작은 라벨(QUESTION / FOLLOW-UP)을 함께 노출
 */
function MessageBubble({ bubble }) {
  if (bubble.kind === "feedback") {
    return <FeedbackBubble feedback={bubble.feedback} />;
  }

  const isLeft = bubble.side === "left";
  const label = labelOf(bubble.type);

  return (
    <div
      className={clsx("flex gap-2", isLeft ? "justify-start" : "justify-end")}
    >
      {isLeft && (
        <div className="shrink-0 w-7 h-7 rounded-full bg-sky-500/15 border border-sky-400/30 flex items-center justify-center">
          <Bot className="w-4 h-4 text-sky-300" />
        </div>
      )}

      <div
        className={clsx(
          "max-w-[78%] flex flex-col",
          isLeft ? "items-start" : "items-end",
        )}
      >
        {label && (
          <span
            className={clsx(
              "text-[10px] uppercase tracking-wider mb-1",
              isLeft ? "text-sky-300/70" : "text-slate-500",
            )}
          >
            {label}
          </span>
        )}
        <div
          className={clsx(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
            isLeft
              ? "bg-slate-800/70 border border-slate-700 text-slate-100 rounded-tl-sm"
              : "bg-sky-500/15 border border-sky-400/30 text-sky-50 rounded-tr-sm",
          )}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {bubble.content}
          </ReactMarkdown>
        </div>
      </div>

      {!isLeft && (
        <div className="shrink-0 w-7 h-7 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center">
          <User2 className="w-4 h-4 text-slate-200" />
        </div>
      )}
    </div>
  );
}

/**
 * 피드백 카드 — 강점/약점/점수를 분리해 시각적으로 강조.
 */
function FeedbackBubble({ feedback }) {
  const { strengths, weaknesses, score } = feedback;

  return (
    <div className="flex gap-2 justify-start">
      <div className="shrink-0 w-7 h-7 rounded-full bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center">
        <GraduationCap className="w-4 h-4 text-emerald-300" />
      </div>
      <div className="max-w-[78%] w-full">
        <span className="text-[10px] uppercase tracking-wider text-emerald-300/70 mb-1 block">
          Feedback
        </span>
        <div className="rounded-2xl rounded-tl-sm border border-emerald-400/20 bg-emerald-500/5 p-4 space-y-3">
          {typeof score === "number" && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-200/80">Score</span>
              <ScoreBar score={score} />
              <span className="text-xs font-mono text-emerald-100">
                {score}/10
              </span>
            </div>
          )}
          {strengths && (
            <div>
              <div className="text-xs text-emerald-300/80 mb-1">👍 강점</div>
              <p className="text-sm text-slate-100 leading-relaxed">
                {strengths}
              </p>
            </div>
          )}
          {weaknesses && (
            <div>
              <div className="text-xs text-amber-300/80 mb-1">🤔 보완할 점</div>
              <p className="text-sm text-slate-100 leading-relaxed">
                {weaknesses}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ score }) {
  const pct = Math.max(0, Math.min(100, (score / 10) * 100));
  const color =
    score >= 8
      ? "bg-emerald-400"
      : score >= 5
        ? "bg-sky-400"
        : score >= 3
          ? "bg-amber-400"
          : "bg-rose-400";
  return (
    <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
      <div
        className={clsx("h-full transition-all", color)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function labelOf(type) {
  switch (type) {
    case MESSAGE_TYPE.OPENING:
      return "Opening";
    case MESSAGE_TYPE.QUESTION:
      return "Question";
    case MESSAGE_TYPE.FOLLOW_UP:
      return "Follow-up";
    case MESSAGE_TYPE.ANSWER:
      return "Your answer";
    case MESSAGE_TYPE.CLOSING:
      return "Closing";
    default:
      return null;
  }
}

const markdownComponents = {
  // 답변·질문 안의 마크다운은 가볍게만 스타일
  code: ({ inline, children, ...props }) =>
    inline ? (
      <code
        className="px-1 py-0.5 rounded bg-slate-900/70 text-sky-200 text-[0.85em]"
        {...props}
      >
        {children}
      </code>
    ) : (
      <pre className="my-2 p-2 rounded bg-slate-950/70 overflow-x-auto text-[0.85em]">
        <code {...props}>{children}</code>
      </pre>
    ),
  a: (props) => (
    <a
      {...props}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sky-300 underline underline-offset-2 hover:text-sky-200"
    />
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-5 my-1 space-y-0.5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-5 my-1 space-y-0.5">{children}</ol>
  ),
};

export default MessageBubble;
