import { Link } from "react-router-dom";
import { Sparkles, History, KeyRound } from "lucide-react";
import { useApiKey } from "../hooks/useApiKey";

function HomePage() {
  const { apiKey, loading } = useApiKey();
  const hasKey = !loading && !!apiKey;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <section className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent">
          AI 면접관과 1:1 모의 면접
        </h2>
        <p className="mt-4 text-slate-400 leading-relaxed">
          직무 · 회사 타입 · 기술 스택을 설정하면 Claude가 면접관이 되어
          <br className="hidden sm:block" />
          질문 → 답변 → 피드백 → 꼬리 질문까지 진행해줘.
        </p>
      </section>

      {/* API 키 미등록 안내 배너 */}
      {!loading && !hasKey && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3">
          <KeyRound className="w-5 h-5 text-amber-300 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="text-amber-100 font-medium">API 키 등록이 필요해</p>
            <p className="text-amber-200/70 mt-0.5">
              이 도구는 BYOK 방식이야. 먼저{" "}
              <Link
                to="/setup"
                className="underline underline-offset-2 hover:text-amber-100"
              >
                설정 페이지
              </Link>
              에서 Anthropic API 키를 등록해줘.
            </p>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          to="/setup"
          className="group rounded-xl border border-slate-700 bg-slate-900/50 p-6 hover:border-sky-500/50 hover:bg-slate-900 transition"
        >
          <Sparkles className="w-7 h-7 text-sky-400 mb-3" />
          <h3 className="font-semibold text-slate-100">새 면접 시작</h3>
          <p className="mt-1 text-sm text-slate-400">
            직무와 회사 타입을 설정하고 Claude와 면접을 시작해
          </p>
        </Link>

        <Link
          to="/history"
          className="group rounded-xl border border-slate-700 bg-slate-900/50 p-6 hover:border-sky-500/50 hover:bg-slate-900 transition"
        >
          <History className="w-7 h-7 text-sky-400 mb-3" />
          <h3 className="font-semibold text-slate-100">지난 세션 보기</h3>
          <p className="mt-1 text-sm text-slate-400">
            완료된 면접 기록과 회고를 다시 열람해
          </p>
        </Link>
      </div>

      <p className="mt-12 text-center text-xs text-slate-500">
        💙 모든 데이터는 브라우저 IndexedDB에만 저장돼. 외부 서버로 전송되지
        않아.
      </p>
    </div>
  );
}

export default HomePage;
