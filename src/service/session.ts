const createSessionId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

let currentSessionId = createSessionId();

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
