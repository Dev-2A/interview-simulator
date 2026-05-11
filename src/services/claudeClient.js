import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt, SIGNAL } from "./promptBuilder";
import { parseLooseJson } from "../utils/parseJson";
import { withRetry } from "../utils/retry";
import { findSimilarQuestion } from "../utils/questionSimilarity";

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
  signal, // AbortSignal — 페이지 이탈 시 호출 취소
}) {
  const client = createClient(apiKey);

  return withRetry(async () => {
    const response = await client.messages.create(
      {
        model,
        max_tokens: 1500,
        system: buildSystemPrompt(session, { askedQuestions }),
        messages: [...history, { role: "user", content: userContent }],
      },
      signal ? { signal } : undefined,
    );

    const raw = extractText(response);
    if (!raw) throw new Error("면접관 응답이 비어 있어.");
    return parseLooseJson(raw);
  });
}

/**
 * 면접 시작 — 인삿말 + 첫 질문을 받아온다.
 * 반환: { type: 'opening', opening, question }
 */
export async function startInterview({ apiKey, model, session, signal }) {
  return callInterviewer({
    apiKey,
    model,
    session,
    history: [],
    userContent: SIGNAL.START,
    signal,
  });
}

/**
 * 답변 제출 — 피드백 + 꼬리 질문을 받아온다.
 *
 * 받은 followUp이 askedQuestions와 유사도 임계값 이상이면,
 * "이건 이미 했어, 다른 각도로 물어줘"라는 후속 메시지를 보내 1회 갱신을 시도한다.
 *
 * 반환: { type: 'feedback', feedback: {...}, followUp: string }
 */
export async function submitAnswer({
  apiKey,
  model,
  session,
  history,
  answer,
  askedQuestions = [],
  signal,
}) {
  const first = await callInterviewer({
    apiKey,
    model,
    session,
    history,
    userContent: answer,
    askedQuestions,
    signal,
  });

  if (first?.type !== "feedback" || !first.feedback || !first.followUp) {
    return first;
  }

  // 표면적/의미적 중복 검사
  const dup = findSimilarQuestion(first.followUp, askedQuestions);
  if (!dup) return first;

  // 1회 갱신 시도: 면접관에게 동일 질문임을 알리고 다른 각도를 요구
  const retryNote =
    `방금 만든 followUp("${first.followUp}")이 이미 했던 질문("${dup}")과 너무 비슷해. ` +
    `같은 출력 스키마(JSON)를 유지한 채, 이번 답변을 평가하고 followUp만 다른 관점·다른 깊이의 질문으로 다시 만들어줘. ` +
    `feedback 내용은 유지하거나 보완해도 좋아.`;

  const retryHistory = [
    ...history,
    { role: "user", content: answer },
    { role: "assistant", content: JSON.stringify(first) },
  ];

  try {
    const second = await callInterviewer({
      apiKey,
      model,
      session,
      history: retryHistory,
      userContent: retryNote,
      askedQuestions,
      signal,
    });

    if (second?.type === "feedback" && second.feedback && second.followUp) {
      // 갱신본도 또 중복이면 그냥 갱신본 반환 (무한 루프 방지)
      return second;
    }
    return first;
  } catch (err) {
    // 갱신 실패 시 원본을 살린다 (사용자 흐름이 끊기지 않도록)
    console.warn("followUp 재요청 실패, 원본 유지:", err);
    return first;
  }
}

/**
 * 면접 종료 — 전체 회고를 받아온다.
 * 반환: { type: 'closing', retrospective: { overall, strengths[], improvements[], verdict } }
 */
export async function wrapUpInterview({
  apiKey,
  model,
  session,
  history,
  signal,
}) {
  return callInterviewer({
    apiKey,
    model,
    session,
    history,
    userContent: SIGNAL.WRAP_UP,
    signal,
  });
}
