import { useApiKey } from "../hooks/useApiKey";
import ApiKeyForm from "../components/ui/ApiKeyForm";

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

        <section className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
          <h3 className="font-semibold text-slate-100 mb-1">면접 환경 선택</h3>
          <p className="text-sm text-slate-400">
            {loading
              ? "설정 불러오는 중..."
              : apiKey
                ? "🚧 Step 5에서 직무·회사 타입·기술 스택 폼이 들어올 자리야."
                : "먼저 위에서 API 키를 등록해줘. 등록되면 이 영역이 활성화돼."}
          </p>
        </section>
      </div>
    </div>
  );
}

export default SetupPage;
