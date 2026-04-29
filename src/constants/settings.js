/**
 * settings 테이블의 key 상수.
 * Dexie의 settings 테이블은 단순한 key-value 스토어로 사용한다.
 */

export const SETTING_KEYS = {
  API_KEY: "apiKey", // Anthropic API key
  MODEL: "model", // 사용할 Claude 모델 식별자
};

// 사용 가능한 Claude 모델 (Step 4 API 키 설정 화면에서 사용)
export const CLAUDE_MODELS = [
  { id: "claude-opus-4-7", label: "Claude Opus 4.7 (가장 똑똑함, 비쌈)" },
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 (균형, 추천)" },
  { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5 (빠르고 저렴)" },
];

export const DEFAULT_MODEL = "claude-sonnet-4-6";
