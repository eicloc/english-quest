import type { GrammarSession, PersistedGrammarData } from "./types";

export const GRAMMAR_STORAGE_KEY = "english-grammar-quest:v1";
export const EMPTY_GRAMMAR_DATA: PersistedGrammarData = { version: 1, sessions: [] };
let memoryFallback = EMPTY_GRAMMAR_DATA;

export function parsePersistedGrammarData(raw: string | null): PersistedGrammarData {
  if (!raw) return EMPTY_GRAMMAR_DATA;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null && "version" in parsed && parsed.version === 1 && "sessions" in parsed && Array.isArray(parsed.sessions)) return parsed as PersistedGrammarData;
  } catch {
    return EMPTY_GRAMMAR_DATA;
  }
  return EMPTY_GRAMMAR_DATA;
}

export function loadPersistedGrammarData(): { data: PersistedGrammarData; storageAvailable: boolean } {
  if (typeof window === "undefined") return { data: EMPTY_GRAMMAR_DATA, storageAvailable: true };
  try {
    const data = parsePersistedGrammarData(window.localStorage.getItem(GRAMMAR_STORAGE_KEY));
    memoryFallback = data;
    return { data, storageAvailable: true };
  } catch {
    return { data: memoryFallback, storageAvailable: false };
  }
}

export function savePersistedGrammarData(data: PersistedGrammarData): boolean {
  const trimmed = { ...data, sessions: [...data.sessions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 20) };
  memoryFallback = trimmed;
  if (typeof window === "undefined") return true;
  try {
    window.localStorage.setItem(GRAMMAR_STORAGE_KEY, JSON.stringify(trimmed));
    return true;
  } catch {
    return false;
  }
}

export function findGrammarSession(data: PersistedGrammarData, sessionId: string): GrammarSession | undefined {
  return data.sessions.find((session) => session.id === sessionId);
}
