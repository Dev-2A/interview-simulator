import { MESSAGE_ROLE, MESSAGE_TYPE } from "../constants/interview";
import { SIGNAL } from "../services/promptBuilder";

/**
 * IndexedDB의 messages 행 배열을 Anthropic API의 messages 형식으로 변환한다.
 *
 * 변환 규칙:
 * - opening / question / follow_up / closing → assistant (면접관 발화)
 * - answer                                   → user (지원자 답변)
 * - feedback                                 → 직전 answer 다음의 assistant 응답으로 합쳐짐
 *   (feedback은 LLM이 답변 직후 만든 결과이므로 history에서는 같은 assistant 턴으로 본다)
 *
 * 시작/종료 신호도 함께 끼워 넣는다 — Claude가 컨텍스트를 정확히 이해하려면
 * "사용자가 START를 보냈고 그 답으로 opening을 줬다" 식의 흐름이 필요.
 *
 * @param {Array} dbMessages - IndexedDB messages 배열 (시간순 정렬됨)
 * @returns {Array<{role:'user'|'assistant', content:string}>}
 */
export function toAnthropicHistory(dbMessages) {
  const history = [];

  for (const msg of dbMessages) {
    if (msg.type === MESSAGE_TYPE.OPENING) {
      // 면접 시작 시점: user의 START 시그널 → assistant의 opening 응답
      history.push({ role: "user", content: SIGNAL.START });
      history.push({
        role: "assistant",
        content: JSON.stringify({
          type: "opening",
          opening: msg.content,
          question:
            dbMessages.find((m) => m.type === MESSAGE_TYPE.QUESTION)?.content ??
            "",
        }),
      });
    } else if (msg.type === MESSAGE_TYPE.ANSWER) {
      history.push({ role: "user", content: msg.content });
    } else if (msg.type === MESSAGE_TYPE.FEEDBACK) {
      // feedback과 그 직후의 follow_up을 묶어서 하나의 assistant 응답으로 표현
      const feedback = JSON.parse(msg.content);
      const followUpMsg = findNextOfType(
        dbMessages,
        msg,
        MESSAGE_TYPE.FOLLOW_UP,
      );
      history.push({
        role: "assistant",
        content: JSON.stringify({
          type: "feedback",
          feedback,
          followUp: followUpMsg?.content ?? "",
        }),
      });
    }
    // OPENING과 함께 추가된 QUESTION은 위에서 미리 처리했으니 스킵
    // FOLLOW_UP은 직전 FEEDBACK과 묶여서 처리됐으니 스킵
    // CLOSING은 history 끝에서 별도 처리하지 않음 (회고는 한 번만 발생)
  }

  return history;
}

function findNextOfType(messages, after, type) {
  const idx = messages.indexOf(after);
  for (let i = idx + 1; i < messages.length; i++) {
    if (messages[i].type === type) return messages[i];
    // 답변이 다시 끼면 다른 턴이라 중단
    if (messages[i].type === MESSAGE_TYPE.ANSWER) return null;
  }
  return null;
}

/**
 * UI에 표시하기 위한 "말풍선" 형태로 DB 메시지를 변환한다.
 *
 * 화면 표시 단위:
 * - 면접관 메시지 (opening / question / follow_up / closing) — 좌측
 * - 답변 (answer) — 우측
 * - 피드백 (feedback) — 좌측, 답변에 대한 별도 카드 형태
 *
 * @param {Array} dbMessages
 * @returns {Array<UiBubble>}
 */
export function toUiBubbles(dbMessages) {
  return dbMessages.map((m) => {
    if (m.type === MESSAGE_TYPE.FEEDBACK) {
      let parsed;
      try {
        parsed = JSON.parse(m.content);
      } catch {
        parsed = { strengths: "", weaknesses: m.content, score: null };
      }
      return {
        id: m.id,
        kind: "feedback",
        side: "left",
        feedback: parsed,
        createdAt: m.createdAt,
      };
    }

    return {
      id: m.id,
      kind: "text",
      side: m.role === MESSAGE_ROLE.CANDIDATE ? "right" : "left",
      type: m.type,
      content: m.content,
      createdAt: m.createdAt,
    };
  });
}
