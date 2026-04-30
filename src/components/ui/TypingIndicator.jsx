import { Bot } from "lucide-react";

/**
 * 면접관이 응답 생성 중일 때 표시되는 좌측 도트 애니메이션.
 */
function TypingIndicator() {
  return (
    <div className="flex gap-2 justify-start">
      <div className="shrink-0 w-7 h-7 rounded-full bg-sky-500/15 border border-sky-400/30 flex items-center justify-center">
        <Bot className="w-4 h-4 text-sky-300" />
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-slate-800/70 border border-slate-700 px-4 py-3 flex items-center gap-1">
        <Dot delay="0ms" />
        <Dot delay="150ms" />
        <Dot delay="300ms" />
      </div>
    </div>
  );
}

function Dot({ delay }) {
  return (
    <span
      className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
      style={{ animationDelay: delay }}
    />
  );
}

export default TypingIndicator;
