import { db } from "./db";
import { SETTING_KEYS, DEFAULT_MODEL } from "../constants/settings";

/**
 * settings 테이블 CRUD.
 * 단순한 key-value 스토어로 사용한다.
 */

export async function getSetting(key) {
  const row = await db.settings.get(key);
  return row?.value ?? null;
}

export async function setSetting(key, value) {
  await db.settings.put({ key, value });
}

export async function removeSetting(key) {
  await db.settings.delete(key);
}

// ─── 편의 함수 ───────────────────────────────────────────

export async function getApiKey() {
  return getSetting(SETTING_KEYS.API_KEY);
}

export async function setApiKey(apiKey) {
  return setSetting(SETTING_KEYS.API_KEY, apiKey);
}

export async function clearApiKey() {
  return removeSetting(SETTING_KEYS.API_KEY);
}

export async function getModel() {
  const stored = await getSetting(SETTING_KEYS.MODEL);
  return stored || DEFAULT_MODEL;
}

export async function setModel(modelId) {
  return setSetting(SETTING_KEYS.MODEL, modelId);
}
