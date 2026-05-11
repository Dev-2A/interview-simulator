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

/**
 * "이 세션의 모든 질문 + 최근 N개 세션의 모든 질문"을 합쳐 반환한다.
 *
 * 이번 세션 안에서의 반복은 무조건 막고,
 * 과거 세션과의 중복은 가이드 정도로 LLM에 알려준다.
 *
 * @param {number} sessionId
 * @param {number} [recentSessionLimit=5]
 * @returns {Promise<string[]>}
 */
export async function listQuestionsForGuard(sessionId, recentSessionLimit = 5) {
  // 1) 이번 세션 질문
  const current = await listQuestionsBySession(sessionId);

  // 2) 최근 N개 세션 ID 수집 (현재 세션 제외)
  const recent = await db.sessions
    .orderBy("startedAt")
    .reverse()
    .limit(recentSessionLimit + 1) // +1: 자기 자신이 포함될 가능성 대비
    .toArray();

  const recentIds = recent
    .map((s) => s.id)
    .filter((id) => id !== sessionId)
    .slice(0, recentSessionLimit);

  // 3) 그 세션들의 질문을 일괄 조회
  const past = [];
  for (const id of recentIds) {
    const qs = await listQuestionsBySession(id);
    past.push(...qs);
  }

  // 중복 정규화 제거
  const seen = new Set();
  const merged = [];
  for (const q of [...current, ...past]) {
    const key = q.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(q);
  }
  return merged;
}
