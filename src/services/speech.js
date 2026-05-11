/**
 * Web Speech API (SpeechRecognition) 추상화.
 *
 * Chrome/Edge/Safari가 지원하고, Firefox는 미지원 (2026년 기준).
 * 이 모듈은 미지원 브라우저에서도 import 자체는 안전하게 동작하도록 만든다.
 */

/**
 * 브라우저가 SpeechRecognition을 지원하는지 확인.
 * @returns {boolean}
 */
export function isSpeechSupported() {
  if (typeof window === "undefined") return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * 마이크 권한 상태 사전 조회 (Permissions API 기반).
 * 일부 브라우저는 이 쿼리를 지원하지 않으므로 'unknown'을 돌려줄 수 있다.
 *
 * @returns {Promise<'granted' | 'denied' | 'prompt' | 'unknown'>}
 */
export async function queryMicPermission() {
  try {
    if (!navigator.permissions?.query) return "unknown";
    const status = await navigator.permissions.query({ name: "microphone" });
    return status.state;
  } catch {
    return "unknown";
  }
}

/**
 * SpeechRecognition 인스턴스 생성. 미지원이면 null.
 *
 * @param {Object} opts
 * @param {string} [opts.lang='ko-KR']
 * @param {boolean} [opts.continuous=true]   — 사용자가 멈추기 전까지 계속 인식
 * @param {boolean} [opts.interimResults=true] — 중간 결과 스트림 (미확정 텍스트)
 * @returns {SpeechRecognition | null}
 */
export function createRecognition({
  lang = "ko-KR",
  continuous = true,
  interimResults = true,
} = {}) {
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Ctor) return null;

  const rec = new Ctor();
  rec.lang = lang;
  rec.continuous = continuous;
  rec.interimResults = interimResults;
  return rec;
}

/**
 * SpeechRecognition 에러 코드를 사용자 친화 메시지로 변환.
 *
 * 표준 에러 코드:
 * - 'not-allowed'        : 권한 거부
 * - 'service-not-allowed': 시스템/브라우저 정책에 의한 차단
 * - 'no-speech'          : 일정 시간 동안 발화 없음
 * - 'audio-capture'      : 마이크 장치 없음
 * - 'network'            : 네트워크 인식 서버 호출 실패
 * - 'aborted'            : 사용자가 중단
 */
export function describeSpeechError(code) {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return '마이크 권한이 차단돼 있어. 브라우저 주소창의 자물쇠 → 사이트 설정 → 마이크를 "허용"으로 바꿔줘.';
    case "no-speech":
      return "아무 음성도 감지되지 않았어. 마이크가 너무 멀거나 음소거 상태일 수 있어.";
    case "audio-capture":
      return "마이크 장치를 찾지 못했어. 외부 마이크라면 연결 상태를 확인해줘.";
    case "network":
      return "음성 인식 서버에 연결하지 못했어. 인터넷 연결을 확인해줘.";
    case "aborted":
      return null; // 사용자가 직접 중단한 경우 — 에러로 노출하지 않음
    default:
      return `음성 인식에 실패했어 (${code ?? "unknown"}).`;
  }
}
