import { practiceCollections, practiceQuests } from "@/content/unit-practice";
import { emptyPracticeData, getPracticeTiles, isPracticeCorrect, trimPracticeSessions } from "./engine";
import type { PracticeCollection, PracticeData, PracticeQuestId, PracticeSession } from "./types";

const memory: Partial<Record<PracticeCollection, PracticeData>> = {};
const object = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const date = (v: unknown): v is string => typeof v === "string" && Number.isFinite(Date.parse(v));
function validSession(v: unknown, collection: PracticeCollection): v is PracticeSession {
  if (!object(v) || typeof v.questId !== "string" || !Object.hasOwn(practiceQuests, v.questId)) return false;
  const quest = practiceQuests[v.questId as PracticeQuestId];
  if (quest.collection !== collection || typeof v.id !== "string" || !v.id || typeof v.studentName !== "string" || !v.studentName.trim() || v.studentName.length > 12) return false;
  if (!date(v.createdAt) || !date(v.updatedAt) || (v.completedAt !== undefined && !date(v.completedAt)) || typeof v.soundEnabled !== "boolean") return false;
  if (!Number.isInteger(v.currentIndex) || Number(v.currentIndex) < 0 || Number(v.currentIndex) >= quest.questions.length || !object(v.attempts) || Object.keys(v.attempts).length !== quest.questions.length) return false;
  let firstUnfinished = quest.questions.length;
  for (const [index, question] of quest.questions.entries()) {
    const a = v.attempts[question.id];
    if (!object(a) || a.kind !== question.kind || (a.score !== undefined && a.score !== 0 && a.score !== 1 && a.score !== 2)) return false;
    if (a.score === undefined) firstUnfinished = Math.min(firstUnfinished, index);
    else if (firstUnfinished < index) return false;
    if (question.kind === "oral") continue;
    const ids = getPracticeTiles(question).map((t) => t.id);
    if (!Array.isArray(a.order) || a.order.length !== ids.length || new Set(a.order).size !== ids.length || !a.order.every((id) => typeof id === "string" && ids.includes(id))) return false;
    if (!Array.isArray(a.selected) || new Set(a.selected).size !== a.selected.length || !a.selected.every((id) => typeof id === "string" && ids.includes(id))) return false;
    if (!Number.isSafeInteger(a.submissions) || Number(a.submissions) < 0) return false;
    if (a.status === "pending") { if (a.score !== undefined) return false; }
    else if (a.status === "skipped") { if (a.score !== 0) return false; }
    else if (a.status === "correct") {
      if (!isPracticeCorrect(question, a.selected as string[]) || Number(a.submissions) < 1 || a.score !== (a.submissions === 1 ? 2 : 1)) return false;
    } else return false;
  }
  if (Number(v.currentIndex) > Math.min(firstUnfinished, quest.questions.length - 1)) return false;
  return v.completedAt === undefined || (firstUnfinished === quest.questions.length && v.currentIndex === quest.questions.length - 1);
}
export function parsePracticeData(raw: string | null, collection: PracticeCollection): PracticeData {
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (!object(parsed) || parsed.version !== 1 || !Array.isArray(parsed.sessions)) return emptyPracticeData();
    const ids = new Set<string>();
    const sessions = parsed.sessions.filter((s): s is PracticeSession => { if (!validSession(s, collection) || ids.has(s.id)) return false; ids.add(s.id); return true; });
    return { version: 1, sessions: trimPracticeSessions(sessions.sort((a, b) => b.createdAt.localeCompare(a.createdAt))) };
  } catch { return emptyPracticeData(); }
}
export function loadPracticeData(collection: PracticeCollection) {
  if (typeof window === "undefined") return { data: emptyPracticeData(), storageAvailable: true };
  try {
    const data = parsePracticeData(window.localStorage.getItem(practiceCollections[collection].storageKey), collection);
    memory[collection] = data;
    return { data, storageAvailable: true };
  } catch { return { data: memory[collection] ?? emptyPracticeData(), storageAvailable: false }; }
}
export function savePracticeData(data: PracticeData, collection: PracticeCollection) {
  const clean: PracticeData = { version: 1, sessions: trimPracticeSessions(data.sessions.filter((s) => practiceQuests[s.questId].collection === collection)) };
  memory[collection] = clean;
  if (typeof window === "undefined") return true;
  try { window.localStorage.setItem(practiceCollections[collection].storageKey, JSON.stringify(clean)); return true; }
  catch { return false; }
}
