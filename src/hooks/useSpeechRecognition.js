import { useCallback, useEffect, useRef, useState } from "react";
import {
  createRecognition,
  isSpeechSupported,
  describeSpeechError,
} from "../services/speech";

/**
 * SpeechRecognition을 React 친화적으로 감싼 훅.
 *
 * 사용:
 * const { supported, listening, interim, error, start, stop, reset } =
 *   useSpeechRecognition({ onFinal: (text) => setValue(prev => prev + text) })
 *
 * 핵심:
 * - 확정된 텍스트(final)는 onFinal 콜백으로 외부에 넘긴다 (누적 책임은 외부)
 * - 미확정 텍스트(interim)는 상태로 노출 → UI에 회색으로 표시 가능
 * - start/stop을 여러 번 빠르게 눌러도 인스턴스 1개만 살아 있도록 보장
 */
export function useSpeechRecognition({ onFinal, lang = "ko-KR" } = {}) {
  const [supported] = useState(() => isSpeechSupported());
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState(null);

  const recRef = useRef(null);
  const onFinalRef = useRef(onFinal);

  // 콜백이 새 함수로 들어와도 인식 인스턴스에는 영향 없도록 ref로 고정
  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  // 언마운트 시 인식 중단
  useEffect(() => {
    return () => {
      try {
        recRef.current?.abort?.();
      } catch {
        // 무시
      }
      recRef.current = null;
    };
  }, []);

  const start = useCallback(() => {
    if (!supported) {
      setError("이 브라우저는 음성 입력을 지원하지 않아.");
      return;
    }
    if (recRef.current || listening) return;

    const rec = createRecognition({ lang });
    if (!rec) {
      setError("음성 인식 객체를 생성하지 못했어.");
      return;
    }

    rec.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      // event.results는 시작 이후 누적 - resultIndex 이후만 새 결과
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const transcript = res[0].transcript;
        if (res.isFinal) {
          finalText += transcript;
        } else {
          interimText += transcript;
        }
      }
      if (finalText) {
        onFinalRef.current?.(finalText);
      }
      setInterim(interimText);
    };

    rec.onerror = (event) => {
      const msg = describeSpeechError(event.error);
      if (msg) setError(msg);
    };

    rec.onend = () => {
      setListening(false);
      setInterim("");
      recRef.current = null;
    };

    try {
      rec.start();
      recRef.current = rec;
      setListening(true);
      setError(null);
      setInterim("");
    } catch (err) {
      // 이미 start된 인스턴스에 다시 start하면 InvalidStateError
      console.warn("SpeechRecognition.start 실패:", err);
      setError("음성 인식을 시작하지 못했어. 잠시 후 다시 시도해줘.");
      recRef.current = null;
      setListening(false);
    }
  }, [supported, listening, lang]);

  const stop = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      // 무시
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setInterim("");
  }, []);

  return { supported, listening, interim, error, start, stop, reset };
}
