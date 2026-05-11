import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSession, abandonSession } from "../services/sessionsRepo";
import {
  addMessage,
  listMessagesBySession,
  listQuestionsBySession,
  listQuestionsForGuard,
  rollbackLastAnswerTurn,
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
import { validateAnswer } from "../utils/answerValidation";

export function useInterview({ sessionId, apiKey, model }) {
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const startedRef = useRef(false);
  const abortRef = useRef(null);

  // ─── 페이지 이탈 시 인플라이트 요청 취소 ──────────────────
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // ─── 초기 로드 ──────────────────────────────────────────
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

  // ─── 신규 세션이면 자동으로 첫 질문 ─────────────────────────
  useEffect(() => {
    if (loading || !session || !apiKey || !model) return;
    if (messages.length > 0) return;
    if (startedRef.current) return;
    if (session.status !== SESSION_STATUS.IN_PROGRESS) return;

    startedRef.current = true;
    const ac = new AbortController();
    abortRef.current = ac;
    (async () => {
      try {
        setThinking(true);
        setError(null);

        const opening = await startInterview({
          apiKey,
          model,
          session,
          signal: ac.signal,
        });

        if (
          opening?.type !== "opening" ||
          !opening.opening ||
          !opening.question
        ) {
          throw new Error("면접관 응답 형식이 예상과 달라.");
        }

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
        if (ac.signal.aborted) return;
        setMessages(refreshed);
      } catch (err) {
        if (ac.signal.aborted) return;
        console.error(err);
        setError(extractErrorMessage(err));
      } finally {
        if (!ac.signal.aborted) setThinking(false);
      }
    })();
  }, [loading, session, messages.length, apiKey, model]);

  // ─── 답변 제출 ──────────────────────────────────────────
  const submit = useCallback(
    async (answerText) => {
      if (!session || !apiKey || !model) return;
      if (thinking) return;

      const validation = validateAnswer(answerText);
      if (!validation.ok) {
        setError(validation.reason);
        return;
      }
      const trimmed = answerText.trim();

      const ac = new AbortController();
      abortRef.current = ac;

      try {
        setThinking(true);
        setError(null);

        // 1) 답변을 즉시 DB에 기록 + 화면 반영 (낙관적 업데이트)
        await addMessage({
          sessionId: session.id,
          role: MESSAGE_ROLE.CANDIDATE,
          type: MESSAGE_TYPE.ANSWER,
          content: trimmed,
        });
        const afterAnswer = await listMessagesBySession(session.id);
        setMessages(afterAnswer);

        // 2) Anthropic 호출
        const history = toAnthropicHistory(afterAnswer.slice(0, -1));
        const askedQuestions = await listQuestionsForGuard(session.id);

        const fb = await submitAnswer({
          apiKey,
          model,
          session,
          history,
          answer: trimmed,
          askedQuestions,
          signal: ac.signal,
        });

        if (fb?.type !== "feedback" || !fb.feedback || !fb.followUp) {
          throw new Error("피드백 응답 형식이 예상과 달라.");
        }

        // 3) 피드백 + 꼬리 질문을 DB에 기록
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
        if (ac.signal.aborted) return;
        setMessages(refreshed);
      } catch (err) {
        if (ac.signal.aborted) return;
        console.error(err);
        setError(extractErrorMessage(err));
      } finally {
        if (!ac.signal.aborted) setThinking(false);
      }
    },
    [session, apiKey, model, thinking],
  );

  // ─── 마지막 답변 턴 롤백 (답변 다시 쓰기) ─────────────────
  const rollbackLast = useCallback(async () => {
    if (!session) return { ok: false, reason: "세션이 없어." };
    if (thinking)
      return { ok: false, reason: "응답 대기 중에는 롤백할 수 없어." };

    const all = await listMessagesBySession(session.id);
    const hasAnswer = all.some((m) => m.type === MESSAGE_TYPE.ANSWER);
    if (!hasAnswer) {
      return { ok: false, reason: "되돌릴 답변이 없어." };
    }

    const lastAnswer = [...all]
      .reverse()
      .find((m) => m.type === MESSAGE_TYPE.ANSWER);

    await rollbackLastAnswerTurn(session.id);
    const refreshed = await listMessagesBySession(session.id);
    setMessages(refreshed);
    setError(null);

    return { ok: true, restoredText: lastAnswer?.content ?? "" };
  }, [session, thinking]);

  // ─── 면접 포기 ──────────────────────────────────────────
  const abandon = useCallback(async () => {
    if (!session) return;
    abortRef.current?.abort();
    await abandonSession(session.id);
    const refreshed = await getSession(session.id);
    setSession(refreshed);
  }, [session]);

  // ─── 점수 누적 (피드백 메시지에서 score 추출) ───────────────
  const stats = useMemo(() => {
    const scores = [];
    for (const m of messages) {
      if (m.type !== MESSAGE_TYPE.FEEDBACK) continue;
      try {
        const parsed = JSON.parse(m.content);
        if (typeof parsed?.score === "number") scores.push(parsed.score);
      } catch {
        // 무시
      }
    }
    if (scores.length === 0) return { count: 0, avg: null, latest: null };
    const sum = scores.reduce((a, b) => a + b, 0);
    return {
      count: scores.length,
      avg: +(sum / scores.length).toFixed(1),
      latest: scores[scores.length - 1],
    };
  }, [messages]);

  const dismissError = useCallback(() => setError(null), []);

  return {
    session,
    messages,
    loading,
    thinking,
    error,
    notFound,
    stats,
    submit,
    rollbackLast,
    abandon,
    dismissError,
  };
}
