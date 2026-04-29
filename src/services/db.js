import Dexie from "dexie";

/**
 * Interview Simulator의 IndexedDB 인스턴스.
 *
 * 모든 데이터(API 키, 면접 세션, 메시지)는 이 DB에만 저장되며
 * 어떠한 외부 서버로도 전송되지 않는다.
 *
 * - settings: 단일 값(API 키 등) 저장용 key-value 스토어
 * - sessions: 면접 세션 1건당 1행
 * - messages: 세션 안의 모든 발화 (질문·답변·피드백·꼬리 질문)
 */
class InterviewDB extends Dexie {
  constructor() {
    super("InterviewSimulatorDB");

    // v1: 초기 스키마
    this.version(1).stores({
      // &key: key가 primary key이자 unique
      settings: "&key",

      // ++id: 자동 증가 PK / 이외 필드는 인덱싱 대상
      sessions: "++id, status, startedAt",

      // [sessionId+createdAt]: 세션별 시간순 조회를 위한 복합 인덱스
      messages: "++id, sessionId, [sessionId+createdAt]",
    });
  }
}

export const db = new InterviewDB();

// 개발 중 브라우저 콘솔에서 db.sessions.toArray() 등으로 DB 내용 확인 가능
if (import.meta.env.DEV) {
  window.db = db;
}
