import { practiceQuests, practiceSkills } from "@/content/unit-practice";
import type { PracticeAction, PracticeAttempt, PracticeData, PracticeInput, PracticeQuestion, PracticeQuestId, PracticeSession, PracticeSkill, PracticeTilesAttempt } from "./types";

export const emptyPracticeData = (): PracticeData => ({ version: 1, sessions: [] });
export function getPracticeTiles(question: PracticeQuestion) {
  if (question.kind === "oral") return [];
  return (question.kind === "spelling" ? [...question.word] : question.tokens).map((label, i) => ({ id: `${question.kind === "spelling" ? "letter" : "token"}-${i}`, label }));
}
export function isPracticeCorrect(question: PracticeQuestion, selected: string[]) {
  const tiles = getPracticeTiles(question);
  if (!tiles.length || selected.length !== tiles.length || new Set(selected).size !== selected.length) return false;
  return selected.every((id, i) => tiles.find((tile) => tile.id === id)?.label === tiles[i].label);
}
export function shuffledPracticeOrder(question: PracticeQuestion, random = Math.random) {
  const tiles = getPracticeTiles(question), order = tiles.map((tile) => tile.id);
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  if (isPracticeCorrect(question, order)) {
    const different = order.findIndex((id) => tiles.find((tile) => tile.id === id)?.label !== tiles[0].label);
    if (different > 0) [order[0], order[different]] = [order[different], order[0]];
  }
  return order;
}
export function createPracticeSession(questId: PracticeQuestId, studentName: string, soundEnabled = true, random = Math.random, id = crypto.randomUUID(), at = new Date().toISOString()): PracticeSession {
  return { id, questId, studentName: studentName.trim().slice(0, 12) || "小冒险家", soundEnabled, currentIndex: 0, createdAt: at, updatedAt: at,
    attempts: Object.fromEntries(practiceQuests[questId].questions.map((q) => [q.id, q.kind === "oral" ? { kind: "oral" } : { kind: q.kind, order: shuffledPracticeOrder(q, random), selected: [], submissions: 0, status: "pending" }])) };
}
export function trimPracticeSessions(sessions: PracticeSession[]) {
  const counts = new Map<PracticeQuestId, number>();
  return sessions.filter((s) => { const count = (counts.get(s.questId) ?? 0) + 1; counts.set(s.questId, count); return count <= 20; });
}
export function practiceCompletedCount(session: PracticeSession) {
  return practiceQuests[session.questId].questions.filter((q) => session.attempts[q.id].score !== undefined).length;
}
function updateTiles(question: PracticeQuestion, attempt: PracticeTilesAttempt, input: PracticeInput): PracticeTilesAttempt {
  if (attempt.status !== "pending") return attempt;
  if (input.type === "SELECT") return !attempt.order.includes(input.tileId) || attempt.selected.includes(input.tileId) ? attempt : { ...attempt, selected: [...attempt.selected, input.tileId] };
  if (input.type === "REMOVE") return { ...attempt, selected: attempt.selected.filter((id) => id !== input.tileId) };
  if (input.type === "CLEAR") return { ...attempt, selected: [] };
  if (input.type === "SKIP") return { ...attempt, status: "skipped", score: 0 };
  if (input.type !== "SUBMIT" || attempt.selected.length !== attempt.order.length) return attempt;
  const submissions = attempt.submissions + 1;
  return isPracticeCorrect(question, attempt.selected) ? { ...attempt, submissions, status: "correct", score: submissions === 1 ? 2 : 1 } : { ...attempt, submissions };
}
export function practiceReducer(data: PracticeData, event: PracticeAction): PracticeData {
  if (event.type === "HYDRATE") return event.data;
  if (event.type === "START") return data.sessions.some((s) => s.id === event.session.id) ? data : { version: 1, sessions: trimPracticeSessions([event.session, ...data.sessions]) };
  return { ...data, sessions: data.sessions.map((s) => {
    if (s.id !== event.sessionId) return s;
    if (event.type === "TOGGLE_SOUND") return { ...s, soundEnabled: !s.soundEnabled };
    if (s.completedAt) return s;
    const questions = practiceQuests[s.questId].questions, question = questions[s.currentIndex], attempt = s.attempts[question.id];
    if (event.type === "NAVIGATE") {
      if (event.direction === "previous") return s.currentIndex > 0 ? { ...s, currentIndex: s.currentIndex - 1, updatedAt: event.at } : s;
      if (attempt.score === undefined) return s;
      return s.currentIndex === questions.length - 1 ? { ...s, completedAt: event.at, updatedAt: event.at } : { ...s, currentIndex: s.currentIndex + 1, updatedAt: event.at };
    }
    if (event.questionId !== question.id) return s;
    let next: PracticeAttempt = attempt;
    if (attempt.kind === "oral" && event.input.type === "SCORE" && [0, 1, 2].includes(event.input.score)) next = { kind: "oral", score: event.input.score };
    else if (attempt.kind !== "oral") next = updateTiles(question, attempt, event.input);
    return next === attempt ? s : { ...s, updatedAt: event.at, attempts: { ...s.attempts, [question.id]: next } };
  }) };
}
export function buildPracticeReport(session: PracticeSession) {
  const questions = practiceQuests[session.questId].questions;
  const skills = (Object.keys(practiceSkills) as PracticeSkill[]).map((skill) => {
    const qs = questions.filter((q) => q.skill === skill);
    return { skill, label: practiceSkills[skill], earned: qs.reduce((n, q) => n + (session.attempts[q.id].score ?? 0), 0), possible: qs.length * 2, completed: qs.filter((q) => session.attempts[q.id].score !== undefined).length, total: qs.length };
  });
  return { earned: skills.reduce((n, s) => n + s.earned, 0), possible: questions.length * 2, completed: practiceCompletedCount(session), skills,
    review: questions.filter((q) => session.attempts[q.id].score !== undefined && session.attempts[q.id].score! < 2) };
}
