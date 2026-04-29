import { db } from "./db";
import { SESSION_STATUS } from "../constants/interview";

/**
 * sessions 테이블 CRUD.
 * 면접 세션 1건 = 1행.
 */

/**
 * 새 세션 생성.
 * @param {Object} cfg
 * @param {string} cfg.jobRole       — 직무 (예: "백엔드 개발자")
 * @param {string} cfg.companyType   — 회사 타입 (예: "스타트업")
 * @param {string[]} cfg.techStack   — 기술 스택 배열 (예: ["Python", "FastAPI"])
 * @returns {Promise<number>} 생성된 세션 ID
 */
export async function createSession({ jobRole, companyType, techStack }) {
  return db.sessions.add({
    jobRole,
    companyType,
    techStack: techStack ?? [],
    status: SESSION_STATUS.IN_PROGRESS,
    startedAt: Date.now(),
    endedAt: null,
    retrospective: null,
  });
}

export async function getSession(id) {
  return db.sessions.get(id);
}

/**
 * 모든 세션을 최신순으로 반환.
 */
export async function listSessions() {
  // startedAt desc - Dexie는 reverse()로 처리
  return db.sessions.orderBy("startedAt").reverse().toArray();
}

export async function updateSession(id, patch) {
  return db.sessions.update(id, patch);
}

/**
 * 세션을 정상 종료 처리. 회고 텍스트를 함께 저장.
 */
export async function completeSession(id, retrospective) {
  await db.sessions.update(id, {
    status: SESSION_STATUS.COMPLETED,
    endedAt: Date.now(),
    retrospective: retrospective ?? null,
  });
}

/**
 * 세션을 중도 포기 처리.
 */
export async function abandonSession(id) {
  await db.sessions.update(id, {
    status: SESSION_STATUS.ABANDONED,
    endedAt: Date.now(),
  });
}

/**
 * 세션과 그 안의 모든 메시지를 함께 삭제.
 * 트랜잭션으로 처리해 일관성 보장.
 */
export async function deleteSessionWithMessages(id) {
  await db.transaction("rw", db.sessions, db.messages, async () => {
    await db.messages.where("sessionId").equals(id).delete();
    await db.sessions.delete(id);
  });
}
