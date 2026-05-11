import { useApiKey } from "../hooks/useApiKey";
import ApiKeyForm from "../components/ui/ApiKeyForm";
import InterviewSetupForm from "../components/ui/InterviewSetupForm";
import { Mic } from "lucide-react";
import { isSpeechSupported } from "../services/speech";

function SetupPage() {
  const { apiKey, loading } = useApiKey();

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h2 className="text-2xl font-bold text-slate-100 mb-2">면접 설정</h2>
      <p className="text-slate-400 mb-8">
        API 키 등록 → 직무·회사 타입·기술 스택 선택 → 면접 시작.
      </p>

      <div className="space-y-6">
        <ApiKeyForm />

        {loading ? (
          <section className="rounded-xl border border-slate-700 bg-slate-900/50 p-6 text-sm text-slate-500">
            설정 불러오는 중...
          </section>
        ) : apiKey ? (
          <InterviewSetupForm />
        ) : (
          <section className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
            <h3 className="font-semibold text-slate-100 mb-1">
              면접 환경 선택
            </h3>
            <p className="text-sm text-slate-400">
              먼저 위에서 API 키를 등록해줘. 등록되면 이 영역이 활성화돼.
            </p>
          </section>
        )}

        {isSpeechSupported() && (
          <section className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 flex items-start gap-3">
            <Mic className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
            <div className="text-xs text-slate-400 leading-relaxed">
              이 브라우저는 한국어 음성 입력을 지원해. 면접 화면의 마이크 버튼을
              누르면 말한 내용이 입력창에 자동으로 풀려서 들어가. 첫 사용 시
              마이크 권한 요청이 떠. — Firefox 등 일부 브라우저에서는 마이크
              버튼 자체가 숨겨져.
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default SetupPage;
