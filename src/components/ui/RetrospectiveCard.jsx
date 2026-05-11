import clsx from "clsx";
import {
  ScrollText,
  ThumbsUp,
  Lightbulb,
  Trophy,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { verdictTone } from "../../utils/retrospective";

/**
 * 면접 회고 카드.
 *
 * - 전체 평가(overall)
 * - 강점 3개 / 개선점 3개
 * - 최종 verdict (톤에 따른 색상 매핑)
 * - 평균 점수 스냅샷
 *
 * Step 12 (히스토리)에서도 동일한 컴포넌트를 재사용한다.
 */
function RetrospectiveCard({ retrospective, defaultExpanded = true }) {
  if (!retrospective) return null;

  const { overall, strengths, improvements, verdict, finalScore } =
    retrospective;
  const tone = verdictTone(verdict);

  return (
    <section
      className={clsx("rounded-xl border p-5 space-y-5", toneToBg(tone))}
      open={defaultExpanded || undefined}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-slate-200" />
          <h3 className="font-semibold text-slate-100">면접 회고</h3>
        </div>
        <VerdictBadge verdict={verdict} tone={tone} />
      </header>

      {typeof finalScore === "number" && (
        <div className="flex items-center gap-2 text-sm">
          <Trophy className="w-4 h-4 text-amber-300" />
          <span className="text-slate-300">답변 평균</span>
          <span className="font-mono text-slate-100">{finalScore}/10</span>
        </div>
      )}

      {overall && (
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">
            Overall
          </div>
          <p className="text-sm text-slate-100 leading-relaxed whitespace-pre-wrap">
            {overall}
          </p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <BulletBlock
          icon={ThumbsUp}
          title="강점"
          items={strengths}
          itemClass="text-emerald-100"
          iconClass="text-emerald-300"
        />
        <BulletBlock
          icon={Lightbulb}
          title="개선점"
          items={improvements}
          itemClass="text-amber-100"
          iconClass="text-amber-300"
        />
      </div>
    </section>
  );
}

function BulletBlock({ icon: Icon, title, items, itemClass, iconClass }) {
  return (
    <div>
      <div
        className={clsx(
          "flex items-center gap-1.5 text-xs uppercase tracking-wider mb-2",
          iconClass,
        )}
      >
        <Icon className="w-3.5 h-3.5" />
        {title}
      </div>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li
            key={i}
            className={clsx("text-sm leading-relaxed pl-3 relative", itemClass)}
          >
            <span className="absolute left-0 top-2 w-1 h-1 rounded-full bg-current opacity-60" />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

function VerdictBadge({ verdict, tone }) {
  const { Icon, label } = verdictMeta(tone);
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs",
        toneToBadge(tone),
      )}
      title={verdict}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="max-w-45 truncate">{verdict || label}</span>
    </span>
  );
}

function verdictMeta(tone) {
  if (tone === "success") return { Icon: CheckCircle2, label: "Pass" };
  if (tone === "warning") return { Icon: AlertTriangle, label: "Borderline" };
  if (tone === "danger") return { Icon: XCircle, label: "Not yet" };
  return { Icon: CheckCircle2, label: "평가" };
}

function toneToBg(tone) {
  switch (tone) {
    case "success":
      return "border-emerald-400/30 bg-emerald-500/5";
    case "warning":
      return "border-amber-400/30 bg-amber-500/5";
    case "danger":
      return "border-rose-400/30 bg-rose-500/5";
    default:
      return "border-slate-700 bg-slate-900/40";
  }
}

function toneToBadge(tone) {
  switch (tone) {
    case "success":
      return "border-emerald-400/40 bg-emerald-500/10 text-emerald-100";
    case "warning":
      return "border-amber-400/40 bg-amber-500/10 text-amber-100";
    case "danger":
      return "border-rose-400/40 bg-rose-500/10 text-rose-100";
    default:
      return "border-slate-700 bg-slate-800/60 text-slate-200";
  }
}

export default RetrospectiveCard;
