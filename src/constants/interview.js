/**
 * 면접 도메인 상수.
 * 문자열 리터럴이 코드 곳곳에 흩어지면 오타가 버그가 되니 한 곳에 모아둔다.
 */

// 세션 상태
export const SESSION_STATUS = {
  IN_PROGRESS: "in_progress", // 진행 중
  COMPLETED: "completed", // 정상 종료 (회고까지 작성됨)
  ABANDONED: "abandoned", // 중간에 나감
};

// 메시지 발화자
export const MESSAGE_ROLE = {
  INTERVIEWER: "interviewer", // 면접관 (Claude)
  CANDIDATE: "candidate", // 면접자
};

// 메시지 유형
export const MESSAGE_TYPE = {
  OPENING: "opening", // 면접관의 인삿말
  QUESTION: "question", // 메인 질문
  ANSWER: "answer", // 사용자 답변
  FEEDBACK: "feedback", // 답변에 대한 피드백
  FOLLOW_UP: "follow_up", // 꼬리 질문
  CLOSING: "closing", // 마무리 발화
};
