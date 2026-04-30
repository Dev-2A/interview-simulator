import { Anthropic } from "@anthropic-ai/sdk";

/**
 * 브라우저용 Anthropic 클라이언트 인스턴스를 만든다.
 *
 * BYOK 도구라 사용자 본인의 키로 사용자 본인 브라우저에서만 호출되므로
 * dangerouslyAllowBrowser: true 가 의도된 동작이다.
 */
export function createClient(apiKey) {
  if (!apiKey) throw new Error("API 키가 필요합니다.");
  return new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  });
}

/**
 * API 키 유효성 검증.
 * 가장 작은 모델로 1토큰짜리 요청을 보내 인증 여부만 확인한다.
 *
 * @param {string} apiKey
 * @returns {Promise<{ ok: true } | { ok: false, error: string }>}
 */
export async function verifyApiKey(apiKey) {
  if (!apiKey?.trim()) {
    return { ok: false, error: "API 키가 비어 있습니다." };
  }
  if (!apiKey.startsWith("sk-ant-")) {
    return {
      ok: false,
      error: "API 키 형식이 올바르지 않습니다. 'sk-ant-'로 시작해야 합니다.",
    };
  }

  try {
    const client = createClient(apiKey);
    await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1,
      messages: [{ role: "user", content: "ping" }],
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: extractErrorMessage(err) };
  }
}

/**
 * Anthropic SDK 에러를 사용자 친화 메시지로 변환.
 */
export function extractErrorMessage(err) {
  // SDK가 던지는 APIError 구조
  const status = err?.status;
  const apiMsg = err?.error?.error?.message || err?.message;

  if (status === 401) {
    return "인증 실패: API 키가 유효하지 않거나 권한이 없습니다.";
  }
  if (status === 403) {
    return "접근 거부: API 키가 해당 리소스에 접근할 권한이 없습니다.";
  }
  if (status === 429) {
    return "요청이 너무 많습니다: API 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요.";
  }
  if (status >= 500) {
    return "서버 오류: Anthropic 서버에서 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }
  if (apiMsg) return apiMsg;
  return "알 수 없는 오류가 발생했습니다.";
}
