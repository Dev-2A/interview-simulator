import {
  SESSION_STATUS,
  COMPANY_TYPES,
  EXPERIENCE_LEVELS,
} from "../constants/interview";
import { parseRetrospective, verdictTone } from "./retrospective";

/**
 * 세션 1건을 카드/목록에 표시하기 위한 요약 객체로 변환.
 *
 * @param {Object} session — DB의 sessions 행
 * @returns {{
 *   id: number,
 *   jobRole: string,
 *   companyLabel: string,
 *   experienceLabel: string,
 *   techStack: string[],
 *   status: string,
 *   startedAt: number,
 *   endedAt: number | null,
 *   retro: object | null,
 *   verdict: string | null,
 *   tone: 'success' | 'warning' | 'danger' | 'neutral',
 *   finalScore: number | null,
 * }}
 */
export function summarizeSession(session) {
  const companyLabel =
    COMPANY_TYPES.find((c) => c.id === session.companyType)?.label ??
    session.companyType;
  const experienceLabel =
    EXPERIENCE_LEVELS.find((e) => e.id === session.experienceLabel)?.label ??
    "-";

  const retro = parseRetrospective(session.retrospective);
  const verdict = retro?.verdict ?? null;
  const tone = retro ? verdictTone(verdict) : statusTone(session.status);
  const finalScore = retro?.finalScore ?? null;

  return {
    id: session.id,
    jobRole: session.jobRole,
    companyLabel,
    experienceLabel,
    techStack: session.techStack ?? [],
    status: session.status,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    retro,
    verdict,
    tone,
    finalScore,
  };
}

/**
 * 회고가 없는 세션(진행 중/중단)도 톤이 있어야 카드 색이 일관됨.
 */
function statusTone(status) {
  if (status === SESSION_STATUS.IN_PROGRESS) return "progress";
  if (status === SESSION_STATUS.ABANDONED) return "neutral";
  return "neutral";
}

/**
 * 세션 상태 라벨 (배지/필터 공용).
 */
export const STATUS_LABEL = {
  [SESSION_STATUS.IN_PROGRESS]: "진행 중",
  [SESSION_STATUS.COMPLETED]: "완료",
  [SESSION_STATUS.ABANDONED]: "중단",
};

/**
 * Date 포매팅 — 카드/상세 공용.
 */
export function formatDateTime(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
