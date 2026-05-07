/**
 * fn을 호출하다 실패하면 최대 maxRetries만큼 재시도한다.
 *
 * 재시도 대상 에러:
 * - 5xx 서버 오류
 * - JSON 파싱 실패 ("JSON 파싱 실패", "JSON으로 보이는...")
 * - 응답 형식 검증 실패 ("응답 형식이 예상과 달라")
 *
 * @param {() => Promise<T>} fn
 * @param {Object} [opts]
 * @param {number} [opts.maxRetries=1]
 * @param {number} [opts.delayMs=600]
 * @returns {Promise<T>}
 */
export async function withRetry(fn, { maxRetries = 1, delayMs = 600 } = {}) {
  let lastErr;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err) || i === maxRetries) break;
      await sleep(delayMs);
    }
  }
  throw lastErr;
}

function isRetryable(err) {
  const msg = String(err?.message ?? "");
  if (err?.status >= 500 && err?.status < 600) return true;
  if (msg.includes("JSON 파싱 실패")) return true;
  if (msg.includes("JSON으로 보이는")) return true;
  if (msg.includes("응답 형식이 예상과 달라")) return true;
  return false;
}

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}
