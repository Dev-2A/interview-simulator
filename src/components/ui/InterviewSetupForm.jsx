import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { Sparkles, X } from "lucide-react";
import {
  JOB_ROLES,
  COMPANY_TYPES,
  TECH_STACK_PRESETS,
  EXPERIENCE_LEVELS,
  DEFAULT_EXPERIENCE,
} from "../../constants/interview";
import { createSession } from "../../services/sessionsRepo";
import Chip from "./Chip";
import { useToast } from "./ToastContext";

const MAX_TECH_STACK = 10;

function InterviewSetupForm() {
  const navigate = useNavigate();
  const toast = useToast();

  const [jobRole, setJobRole] = useState("");
  const [companyType, setCompanyType] = useState(COMPANY_TYPES[0].id);
  const [experienceLevel, setExperienceLevel] = useState(DEFAULT_EXPERIENCE);
  const [techStack, setTechStack] = useState([]);
  const [customTech, setCustomTech] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const allPresetTechs = useMemo(
    () => Object.values(TECH_STACK_PRESETS).flat(),
    [],
  );

  const toggleTech = (name) => {
    setTechStack((prev) => {
      if (prev.includes(name)) return prev.filter((t) => t !== name);
      if (prev.length >= MAX_TECH_STACK) {
        toast.error(`기술 스택은 최대 ${MAX_TECH_STACK}개까지 선택할 수 있어.`);
        return prev;
      }
      return [...prev, name];
    });
  };

  const addCustomTech = () => {
    const name = customTech.trim();
    if (!name) return;
    if (techStack.includes(name)) {
      toast.info("이미 추가된 항목이야.");
      setCustomTech("");
      return;
    }
    if (techStack.length >= MAX_TECH_STACK) {
      toast.error(`기술 스택은 최대 ${MAX_TECH_STACK}개까지 선택할 수 있어.`);
      return;
    }
    setTechStack((prev) => [...prev, name]);
    setCustomTech("");
  };

  const removeTech = (name) => {
    setTechStack((prev) => prev.filter((t) => t !== name));
  };

  const canSubmit =
    jobRole.trim().length > 0 &&
    companyType &&
    experienceLevel &&
    techStack.length > 0 &&
    !submitting;

  const handleStart = async () => {
    if (!canSubmit) return;
    try {
      setSubmitting(true);
      const id = await createSession({
        jobRole: jobRole.trim(),
        companyType,
        experienceLevel,
        techStack,
      });
      toast.success("면접 세션이 시작됐어. 행운을 빌어! 🎭");
      navigate(`/interview?id=${id}`);
    } catch (err) {
      console.error(err);
      toast.error("세션 생성에 실패했어. 잠시 후 다시 시도해줘.");
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/50 p-6 space-y-8">
      <header>
        <h3 className="font-semibold text-slate-100">면접 환경 선택</h3>
        <p className="text-sm text-slate-400 mt-1">
          입력한 정보를 바탕으로 Claude가 그에 맞는 면접관 페르소나를 만들어.
        </p>
      </header>

      {/* ─── 직무 ─────────────────────────── */}
      <div>
        <label className="block text-sm font-medium text-slate-200 mb-2">
          직무 <span className="text-rose-400">*</span>
        </label>
        <input
          type="text"
          value={jobRole}
          onChange={(e) => setJobRole(e.target.value)}
          placeholder="예: 백엔드 개발자, AI/ML 엔지니어, 데이터 분석가..."
          className="w-full bg-slate-950/60 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/40"
        />
        <div className="flex flex-wrap gap-1.5 mt-2">
          {JOB_ROLES.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setJobRole(role)}
              className={clsx(
                "text-xs px-2 py-0.5 rounded transition",
                jobRole === role
                  ? "bg-sky-500/20 text-sky-200"
                  : "bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200",
              )}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* ─── 회사 타입 ───────────────────────── */}
      <div>
        <label className="block text-sm font-medium text-slate-200 mb-2">
          회사 타입 <span className="text-rose-400">*</span>
        </label>
        <div className="grid sm:grid-cols-2 gap-2">
          {COMPANY_TYPES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCompanyType(c.id)}
              className={clsx(
                "text-left rounded-md border px-3 py-2 transition",
                companyType === c.id
                  ? "border-sky-400/60 bg-sky-500/10"
                  : "border-slate-700 bg-slate-900/40 hover:border-slate-600",
              )}
            >
              <div
                className={clsx(
                  "text-sm font-medium",
                  companyType === c.id ? "text-sky-100" : "text-slate-200",
                )}
              >
                {c.label}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">{c.hint}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ─── 경력 수준 ───────────────────────── */}
      <div>
        <label className="block text-sm font-medium text-slate-200 mb-2">
          경력 수준 <span className="text-rose-400">*</span>
        </label>
        <div className="flex flex-wrap gap-1.5">
          {EXPERIENCE_LEVELS.map((lv) => (
            <button
              key={lv.id}
              type="button"
              onClick={() => setExperienceLevel(lv.id)}
              className={clsx(
                "text-xs px-3 py-1.5 rounded-md border transition",
                experienceLevel === lv.id
                  ? "border-sky-400/60 bg-sky-500/15 text-sky-100"
                  : "border-slate-700 bg-slate-900/40 text-slate-300 hover:border-slate-600",
              )}
            >
              {lv.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── 기술 스택 ───────────────────────── */}
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <label className="block text-sm font-medium text-slate-200">
            기술 스택 <span className="text-rose-400">*</span>
          </label>
          <span className="text-xs text-slate-500">
            {techStack.length} / {MAX_TECH_STACK}
          </span>
        </div>

        {/* 선택된 항목 표시 */}
        {techStack.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3 p-2.5 rounded-md bg-slate-950/40 border border-slate-800">
            {techStack.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 border border-sky-400/40 px-2.5 py-0.5 text-xs text-sky-100"
              >
                {t}
                <button
                  type="button"
                  onClick={() => removeTech(t)}
                  className="text-sky-200/70 hover:text-sky-100 transition"
                  aria-label={`${t} 제거`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* 자유 입력 */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={customTech}
            onChange={(e) => setCustomTech(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomTech();
              }
            }}
            placeholder="프리셋에 없는 항목을 직접 입력해 (Enter로 추가)"
            className="flex-1 bg-slate-950/60 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/40"
          />
          <button
            type="button"
            onClick={addCustomTech}
            disabled={!customTech.trim()}
            className="px-3 rounded-md text-sm bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            추가
          </button>
        </div>

        {/* 프리셋 카테고리 */}
        <div className="space-y-3">
          {Object.entries(TECH_STACK_PRESETS).map(([category, items]) => (
            <div key={category}>
              <p className="text-xs text-slate-500 mb-1.5">{category}</p>
              <div className="flex flex-wrap gap-1.5">
                {items.map((name) => (
                  <Chip
                    key={name}
                    selected={techStack.includes(name)}
                    onToggle={() => toggleTech(name)}
                  >
                    {name}
                  </Chip>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 사용자 정의 항목(프리셋에 없는)도 칩으로 다시 노출하지 않음 — 위쪽 선택 영역에서 보이므로 OK */}
        {techStack.some((t) => !allPresetTechs.includes(t)) && (
          <p className="mt-2 text-xs text-slate-500">
            ✨ 프리셋에 없는 항목도 추가됐어 — 위쪽 선택 영역에서 확인할 수
            있어.
          </p>
        )}
      </div>

      {/* ─── 시작 버튼 ──────────────────────── */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-xs text-slate-500">
          시작하면 새 세션이 만들어지고 인터뷰 페이지로 이동해.
        </p>
        <button
          type="button"
          onClick={handleStart}
          disabled={!canSubmit}
          className={clsx(
            "inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-md text-sm font-medium transition",
            "bg-sky-500 text-slate-950 hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed",
          )}
        >
          <Sparkles className="w-4 h-4" />
          {submitting ? "준비 중..." : "면접 시작"}
        </button>
      </div>
    </section>
  );
}

export default InterviewSetupForm;
