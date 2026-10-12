import { greetingQuestions } from "@/content/greetings/questions";
import { emptyGreetingsData, getLetterTiles, isSpellingCorrect } from "./engine";
import type { GreetingSession, GreetingsData } from "./types";

export const GREETINGS_STORAGE_KEY = "english-greetings-quest:v1";
let memoryFallback = emptyGreetingsData();

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const isDate = (value: unknown): value is string => typeof value === "string" && Number.isFinite(Date.parse(value));

function isValidSession(value: unknown): value is GreetingSession {
  if (!isObject(value) || typeof value.id !== "string" || !value.id || typeof value.studentName !== "string" || !value.studentName.trim() || value.studentName.length > 12) return false;
  if (!isDate(value.createdAt) || !isDate(value.updatedAt) || (value.completedAt !== undefined && !isDate(value.completedAt))) return false;
  if (!Number.isInteger(value.currentIndex) || Number(value.currentIndex) < 0 || Number(value.currentIndex) >= greetingQuestions.length || typeof value.soundEnabled !== "boolean" || !isObject(value.attempts)) return false;
  if (Object.keys(value.attempts).length !== greetingQuestions.length) return false;
  let firstUnfinished = greetingQuestions.length;
  for (const [index, question] of greetingQuestions.entries()) {
    const attempt = value.attempts[question.id];
    if (!isObject(attempt) || attempt.kind !== question.kind) return false;
    if (attempt.score !== undefined && attempt.score !== 0 && attempt.score !== 1 && attempt.score !== 2) return false;
    if (attempt.score === undefined) firstUnfinished = Math.min(firstUnfinished, index);
    else if (firstUnfinished < index) return false;
    if (question.kind !== "spelling") continue;
    const tiles = getLetterTiles(question).map((tile) => tile.id);
    if (!Array.isArray(attempt.order) || attempt.order.length !== tiles.length || new Set(attempt.order).size !== tiles.length || !attempt.order.every((id) => typeof id === "string" && tiles.includes(id))) return false;
    if (!Array.isArray(attempt.selected) || new Set(attempt.selected).size !== attempt.selected.length || !attempt.selected.every((id) => typeof id === "string" && tiles.includes(id))) return false;
    if (!Number.isSafeInteger(attempt.submissions) || Number(attempt.submissions) < 0) return false;
    if (attempt.status === "pending") {
      if (attempt.score !== undefined) return false;
    } else if (attempt.status === "correct") {
      if (!isSpellingCorrect(question, attempt.selected as string[]) || Number(attempt.submissions) < 1 || attempt.score !== (attempt.submissions === 1 ? 2 : 1)) return false;
    } else if (attempt.status === "skipped") {
      if (attempt.score !== 0) return false;
    } else return false;
  }
  if (Number(value.currentIndex) > Math.min(firstUnfinished, greetingQuestions.length - 1)) return false;
  if (value.completedAt !== undefined && (firstUnfinished !== greetingQuestions.length || value.currentIndex !== greetingQuestions.length - 1)) return false;
  return true;
}

export function parseGreetingsData(raw: string | null): GreetingsData {
  if (!raw) return emptyGreetingsData();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isObject(parsed) || parsed.version !== 1 || !Array.isArray(parsed.sessions)) return emptyGreetingsData();
    const ids = new Set<string>();
    const sessions = parsed.sessions.filter((session): session is GreetingSession => {
      if (!isValidSession(session) || ids.has(session.id)) return false;
      ids.add(session.id);
      return true;
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 20);
    return { version: 1, sessions };
  } catch {
    return emptyGreetingsData();
  }
}

export function loadGreetingsData(): { data: GreetingsData; storageAvailable: boolean } {
  if (typeof window === "undefined") return { data: emptyGreetingsData(), storageAvailable: true };
  try {
    memoryFallback = parseGreetingsData(window.localStorage.getItem(GREETINGS_STORAGE_KEY));
    return { data: memoryFallback, storageAvailable: true };
  } catch {
    return { data: memoryFallback, storageAvailable: false };
  }
}

export function saveGreetingsData(data: GreetingsData): boolean {
  memoryFallback = { version: 1, sessions: data.sessions.slice(0, 20) };
  if (typeof window === "undefined") return true;
  try {
    window.localStorage.setItem(GREETINGS_STORAGE_KEY, JSON.stringify(memoryFallback));
    return true;
  } catch {
    return false;
  }
}
