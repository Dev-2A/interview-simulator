import clsx from "clsx";
import { Trophy } from "lucide-react";

/**
 * 면접 진행 중 누적 점수 배지.
 * - 답변이 0개면 표시되지 않음 (null 반환)
 */
function ScoreBadge({ stats }) {
  if (!stats || stats.count === 0) return null;

  const tone =
    stats.avg >= 8
      ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
      : stats.avg >= 5
        ? "border-sky-400/40 bg-sky-500/10 text-sky-100"
        : stats.avg >= 3
          ? "border-amber-400/40 bg-amber-500/10 text-amber-100"
          : "border-rose-400/40 bg-rose-500/10 text-rose-100";

  return (
    <div
      className={clsx(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs",
        tone,
      )}
      title={`답변 ${stats.count}개의 평균 점수`}
    >
      <Trophy className="w-3.5 h-3.5" />
      <span className="font-mono">평균 {stats.avg}/10</span>
      <span className="text-[10px] opacity-70">· 답변 {stats.count}개</span>
    </div>
  );
}

export default ScoreBadge;
