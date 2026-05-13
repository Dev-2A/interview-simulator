import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  GraduationCap,
  Code2,
  Trash2,
  PlayCircle,
  Clock,
  Flag,
  FileText,
} from "lucide-react";

import {
  deleteSessionWithMessages,
  getSession,
  abandonSession,
} from "../services/sessionsRepo";
import { listMessagesBySession } from "../services/messagesRepo";
import {
  summarizeSession,
  STATUS_LABEL,
  formatDateTime,
} from "../utils/sessionSummary";
import { SESSION_STATUS } from "../constants/interview";
import { toUiBubbles } from "../utils/messageAdapter";
import { useToast } from "../components/ui/ToastContext";

import RetrospectiveCard from "../components/ui/RetrospectiveCard";
import MessageBubble from "../components/ui/MessageBubble";
import ExportPanel from "../components/ui/ExportPanel";

import clsx from "clsx";

function HistoryDetailPage() {
  const { id } = useParams();
  const sessionId = Number(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!sessionId) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    (async () => {
      const [s, msgs] = await Promise.all([
        getSession(sessionId),
        listMessagesBySession(sessionId),
      ]);
      if (cancelled) return;

      if (!s) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setSession(s);
      setMessages(msgs);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const summary = useMemo(
    () => (session ? summarizeSession(session) : null),
    [session],
  );

  const bubbles = useMemo(() => toUiBubbles(messages), [messages]);

  // ─── 액션 ────────────────────────────────────────────────
  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteSessionWithMessages(sessionId);
      toast.success("세션이 삭제됐어.");
      navigate("/history", { replace: true });
    } catch (err) {
      console.error(err);
      toast.error("삭제에 실패했어.");
      setDeleting(false);
    }
  };

  const handleAbandon = async () => {
    if (!session) return;
    await abandonSession(session.id);
    const refreshed = await getSession(session.id);
    setSession(refreshed);
    toast.info('세션을 "중단" 상태로 처리했어.');
  };

  // ─── 화면 분기 ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-slate-400 text-sm">
        세션 불러오는 중...
      </div>
    );
  }

  if (notFound || !session || !summary) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-6">
          <h2 className="text-lg font-semibold text-rose-100 mb-2">
            세션을 찾을 수 없어
          </h2>
          <p className="text-sm text-rose-200/80 mb-4">
            URL이 잘못됐거나 삭제된 세션이야.
          </p>
          <Link
            to="/history"
            className="inline-flex items-center gap-1.5 text-sm text-sky-400 hover:text-sky-300"
          >
            <ArrowLeft className="w-4 h-4" />
            히스토리로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  // ─── 본 화면 ─────────────────────────────────────────────
  const isInProgress = session.status === SESSION_STATUS.IN_PROGRESS;
  const completedAt = session.endedAt;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* 상단 — 돌아가기 */}
      <Link
        to="/history"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        히스토리로
      </Link>

      {/* 세션 컨텍스트 */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] text-slate-500 inline-flex items-center gap-1">
            <Clock className="w-3 h-3" />
            시작 {formatDateTime(session.startedAt)}
            {completedAt && <> · 종료 {formatDateTime(completedAt)}</>}
          </div>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800/60">
            {STATUS_LABEL[session.status]}
          </span>
        </div>

        <h1 className="text-xl font-bold text-slate-100 mb-3">
          {session.jobRole}
        </h1>

        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          <InfoRow
            icon={Building2}
            label="회사 타입"
            value={summary.companyLabel}
          />
          <InfoRow
            icon={GraduationCap}
            label="경력"
            value={summary.experienceLabel}
          />
          <InfoRow
            icon={Code2}
            label="기술 스택"
            value={session.techStack?.join(", ") || "—"}
          />
        </div>

        {/* 액션 */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-slate-800">
          {isInProgress && (
            <Link
              to={`/interview?id=${session.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-sky-500 text-slate-950 hover:bg-sky-400 transition"
            >
              <PlayCircle className="w-4 h-4" />
              이어서 진행하기
            </Link>
          )}
          {isInProgress && (
            <button
              type="button"
              onClick={handleAbandon}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs border border-slate-700 bg-slate-900/60 text-slate-300 hover:border-amber-400/50 hover:text-amber-200 hover:bg-amber-500/5 transition"
            >
              <Flag className="w-3.5 h-3.5" />
              중단 처리
            </button>
          )}

          {/* Markdown 내보내기 — 메시지가 있을 때만 의미 있음 */}
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => setExportOpen((v) => !v)}
              className={clsx(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition border",
                exportOpen
                  ? "border-sky-400/60 bg-sky-500/10 text-sky-100"
                  : "border-slate-700 bg-slate-900/60 text-slate-300 hover:border-sky-400/50 hover:text-sky-200",
              )}
            >
              <FileText className="w-3.5 h-3.5" />
              {exportOpen ? "내보내기 닫기" : "Markdown 내보내기"}
            </button>
          )}

          {!deleteArmed ? (
            <button
              type="button"
              onClick={() => setDeleteArmed(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs border border-slate-700 bg-slate-900/60 text-slate-300 hover:border-rose-400/50 hover:text-rose-200 hover:bg-rose-500/5 transition ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              세션 삭제
            </button>
          ) : (
            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 rounded-md text-xs font-medium px-3 py-1.5 bg-rose-500/80 text-slate-50 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deleting ? "삭제 중..." : "정말 삭제할게"}
              </button>
              {!deleting && (
                <button
                  type="button"
                  onClick={() => setDeleteArmed(false)}
                  className="px-2 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
                >
                  취소
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 회고 */}
      {summary.retro && <RetrospectiveCard retrospective={summary.retro} />}

      {/* Markdown 내보내기 패널 */}
      {exportOpen && (
        <ExportPanel
          session={session}
          messages={messages}
          onClose={() => setExportOpen(false)}
        />
      )}

      {/* 전체 대화 */}
      <section>
        <h3 className="text-sm font-semibold text-slate-300 mb-3">
          전체 대화 ({bubbles.length})
        </h3>
        {bubbles.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-8 text-center text-sm text-slate-500">
            대화 기록이 없어.
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-5">
            {bubbles.map((b) => (
              <MessageBubble key={b.id} bubble={b} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2 min-w-0">
      <Icon className="w-4 h-4 mt-0.5 text-sky-400 shrink-0" />
      <div className="min-w-0">
        <div className="text-[11px] text-slate-500">{label}</div>
        <div className="text-slate-200 truncate">{value}</div>
      </div>
    </div>
  );
}

export default HistoryDetailPage;
