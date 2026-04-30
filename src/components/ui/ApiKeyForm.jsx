import { useState } from "react";
import {
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  Trash2,
  Loader2,
} from "lucide-react";
import clsx from "clsx";
import { useApiKey, maskApiKey } from "../../hooks/useApiKey";
import { verifyApiKey } from "../../services/claudeClient";
import { CLAUDE_MODELS } from "../../constants/settings";
import { useToast } from "./ToastContext";

function ApiKeyForm() {
  const { apiKey, model, loading, saveKey, clearKey, changeModel } =
    useApiKey();
  const toast = useToast();

  const [input, setInput] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [verifying, setVerifying] = useState(false);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6 flex items-center gap-2 text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        설정 불러오는 중...
      </div>
    );
  }

  // ─── 키가 이미 저장된 상태 ─────────────────────────────────
  if (apiKey) {
    return (
      <section className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h3 className="font-semibold text-emerald-100">API 키 등록 완료</h3>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-2 text-slate-300">
            <span className="text-slate-400">키:</span>
            <code className="px-2 py-0.5 rounded bg-slate-800/70 text-slate-200">
              {maskApiKey(apiKey)}
            </code>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-slate-300">
            <span className="text-slate-400">사용 모델:</span>
            <select
              value={model}
              onChange={async (e) => {
                await changeModel(e.target.value);
                toast.success("모델이 변경됐어.");
              }}
              className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
            >
              {CLAUDE_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={async () => {
            if (!confirm("저장된 API 키를 삭제할까? 이 동작은 되돌릴 수 없어."))
              return;
            await clearKey();
            toast.info("API 키가 삭제됐어.");
          }}
          className="mt-5 inline-flex items-center gap-1.5 text-xs text-rose-300 hover:text-rose-200 transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
          저장된 API 키 삭제
        </button>
      </section>
    );
  }

  // ─── 키 입력 폼 ────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) {
      toast.error("API 키를 입력해줘.");
      return;
    }

    setVerifying(true);
    const result = await verifyApiKey(trimmed);
    setVerifying(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    await saveKey(trimmed);
    setInput("");
    toast.success("API 키가 저장됐어.\n이제 면접 설정으로 넘어갈 수 있어.");
  };

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
      <div className="flex items-center gap-2 mb-1">
        <KeyRound className="w-5 h-5 text-sky-400" />
        <h3 className="font-semibold text-slate-100">Anthropic API 키 등록</h3>
      </div>
      <p className="text-sm text-slate-400 mb-5">
        이 도구는 BYOK(Bring Your Own Key) 방식이야. 입력한 키는 브라우저
        IndexedDB에만 저장되며 외부 서버로 전송되지 않아.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <input
            type={showInput ? "text" : "password"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="sk-ant-api03-..."
            autoComplete="off"
            spellCheck={false}
            className="w-full bg-slate-950/60 border border-slate-700 rounded-md px-3 py-2 pr-10 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/40"
          />
          <button
            type="button"
            onClick={() => setShowInput((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
            aria-label={showInput ? "키 가리기" : "키 보이기"}
          >
            {showInput ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>

        <button
          type="submit"
          disabled={verifying}
          className={clsx(
            "inline-flex items-center justify-center gap-1.5 w-full sm:w-auto px-5 py-2 rounded-md text-sm font-medium transition",
            "bg-sky-500 text-slate-950 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          {verifying && <Loader2 className="w-4 h-4 animate-spin" />}
          {verifying ? "검증 중..." : "검증하고 저장"}
        </button>
      </form>

      <p className="mt-5 text-xs text-slate-500">
        키가 없으면{" "}
        <a
          href="https://console.anthropic.com/settings/keys"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-400 hover:text-sky-300 underline underline-offset-2"
        >
          Anthropic Console
        </a>
        에서 발급받을 수 있어.
      </p>
    </section>
  );
}

export default ApiKeyForm;
