import { useCallback, useEffect, useRef, useState } from "react";
import { getSession, abandonSession } from "../services/sessionsRepo";
import {
  addMessage,
  listMessagesBySession,
  listQuestionsBySession,
} from "../services/messagesRepo";
import {
  startInterview,
  submitAnswer,
  extractErrorMessage,
} from "../services/claudeClient";
import {
  MESSAGE_ROLE,
  MESSAGE_TYPE,
  SESSION_STATUS,
} from "../constants/interview";
import { toAnthropicHistory } from "../utils/messageAdapter";

/**
 * 인터뷰 페이지의 모든 상태/액션을 관리하는 훅.
 *
 * 책임:
 * - 세션과 메시지 로드
 * - 신규 세션이면 면접관 첫 인사 자동 호출
 * - 답변 제출 → 피드백/꼬리 질문 호출 → DB 반영
 * - 로딩/오류 상태 노출
 */
export function useInterview({ sessionId, apiKey, model }) {
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true); // 초기 로드
  const [thinking, setThinking] = useState(false); // 면접관 응답 대기 중
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);

  // 자동 시작 중복 방지용 (StrictMode 더블 호출 대비)
  const startedRef = useRef(false);

  // ─── 초기 로드 ───────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    if (!sessionId) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    (async () => {
      const [s, msgs] = await Promise.all([
        getSession(sessionId),
        listMessagesBySession(sessionId),
      ]);
      if (cancelled) return;

      if (!s) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setSession(s);
      setMessages(msgs);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  // ─── 신규 세션이면 자동으로 첫 질문 받아오기 ──────────────
  useEffect(() => {
    if (loading || !session || !apiKey || !model) return;
    if (messages.length > 0) return; // 이미 메시지가 있으면 이어가기
    if (startedRef.current) return; // 중복 호출 방지
    if (session.status !== SESSION_STATUS.IN_PROGRESS) return;

    startedRef.current = true;
    (async () => {
      try {
        setThinking(true);
        setError(null);

        const opening = await startInterview({ apiKey, model, session });

        // 응답 검증
        if (
          opening?.type !== "opening" ||
          !opening.opening ||
          !opening.question
        ) {
          throw new Error("면접관 응답 형식이 예상과 달라");
        }

        // 인삿말과 첫 질문을 별도 메시지로 저장
        await addMessage({
          sessionId: session.id,
          role: MESSAGE_ROLE.INTERVIEWER,
          type: MESSAGE_TYPE.OPENING,
          content: opening.opening,
        });
        await addMessage({
          sessionId: session.id,
          role: MESSAGE_ROLE.INTERVIEWER,
          type: MESSAGE_TYPE.QUESTION,
          content: opening.question,
        });

        const refreshed = await listMessagesBySession(session.id);
        setMessages(refreshed);
      } catch (err) {
        console.error(err);
        setError(extractErrorMessage(err));
      } finally {
        setThinking(false);
      }
    })();
  }, [loading, session, messages.length, apiKey, model]);

  // ─── 답변 제출 → 피드백 + 꼬리 질문 받아오기 ───────────────
  const submit = useCallback(
    async (answerText) => {
      if (!session || !apiKey || !model) return;
      if (thinking) return;
      const trimmed = answerText.trim();
      if (!trimmed) return;

      try {
        setThinking(true);
        setError(null);

        // 답변 먼저 DB에 기록
        await addMessage({
          sessionId: session.id,
          role: MESSAGE_ROLE.CANDIDATE,
          type: MESSAGE_TYPE.ANSWER,
          content: trimmed,
        });

        // 화면에 즉시 반영 (낙관적 업데이트)
        const afterAnswer = await listMessagesBySession(session.id);
        setMessages(afterAnswer);

        // 면접관 호출용 history 구성
        const history = toAnthropicHistory(afterAnswer.slice(0, -1));
        // 마지막 한 건(방금 넣은 답변)은 userContent로 따로 전달
        const askedQuestions = await listQuestionsBySession(session.id);

        const fb = await submitAnswer({
          apiKey,
          model,
          session,
          history,
          answer: trimmed,
          askedQuestions,
        });

        if (fb?.type !== "feedback" || !fb.feedback || !fb.followUp) {
          throw new Error("피드백 응답이 형식과 달라.");
        }

        // 피드과 꼬리 질문 저장
        await addMessage({
          sessionId: session.id,
          role: MESSAGE_ROLE.INTERVIEWER,
          type: MESSAGE_TYPE.FEEDBACK,
          content: JSON.stringify(fb.feedback),
        });
        await addMessage({
          sessionId: session.id,
          role: MESSAGE_ROLE.INTERVIEWER,
          type: MESSAGE_TYPE.FOLLOW_UP,
          content: fb.followUp,
        });

        const refreshed = await listMessagesBySession(session.id);
        setMessages(refreshed);
      } catch (err) {
        console.error(err);
        setError(extractErrorMessage(err));
      } finally {
        setThinking(false);
      }
    },
    [session, apiKey, model, thinking],
  );

  // ─── 면접 중도 포기 ────────────────────────────────────
  const abandon = useCallback(async () => {
    if (!session) return;
    await abandonSession(session.id);
    const refreshed = await getSession(session.id);
    setSession(refreshed);
  }, [session]);

  return {
    session,
    messages,
    loading,
    thinking,
    error,
    notFound,
    submit,
    abandon,
  };
}
