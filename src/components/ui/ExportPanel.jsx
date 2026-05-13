import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import {
  Download,
  ClipboardCopy,
  ClipboardCheck,
  FileText,
  X,
} from "lucide-react";
import {
  buildSessionMarkdown,
  buildExportFilename,
  downloadMarkdown,
  copyToClipboard,
} from "../../utils/exportMarkdown";
import { useToast } from "./ToastContext";

/**
 * 면접 세션의 Markdown 내보내기 패널.
 * 상세 페이지 내부에서 토글로 열고 닫는다.
 */
function ExportPanel({ session, messages, onClose }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const markdown = useMemo(
    () => buildSessionMarkdown(session, messages),
    [session, messages],
  );
  const filename = useMemo(() => buildExportFilename(session), [session]);

  // 복사 표시는 잠깐만 띄운다
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  const handleCopy = async () => {
    const ok = await copyToClipboard(markdown);
    if (ok) {
      setCopied(true);
      toast.success("Markdown이 클립보드에 복사됐어.");
    } else {
      toast.error("복사에 실패했어. 미리보기에서 직접 선택해 복사해줘.");
    }
  };

  const handleDownload = () => {
    downloadMarkdown(filename, markdown);
    toast.success(`${filename} 다운로드 시작.`);
  };

  return (
    <section className="rounded-xl border border-sky-400/30 bg-sky-500/5 p-5 space-y-4">
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-sky-300" />
          <h3 className="text-sm font-semibold text-sky-100">
            Markdown 내보내기
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 transition"
          aria-label="내보내기 패널 닫기"
        >
          <X className="w-4 h-4" />
        </button>
      </header>

      {/* 메타 정보 + 액션 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-400">
          파일명:{" "}
          <code className="px-1.5 py-0.5 rounded bg-slate-900/60 text-slate-200">
            {filename}
          </code>
          <span className="ml-2 text-slate-500">
            {markdown.length.toLocaleString()}자
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className={clsx(
              "inline-flex items-center gap-1.5 rounded-md text-xs font-medium px-3 py-1.5 border transition",
              copied
                ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-100"
                : "border-slate-700 bg-slate-900/60 text-slate-200 hover:border-sky-400/50 hover:text-sky-100",
            )}
          >
            {copied ? (
              <>
                <ClipboardCheck className="w-3.5 h-3.5" />
                복사 완료
              </>
            ) : (
              <>
                <ClipboardCopy className="w-3.5 h-3.5" />
                클립보드 복사
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 rounded-md text-xs font-medium px-3 py-1.5 bg-sky-500 text-slate-950 hover:bg-sky-400 transition"
          >
            <Download className="w-3.5 h-3.5" />
            .md 다운로드
          </button>
        </div>
      </div>

      {/* 미리보기 */}
      <div>
        <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-1">
          미리보기
        </div>
        <pre
          className="max-h-105 overflow-auto rounded-md border border-slate-800 bg-slate-950/70 p-3 text-xs leading-relaxed text-slate-200 whitespace-pre-wrap wrap-break-words"
          // 사용자가 직접 드래그해서 복사할 수 있도록 셀렉트 허용
        >
          {markdown}
        </pre>
      </div>
    </section>
  );
}

export default ExportPanel;
