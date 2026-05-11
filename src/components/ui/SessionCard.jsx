import { Link } from "react-router-dom";
import clsx from "clsx";
import {
  Briefcase,
  Building2,
  GraduationCap,
  Trophy,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  PlayCircle,
  Clock,
} from "lucide-react";
import { STATUS_LABEL, formatDateTime } from "../../utils/sessionSummary";
import { SESSION_STATUS } from "../../constants/interview";

function SessionCard({ summary }) {
  const {
    id,
    jobRole,
    companyLabel,
    experienceLabel,
    techStack,
    status,
    startedAt,
    verdict,
    tone,
    finalScore,
  } = summary;

  return (
    <Link
      to={`/history/${id}`}
      className={clsx(
        "group block rounded-xl border bg-slate-900/50 p-4 transition hover:-translate-y-0.5",
        toneToBorder(tone),
      )}
    >
      {/* 상단 — 날짜 + 상태 배지 */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <span className="text-[11px] text-slate-500 inline-flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDateTime(startedAt)}
        </span>
        <StatusBadge status={status} tone={tone} />
      </div>

      {/* 직무 + 회사 */}
      <h3 className="text-base font-semibold text-slate-100 mb-1 truncate group-hover:text-sky-200 transition">
        {jobRole}
      </h3>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mb-3">
        <span className="inline-flex items-center gap-1">
          <Building2 className="w-3 h-3" />
          {companyLabel}
        </span>
        <span className="inline-flex items-center gap-1">
          <GraduationCap className="w-3 h-3" />
          {experienceLabel}
        </span>
      </div>

      {/* 기술 스택 */}
      {techStack.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {techStack.slice(0, 4).map((t) => (
            <span
              key={t}
              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/70 text-slate-400"
            >
              {t}
            </span>
          ))}
          {techStack.length > 4 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/40 text-slate-500">
              +{techStack.length - 4}
            </span>
          )}
        </div>
      )}

      {/* 하단 — verdict 또는 진행 안내 */}
      {status === SESSION_STATUS.COMPLETED && verdict ? (
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
          <span className="text-xs text-slate-300 truncate" title={verdict}>
            {verdict}
          </span>
          {typeof finalScore === "number" && (
            <span className="shrink-0 inline-flex items-center gap-1 text-xs text-amber-200">
              <Trophy className="w-3 h-3" />
              {finalScore}/10
            </span>
          )}
        </div>
      ) : status === SESSION_STATUS.IN_PROGRESS ? (
        <div className="pt-2 border-t border-slate-800">
          <span className="inline-flex items-center gap-1 text-xs text-sky-300">
            <PlayCircle className="w-3.5 h-3.5" />
            이어서 진행할 수 있어
          </span>
        </div>
      ) : (
        <div className="pt-2 border-t border-slate-800">
          <span className="text-xs text-slate-500">중단된 세션</span>
        </div>
      )}
    </Link>
  );
}

function StatusBadge({ status, tone }) {
  const { Icon } = badgeMeta(status, tone);
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px]",
        toneToBadge(tone),
      )}
    >
      <Icon className="w-3 h-3" />
      {STATUS_LABEL[status]}
    </span>
  );
}

function badgeMeta(status, tone) {
  if (status === SESSION_STATUS.IN_PROGRESS) return { Icon: PlayCircle };
  if (status === SESSION_STATUS.ABANDONED) return { Icon: XCircle };
  // completed
  if (tone === "success") return { Icon: CheckCircle2 };
  if (tone === "warning") return { Icon: AlertTriangle };
  if (tone === "danger") return { Icon: XCircle };
  return { Icon: CheckCircle2 };
}

function toneToBorder(tone) {
  switch (tone) {
    case "success":
      return "border-emerald-400/30 hover:border-emerald-400/60";
    case "warning":
      return "border-amber-400/30 hover:border-amber-400/60";
    case "danger":
      return "border-rose-400/30 hover:border-rose-400/60";
    case "progress":
      return "border-sky-400/30 hover:border-sky-400/60";
    default:
      return "border-slate-700 hover:border-slate-600";
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
    case "progress":
      return "border-sky-400/40 bg-sky-500/10 text-sky-100";
    default:
      return "border-slate-700 bg-slate-800/60 text-slate-300";
  }
}

export default SessionCard;
