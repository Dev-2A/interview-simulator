/**
 * 회고(retrospective) 데이터 핸들링 유틸.
 *
 * DB 저장 형태:
 *   sessions.retrospective = JSON.stringify({
 *     overall: string,
 *     strengths: string[],
 *     improvements: string[],
 *     verdict: string,
 *     finalScore: number | null,   // 면접 동안의 평균 점수 스냅샷
 *     finishedAt: number,          // 회고 생성 시각
 *   })
 *
 * 화면에서는 항상 parsed 객체로 다룬다.
 */

/**
 * DB에서 읽어온 retrospective 문자열을 파싱한다.
 * 잘못된 JSON이면 null 반환 (이전 버전 호환 안전망).
 */
export function parseRetrospective(raw) {
  if (!raw) return null;
  if (typeof raw === "object") return raw; // 이미 객체면 그대로
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * 회고 객체의 형식이 유효한지 검사.
 */
export function isValidRetrospective(r) {
  if (!r || typeof r !== "object") return false;
  if (typeof r.overall !== "string" || !r.overall.trim()) return false;
  if (!Array.isArray(r.strengths) || r.strengths.length === 0) return false;
  if (!Array.isArray(r.improvements) || r.improvements.length === 0)
    return false;
  if (typeof r.verdict !== "string" || !r.verdict.trim()) return false;
  return true;
}

/**
 * verdict 문자열을 톤(색)으로 매핑.
 *
 * LLM이 출력하는 verdict는 자유 문자열이지만 보통:
 *   - "Pass ...", "통과 ...", "Strong ..."         → success (green)
 *   - "Borderline ...", "보더라인 ...", "추가 검토" → warning (amber)
 *   - "Not yet ...", "Fail ...", "더 다듬어야"     → danger  (rose)
 */
export function verdictTone(verdict) {
  if (!verdict) return "neutral";
  const v = verdict.toLowerCase();
  if (
    v.includes("not yet") ||
    v.includes("fail") ||
    v.includes("reject") ||
    v.includes("더 다듬") ||
    v.includes("재도전") ||
    v.includes("미흡")
  ) {
    return "danger";
  }
  if (
    v.includes("borderline") ||
    v.includes("추가 검토") ||
    v.includes("보더라인") ||
    v.includes("보완")
  ) {
    return "warning";
  }
  if (
    v.includes("pass") ||
    v.includes("통과") ||
    v.includes("strong") ||
    v.includes("우수") ||
    v.includes("추천")
  ) {
    return "success";
  }
  return "neutral";
}
