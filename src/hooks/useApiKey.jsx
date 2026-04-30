import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  getApiKey,
  setApiKey as saveApiKeyInDb,
  clearApiKey as removeApiKeyInDb,
  getModel,
  setModel as saveModelInDb,
} from "../services/settingsRepo";

const ApiKeyContext = createContext(null);

/**
 * IndexedDB에 저장된 API 키와 모델을 전역 상태로 관리한다.
 *
 * 핵심: 모든 useApiKey() 호출이 같은 Context를 공유하므로,
 * 한 컴포넌트에서 saveKey/clearKey를 호출하면 다른 모든 소비자가 즉시 리렌더된다.
 */
export function ApiKeyProvider({ children }) {
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
    await saveApiKeyInDb(newKey);
    setApiKeyState(newKey);
  }, []);

  const clearKey = useCallback(async () => {
    await removeApiKeyInDb();
    setApiKeyState(null);
  }, []);

  const changeModel = useCallback(async (modelId) => {
    await saveModelInDb(modelId);
    setModelState(modelId);
  }, []);

  const value = { apiKey, model, loading, saveKey, clearKey, changeModel };

  return (
    <ApiKeyContext.Provider value={value}>{children}</ApiKeyContext.Provider>
  );
}

export function useApiKey() {
  const ctx = useContext(ApiKeyContext);
  if (!ctx) {
    throw new Error("useApiKey must be used inside ApiKeyProvider");
  }
  return ctx;
}

/**
 * API 키 마스킹 — UI 표시용.
 */
export function maskApiKey(key) {
  if (!key) return "";
  if (key.length <= 14) return key;
  return `${key.slice(0, 10)}...${key.slice(-4)}`;
}
