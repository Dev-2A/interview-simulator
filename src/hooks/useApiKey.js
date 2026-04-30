import { useCallback, useEffect, useState } from "react";
import {
  getApiKey,
  setApiKey as saveApiKey,
  clearApiKey as removeApiKeyInDb,
  getModel,
  setModel as saveModel,
} from "../services/settingsRepo";

/**
 * IndexedDB에 저장된 API 키와 모델을 관리하는 훅.
 *
 * 반환값:
 * - apiKey: 저장된 키 (없으면 null)
 * - model: 저장된 모델 ID (없으면 DEFAULT_MODEL)
 * - loading: 초기 로딩 여부
 * - saveKey(newKey), clearKey(), changeModel(modelId)
 */
export function useApiKey() {
  const [apiKey, setApiKeyState] = useState(null);
  const [model, setModelState] = useState(null);
  const [loading, setLoading] = useState(true);

  // 초기 로드
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [key, m] = await Promise.all([getApiKey(), getModel()]);
      if (cancelled) return;
      setApiKeyState(key);
      setModelState(m);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveKey = useCallback(async (newKey) => {
    await saveApiKey(newKey);
    setApiKeyState(newKey);
  }, []);

  const clearKey = useCallback(async () => {
    await removeApiKeyInDb();
    setApiKeyState(null);
  }, []);

  const changeModel = useCallback(async (modelId) => {
    await saveModel(modelId);
    setModelState(modelId);
  }, []);

  return { apiKey, model, loading, saveKey, clearKey, changeModel };
}

/**
 * API 키 마스킹 — UI 표시용.
 * "sk-ant-api03-AbC...XyZ" 형태로 줄여 보여준다.
 */
export function maskApiKey(key) {
  if (!key) return "";
  if (key.length <= 14) return key;
  return `${key.slice(0, 10)}...${key.slice(-4)}`;
}
