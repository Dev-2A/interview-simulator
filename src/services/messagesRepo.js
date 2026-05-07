import { db } from "./db";
import { MESSAGE_TYPE } from "../constants/interview";

/**
 * messages 테이블 CRUD.
 * 세션 안의 모든 발화를 시간순으로 저장한다.
 */

/**
 * 메시지 1개 추가.
 * @param {Object} msg
 * @param {number} msg.sessionId
 * @param {string} msg.role     — MESSAGE_ROLE.INTERVIEWER | CANDIDATE
 * @param {string} msg.type     — MESSAGE_TYPE.* 중 하나
 * @param {string} msg.content
 * @returns {Promise<number>} 생성된 메시지 ID
 */
export async function addMessage({ sessionId, role, type, content }) {
  return db.messages.add({
    sessionId,
    role,
    type,
    content,
    createdAt: Date.now(),
  });
}

/**
 * 특정 세션의 메시지를 시간순(오래된 → 최신)으로 반환.
 * 복합 인덱스 [sessionId+createdAt]를 활용한다.
 */
export async function listMessagesBySession(sessionId) {
  return db.messages
    .where("[sessionId+createdAt]")
    .between([sessionId, 0], [sessionId, Infinity])
    .toArray();
}

/**
 * 특정 세션에서 면접관이 던진 질문(QUESTION + FOLLOW_UP)만 추출.
 * Step 9 "같은 질문 반복 방지" 로직에서 사용한다.
 */
export async function listQuestionsBySession(sessionId) {
  const all = await listMessagesBySession(sessionId);
  return all
    .filter(
      (m) =>
        m.type === MESSAGE_TYPE.QUESTION || m.type === MESSAGE_TYPE.FOLLOW_UP,
    )
    .map((m) => m.content);
}

/**
 * DB 전체에서 면접관이 던졌던 모든 질문을 반환.
 * 새 세션 생성 시 "이전에 한 질문은 또 하지 말라"는 가드 컨텍스트로 사용 가능.
 */
export async function listAllQuestions() {
  const rows = await db.messages
    .where("type")
    .anyOf(MESSAGE_TYPE.QUESTION, MESSAGE_TYPE.FOLLOW_UP)
    .toArray();
  return rows.map((m) => m.content);
}

export async function deleteMessage(id) {
  await db.messages.delete(id);
}

/**
 * 세션의 가장 마지막 "답변 턴"을 통째로 삭제한다.
 *
 * 답변 턴 = answer → feedback → follow_up 의 묶음.
 * 면접관이 던진 메인 question 자체는 유지된다 (지원자가 같은 질문에 다시 답할 수 있도록).
 *
 * @param {number} sessionId
 * @returns {Promise<{ removed: number }>}
 */
export async function rollbackLastAnswerTurn(sessionId) {
  const all = await listMessagesBySession(sessionId);

  // 가장 마지막 ANSWER의 위치를 찾는다
  let lastAnswerIdx = -1;
  for (let i = all.length - 1; i >= 0; i--) {
    if (all[i].type === MESSAGE_TYPE.ANSWER) {
      lastAnswerIdx = i;
      break;
    }
  }
  if (lastAnswerIdx === -1) return { removed: 0 };

  // ANSWER ~ 그 뒤의 FEEDBACK / FOLLOW_UP 까지를 삭제 대상으로
  const toRemove = all
    .slice(lastAnswerIdx)
    .filter((m) =>
      [
        MESSAGE_TYPE.ANSWER,
        MESSAGE_TYPE.FEEDBACK,
        MESSAGE_TYPE.FOLLOW_UP,
      ].includes(m.type),
    );
  const ids = toRemove.map((m) => m.id);

  await db.transaction("rw", db.messages, async () => {
    await db.messages.bulkDelete(ids);
  });

  return { removed: ids.length };
}
