import { useEffect, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  GraduationCap,
  Code2,
  AlertTriangle,
  KeyRound,
  X,
  Lock,
} from "lucide-react";

import { useApiKey } from "../hooks/useApiKey";
import { useInterview } from "../hooks/useInterview";
import { useToast } from "../components/ui/ToastContext";
import {
  COMPANY_TYPES,
  EXPERIENCE_LEVELS,
  SESSION_STATUS,
} from "../constants/interview";
import { toUiBubbles } from "../utils/messageAdapter";
import { parseRetrospective } from "../utils/retrospective";

import MessageBubble from "../components/ui/MessageBubble";
import TypingIndicator from "../components/ui/TypingIndicator";
import AnswerComposer from "../components/ui/AnswerComposer";
import ScoreBadge from "../components/ui/ScoreBadge";
import RetrospectiveCard from "../components/ui/RetrospectiveCard";
import EndInterviewButton from "../components/ui/EndInterviewButton";
import QuestionDebugPanel from "../components/ui/QuestionDebugPanel";

function InterviewPage() {
  const [params] = useSearchParams();
  const sessionId = Number(params.get("id"));
  const toast = useToast();

  const { apiKey, model, loading: keyLoading } = useApiKey();
  const {
    session,
    messages,
    loading,
    thinking,
    error,
    notFound,
    stats,
    submit,
    rollbackLast,
    wrapUp,
    dismissError,
  } = useInterview({ sessionId, apiKey, model });

  const composerRef = useRef(null);
  const scrollRef = useRef(null);

  // 자동 스크롤
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, thinking]);

  // 회고가 새로 생성되면 페이지 최상단으로 부드럽게 스크롤
  const retrospective = useMemo(
    () => parseRetrospective(session?.retrospective),
    [session?.retrospective],
  );
  useEffect(() => {
    if (retrospective) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [retrospective]);

  // ─── 화면 분기 ──────────────────────────────────────────
  if (keyLoading || loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-slate-400 text-sm">
        세션 불러오는 중...
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6 flex items-start gap-3">
          <KeyRound className="w-5 h-5 text-amber-300 mt-0.5 shrink-0" />
          <div>
            <h2 className="text-amber-100 font-medium">API 키 등록이 필요해</h2>
            <p className="text-sm text-amber-200/80 mt-1">
              <Link
                to="/setup"
                className="underline underline-offset-2 hover:text-amber-100"
              >
                설정 페이지
              </Link>
              에서 Anthropic API 키를 먼저 등록해줘.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !session) {
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
            to="/setup"
            className="inline-flex items-center gap-1.5 text-sm text-sky-400 hover:text-sky-300"
          >
            <ArrowLeft className="w-4 h-4" />새 세션 시작하기
          </Link>
        </div>
      </div>
    );
  }

  // ─── 본 화면 ────────────────────────────────────────────
  const bubbles = toUiBubbles(messages);
  const isLocked = session.status !== SESSION_STATUS.IN_PROGRESS;
  const canRollback = bubbles.some((b) => b.type === "answer");

  const handleRollback = async () => {
    const result = await rollbackLast();
    if (!result.ok) {
      toast.info(result.reason);
      return;
    }
    composerRef.current?.setText(result.restoredText);
    toast.info("마지막 답변을 되돌렸어. 수정 후 다시 보내줘.");
  };

  const handleWrapUp = async () => {
    const result = await wrapUp();
    if (!result.ok) {
      if (result.reason === "aborted") return;
      toast.error(result.reason);
      return;
    }
    toast.success("회고가 생성됐어. 수고했어! 💙");
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-7rem)] min-h-125">
      <SessionHeader
        session={session}
        stats={stats}
        onWrapUp={handleWrapUp}
        thinking={thinking}
        canEnd={!isLocked && bubbles.some((b) => b.type === "answer")}
      />

      {/* 회고가 있으면 메시지 영역 위에 카드 형태로 고정 노출 */}
      {retrospective && (
        <div className="mb-4">
          <RetrospectiveCard retrospective={retrospective} />
        </div>
      )}

      {/* 메시지 영역 */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-5"
      >
        {bubbles.length === 0 && !thinking && !error && (
          <div className="h-full flex items-center justify-center text-sm text-slate-500">
            면접관이 곧 첫 인사를 건넬 거야...
          </div>
        )}

        {bubbles.map((b) => (
          <MessageBubble key={b.id} bubble={b} />
        ))}

        {thinking && <TypingIndicator />}

        {error && (
          <div className="rounded-md border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-xs text-rose-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="font-medium">{summarizeError(error)}</div>
              <div className="opacity-80">{error}</div>
            </div>
            <button
              type="button"
              onClick={dismissError}
              className="text-rose-300/70 hover:text-rose-200 transition shrink-0"
              aria-label="에러 메시지 닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 입력 영역 */}
      <div className="mt-4">
        {isLocked ? (
          <LockedComposer status={session.status} />
        ) : (
          <AnswerComposer
            ref={composerRef}
            onSubmit={submit}
            onRollback={handleRollback}
            canRollback={canRollback}
            thinking={thinking}
            disabled={isLocked}
          />
        )}
      </div>

      <QuestionDebugPanel sessionId={session.id} refreshKey={messages.length} />
    </div>
  );
}

// 종료된 세션의 입력창 자리에 들어가는 잠금 안내
function LockedComposer({ status }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 flex items-center gap-2 text-sm text-slate-400">
      <Lock className="w-4 h-4 text-slate-500" />
      {status === SESSION_STATUS.COMPLETED
        ? "면접이 종료됐어. 회고는 위쪽 카드에서 확인할 수 있어."
        : "이 세션은 중단된 상태야."}
    </div>
  );
}

