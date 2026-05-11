import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { Inbox, ListFilter, Sparkles } from "lucide-react";

import { listSessions } from "../services/sessionsRepo";
import { summarizeSession, STATUS_LABEL } from "../utils/sessionSummary";
import { SESSION_STATUS } from "../constants/interview";
import SessionCard from "../components/ui/SessionCard";

const FILTERS = [
  { id: "all", label: "전체" },
  {
    id: SESSION_STATUS.IN_PROGRESS,
    label: STATUS_LABEL[SESSION_STATUS.IN_PROGRESS],
  },
  {
    id: SESSION_STATUS.COMPLETED,
    label: STATUS_LABEL[SESSION_STATUS.COMPLETED],
  },
  {
    id: SESSION_STATUS.ABANDONED,
    label: STATUS_LABEL[SESSION_STATUS.ABANDONED],
  },
];

function HistoryPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await listSessions();
      if (cancelled) return;
      setSessions(list);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const summaries = useMemo(() => sessions.map(summarizeSession), [sessions]);

  const counts = useMemo(() => {
    const c = { all: summaries.length };
    for (const s of summaries) c[s.status] = (c[s.status] ?? 0) + 1;
    return c;
  }, [summaries]);

  const visible = useMemo(() => {
    if (filter === "all") return summaries;
    return summaries.filter((s) => s.status === filter);
  }, [summaries, filter]);

  // ─── 화면 ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-slate-400 text-sm">
        세션 목록 불러오는 중...
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <header className="mb-8">
          <h2 className="text-2xl font-bold text-slate-100 mb-2">
            세션 히스토리
          </h2>
          <p className="text-slate-400">아직 진행한 면접이 없어.</p>
        </header>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-slate-100 mb-2">
          세션 히스토리
        </h2>
        <p className="text-slate-400">
          지금까지 진행한 모든 면접 세션을 다시 열어볼 수 있어.
        </p>
      </header>

      {/* 필터 */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        <ListFilter className="w-4 h-4 text-slate-500 shrink-0" />
        {FILTERS.map((f) => {
          const count = counts[f.id] ?? 0;
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={clsx(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs whitespace-nowrap transition",
                active
                  ? "bg-sky-500/15 text-sky-100 border border-sky-400/40"
                  : "bg-slate-900/50 text-slate-400 border border-slate-700 hover:text-slate-200 hover:border-slate-600",
              )}
            >
              {f.label}
              <span
                className={clsx(
                  "rounded-full px-1.5 text-[10px]",
                  active ? "bg-sky-500/20" : "bg-slate-800/60",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 카드 그리드 */}
      {visible.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-12 text-center text-sm text-slate-500">
          이 상태의 세션이 없어.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {visible.map((s) => (
            <SessionCard key={s.id} summary={s} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-10 text-center">
      <Inbox className="w-10 h-10 text-slate-500 mx-auto mb-3" />
      <p className="text-slate-300 mb-1">아직 빈 서랍이야.</p>
      <p className="text-sm text-slate-500 mb-6">
        첫 면접을 시작하면 여기에 기록이 쌓여.
      </p>
      <Link
        to="/setup"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-sky-500 text-slate-950 hover:bg-sky-400 text-sm font-medium transition"
      >
        <Sparkles className="w-4 h-4" />새 면접 시작
      </Link>
    </div>
  );
}

export default HistoryPage;
