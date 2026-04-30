import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  GraduationCap,
  Code2,
} from "lucide-react";
import { getSession } from "../services/sessionsRepo";
import { COMPANY_TYPES, EXPERIENCE_LEVELS } from "../constants/interview";

function InterviewPage() {
  const [params] = useSearchParams();
  const sessionId = Number(params.get("id"));

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!sessionId) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    (async () => {
      const s = await getSession(sessionId);
      if (cancelled) return;
      if (!s) setNotFound(true);
      setSession(s ?? null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-slate-400 text-sm">
        세션 불러오는 중...
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

  const companyLabel =
    COMPANY_TYPES.find((c) => c.id === session.companyType)?.label ??
    session.companyType;
  const expLabel =
    EXPERIENCE_LEVELS.find((e) => e.id === session.experienceLevel)?.label ??
    "—";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* 세션 컨텍스트 카드 */}
      <section className="rounded-xl border border-slate-700 bg-slate-900/50 p-5 mb-6">
        <div className="text-xs text-slate-500 mb-2">
          Session #{session.id} · {new Date(session.startedAt).toLocaleString()}
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <InfoRow icon={Briefcase} label="직무" value={session.jobRole} />
          <InfoRow icon={Building2} label="회사 타입" value={companyLabel} />
          <InfoRow icon={GraduationCap} label="경력 수준" value={expLabel} />
          <InfoRow
            icon={Code2}
            label="기술 스택"
            value={session.techStack?.join(", ") || "—"}
          />
        </div>
      </section>

      {/* placeholder */}
      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-8 text-center text-slate-500 text-sm">
        🚧 Step 6 (Claude 클라이언트) → Step 7 (메시지 UI)에서 면접 대화 영역이
        들어올 자리야.
        <br />
        세션 정보는 위에 정상 저장돼 있어. 다음 단계에서 이 데이터를 시스템
        프롬프트에 주입할 거야.
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 mt-0.5 text-sky-400 shrink-0" />
      <div className="min-w-0">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-slate-200 truncate">{value}</div>
      </div>
    </div>
  );
}

export default InterviewPage;
