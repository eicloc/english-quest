import type { AssessmentSession, PersistedAssessmentData } from "./types";

export const STORAGE_KEY = "english-quest:v1";
export const EMPTY_DATA: PersistedAssessmentData = { version: 1, sessions: [] };

let memoryFallback: PersistedAssessmentData = EMPTY_DATA;

export function parsePersistedData(raw: string | null): PersistedAssessmentData {
  if (!raw) return EMPTY_DATA;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "version" in parsed &&
      parsed.version === 1 &&
      "sessions" in parsed &&
      Array.isArray(parsed.sessions)
    ) {
      return parsed as PersistedAssessmentData;
    }
  } catch {
    return EMPTY_DATA;
  }
  return EMPTY_DATA;
}

export function loadPersistedData(): { data: PersistedAssessmentData; storageAvailable: boolean } {
  if (typeof window === "undefined") return { data: EMPTY_DATA, storageAvailable: true };
  try {
    const data = parsePersistedData(window.localStorage.getItem(STORAGE_KEY));
    memoryFallback = data;
    return { data, storageAvailable: true };
  } catch {
    return { data: memoryFallback, storageAvailable: false };
  }
}

export function savePersistedData(data: PersistedAssessmentData): boolean {
  const trimmed: PersistedAssessmentData = {
    ...data,
    sessions: [...data.sessions]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20),
  };
  memoryFallback = trimmed;
  if (typeof window === "undefined") return true;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    return true;
  } catch {
    return false;
  }
}

export function findSession(data: PersistedAssessmentData, sessionId: string): AssessmentSession | undefined {
  return data.sessions.find((session) => session.id === sessionId);
}
