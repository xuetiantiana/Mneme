const createSessionId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

const LANGUAGE_STORAGE_KEY = "language";
const DEFAULT_LANGUAGE = "zh";

const normalizeLanguage = (value?: string): "zh" | "en" => {
  return String(value || "").trim().toLowerCase() === "en" ? "en" : "zh";
};

const getStoredLanguage = (): "zh" | "en" => {
  if (typeof window === "undefined") {
    return DEFAULT_LANGUAGE as "zh" | "en";
  }
  return normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY) || DEFAULT_LANGUAGE);
};

let currentSessionId = createSessionId();
let currentLanguage: "zh" | "en" = getStoredLanguage();

export const getSessionId = (): string => {
  if (!currentSessionId) {
    currentSessionId = createSessionId();
  }
  return currentSessionId;
};

export const setSessionId = (value?: string): string => {
  const next = String(value || "").trim();
  currentSessionId = next || createSessionId();
  return currentSessionId;
};

export const getLanguage = (): "zh" | "en" => {
  // 每次读取都与 localStorage 同步，避免模块缓存导致语言状态滞后。
  currentLanguage = getStoredLanguage();
  return currentLanguage;
};

export const setLanguage = (value?: string): "zh" | "en" => {
  const next = normalizeLanguage(value);
  currentLanguage = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
  }
  return currentLanguage;
};