function summarizeError(message) {
  if (!message) return "";
  if (message.includes("인증 실패")) return "인증 오류";
  if (message.includes("요청 한도")) return "요청 한도 초과";
  if (message.includes("JSON")) return "응답 파싱 실패";
  if (message.includes("형식이 예상과")) return "응답 형식 오류";
  if (message.includes("답변이") || message.includes("단답"))
    return "답변 검증";
  if (message.includes("회고")) return "회고 생성 실패";
  return "면접관 호출 실패";
}

// ─── 세션 헤더 ───────────────────────────────────────────────
function SessionHeader({ session, stats, onWrapUp, thinking, canEnd }) {
  const companyLabel = useMemo(
    () =>
      COMPANY_TYPES.find((c) => c.id === session.companyType)?.label ??
      session.companyType,
    [session.companyType],
  );
  const expLabel = useMemo(
    () =>
      EXPERIENCE_LEVELS.find((e) => e.id === session.experienceLevel)?.label ??
      "—",
    [session.experienceLevel],
  );

  const inProgress = session.status === SESSION_STATUS.IN_PROGRESS;

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 mb-4 shrink-0">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="text-[11px] text-slate-500">
          Session #{session.id} · {new Date(session.startedAt).toLocaleString()}
        </div>
        <div className="flex items-center gap-2">
          <ScoreBadge stats={stats} />
          {inProgress && (
            <EndInterviewButton
              onConfirm={onWrapUp}
              thinking={thinking}
              disabled={!canEnd}
            />
          )}
        </div>
      </div>
      <div className="grid sm:grid-cols-4 gap-3 text-sm">
        <InfoRow icon={Briefcase} label="직무" value={session.jobRole} />
        <InfoRow icon={Building2} label="회사 타입" value={companyLabel} />
        <InfoRow icon={GraduationCap} label="경력" value={expLabel} />
        <InfoRow
          icon={Code2}
          label="기술 스택"
          value={session.techStack?.join(", ") || "—"}
        />
      </div>
    </section>
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

export default InterviewPage;
