import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt, SIGNAL } from "./promptBuilder";
import { parseLooseJson } from "../utils/parseJson";

/**
 * 브라우저용 Anthropic 클라이언트 인스턴스를 만든다.
 * BYOK 도구라 사용자 본인 키로 사용자 본인 브라우저에서만 호출되므로
 * dangerouslyAllowBrowser: true 가 의도된 동작이다.
 */
export function createClient(apiKey) {
  if (!apiKey) throw new Error("API 키가 비어 있어");
  return new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  });
}

/**
 * API 키 유효성 검증.
 * 가장 작은 모델로 1토큰짜리 요청을 보내 인증 여부만 확인한다.
 */
export async function verifyApiKey(apiKey) {
  if (!apiKey?.trim()) {
    return { ok: false, error: "API 키를 입력해줘." };
  }
  if (!apiKey.startsWith("sk-ant-")) {
    return {
      ok: false,
      error: 'Anthropic API 키는 보통 "sk-ant-"로 시작해. 다시 확인해줘.',
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

export function extractErrorMessage(err) {
  const status = err?.status;
  const apiMsg = err?.error?.error?.message || err?.message;

  if (status === 401) return "인증 실패: API 키가 잘못됐거나 폐기됐어.";
  if (status === 403)
    return "권한이 없어: 이 키로 해당 모델에 접근할 수 없을 수 있어.";
  if (status === 429) return "요청 한도 초과: 잠시 후 다시 시도해줘.";
  if (status >= 500) return "Anthropic 서버 오류야. 잠시 후 다시 시도해줘.";
  if (apiMsg) return apiMsg;
  return "알 수 없는 오류가 발생했어.";
}

// ─── 면접관 호출 함수 ─────────────────────────────────────────

/**
 * Anthropic 응답에서 첫 텍스트 블록을 추출.
 */
function extractText(response) {
  const block = response?.content?.find?.((b) => b.type === "text");
  return block?.text ?? "";
}

/**
 * 공통 호출 헬퍼.
 *
 * @param {Object} params
 * @param {string} params.apiKey
 * @param {string} params.model
 * @param {Object} params.session                  — DB sessions 행
 * @param {Array}  params.history                  — Anthropic messages 배열 (role/content)
 * @param {string} params.userContent              — 이번 턴에 보낼 사용자 메시지
 * @param {string[]} [params.askedQuestions]
 * @returns {Promise<any>}                         — 파싱된 JSON
 */
async function callInterviewer({
  apiKey,
  model,
  session,
  history = [],
  userContent,
  askedQuestions = [],
}) {
  const client = createClient(apiKey);

  const response = await client.messages.create({
    model,
    max_tokens: 1500,
    system: buildSystemPrompt(session, { askedQuestions }),
    messages: [...history, { role: "user", content: userContent }],
  });

  const raw = extractText(response);
  if (!raw) throw new Error("면접관 응답이 비어 있어.");

  return parseLooseJson(raw);
}

/**
 * 면접 시작 — 인삿말 + 첫 질문을 받아온다.
 * 반환: { type: 'opening', opening, question }
 */
export async function startInterview({ apiKey, model, session }) {
  return callInterviewer({
    apiKey,
    model,
    session,
    history: [],
    userContent: SIGNAL.START,
  });
}

/**
 * 답변 제출 — 피드백 + 꼬리 질문을 받아온다.
 * 반환: { type: 'feedback', feedback: { strengths, weaknesses, score }, followUp }
 *
 * @param {Array} history          — 지금까지의 messages 배열
 *                                   (role: 'user'|'assistant', content: string)
 * @param {string} answer          — 사용자의 이번 답변
 * @param {string[]} askedQuestions
 */
export async function submitAnswer({
  apiKey,
  model,
  session,
  history,
  answer,
  askedQuestions = [],
}) {
  return callInterviewer({
    apiKey,
    model,
    session,
    history,
    userContent: answer,
    askedQuestions,
  });
}

/**
 * 면접 종료 — 전체 회고를 받아온다.
 * 반환: { type: 'closing', retrospective: { overall, strengths[], improvements[], verdict } }
 */
export async function wrapUpInterview({ apiKey, model, session, history }) {
  return callInterviewer({
    apiKey,
    model,
    session,
    history,
    userContent: SIGNAL.WRAP_UP,
  });
}
