/**
 * 답변 텍스트의 최소 요건을 검사한다.
 *
 * 의미 있는 피드백을 받으려면 어느 정도의 길이는 필요하므로,
 * 너무 짧거나 의미 없는 답변은 클라이언트 단에서 차단해 토큰 낭비를 막는다.
 *
 * @param {string} text
 * @returns {{ ok: true } | { ok: false, reason: string }}
 */
export function validateAnswer(text) {
  const trimmed = (text ?? "").trim();

  if (trimmed.length === 0) {
    return { ok: false, reason: "답변이 비어 있어." };
  }

  // 최소 글자 수 (한글 8자 정도면 가장 짧은 의미 단위는 됨)
  if (trimmed.length < 8) {
    return {
      ok: false,
      reason: "답변이 너무 짧아. 최소 한 문장 이상으로 답해줘.",
    };
  }

  // "네", "아니요", "모르겠어요" 같은 단답 검출
  const trivialPatterns = [
    /^(네|예|응|어|음+)\.?$/i,
    /^아(니|니요|니오)\.?$/i,
    /^모(르|르겠어|르겠습니다|르겠어요|름)\.?$/i,
    /^(yes|no|nope|yep|idk)\.?$/i,
  ];
  if (trivialPatterns.some((p) => p.test(trimmed))) {
    return {
      ok: false,
      reason:
        "단답형 답변은 면접에서 도움이 안 돼. 이유나 사례를 한 문장이라도 덧붙여줘.",
    };
  }

  return { ok: true };
}
