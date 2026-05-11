/**
 * 질문 텍스트를 비교용으로 정규화한다.
 *
 * - 공백/특수문자/조사 단순 제거
 * - 소문자화
 * - 흔한 구두점·수식어 제거
 *
 * 의미 비교가 아닌 "표면적 동일성" 판정을 위한 정규화.
 */
export function normalizeQuestion(text) {
  if (!text) return "";
  return (
    text
      .toLowerCase()
      .replace(/\s+/g, " ")
      // 한국어 종결/구두점 제거
      .replace(/[.?!,…·~"'`()[\]{}<>「」『』]/g, "")
      // "~을/를/이/가/에/에서/와/과/은/는/도" 같은 흔한 조사 제거 (단어 끝)
      .replace(/(을|를|이|가|에|에서|와|과|은|는|도|의|로|으로)\b/g, "")
      .trim()
  );
}

/**
 * Jaccard 유사도 (0~1).
 * 두 문장의 어절 집합 중복도를 본다.
 *
 * 짧은 질문 + 한국어 환경에 가장 단순하면서도 잘 동작하는 휴리스틱.
 * 임베딩이 필요할 정도로 정교한 비교는 토이 프로젝트 범위 밖.
 */
export function jaccardSimilarity(a, b) {
  const tokensA = new Set(normalizeQuestion(a).split(" ").filter(Boolean));
  const tokensB = new Set(normalizeQuestion(b).split(" ").filter(Boolean));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  for (const t of tokensA) if (tokensB.has(t)) intersection++;

  const union = tokensA.size + tokensB.size - intersection;
  return intersection / union;
}

/**
 * candidate가 history 안의 어떤 질문과도 유사도 threshold 이상이면 그 질문을 반환한다.
 * 일치하는 게 없으면 null.
 *
 * @param {string} candidate
 * @param {string[]} history
 * @param {number} threshold  — 0.6 이상이면 보통 같은 의도로 본다 (한국어 환경 경험치)
 */
export function findSimilarQuestion(candidate, history, threshold = 0.6) {
  const cn = normalizeQuestion(candidate);
  if (!cn) return null;

  let best = { question: null, score: 0 };
  for (const q of history) {
    // 1) 정규화 후 완전 일치 → 즉시 반환
    if (normalizeQuestion(q) === cn) return q;

    // 2) Jaccard 유사도 비교
    const score = jaccardSimilarity(candidate, q);
    if (score > best.score) best = { question: q, score };
  }

  return best.score >= threshold ? best.question : null;
}
