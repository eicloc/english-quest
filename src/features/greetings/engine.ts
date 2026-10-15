import { greetingQuestions, greetingSkillLabels } from "@/content/greetings/questions";
import type { GreetingAttempt, GreetingQuestionAction, GreetingSession, GreetingSkill, GreetingSpellingAttempt, GreetingSpellingQuestion, GreetingsAction, GreetingsData, LetterTile } from "./types";

export const emptyGreetingsData = (): GreetingsData => ({ version: 1, sessions: [] });

export function getLetterTiles(question: Pick<GreetingSpellingQuestion, "word">): LetterTile[] {
  return [...question.word].map((letter, index) => ({ id: `letter-${index}`, letter }));
}

export function isSpellingCorrect(question: GreetingSpellingQuestion, selected: string[]): boolean {
  const tiles = getLetterTiles(question);
  return selected.length === tiles.length && new Set(selected).size === selected.length
    && selected.map((id) => tiles.find((tile) => tile.id === id)?.letter ?? "").join("") === question.word;
}

export function shuffleLetterIds(question: GreetingSpellingQuestion, random = Math.random): string[] {
  const tiles = getLetterTiles(question);
  const order = tiles.map((tile) => tile.id);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  // Repeated letters can make different tile IDs still spell the answer.
  if (isSpellingCorrect(question, order)) {
    const different = order.findIndex((id) => tiles.find((tile) => tile.id === id)?.letter !== question.word[0]);
    if (different > 0) [order[0], order[different]] = [order[different], order[0]];
  }
  return order;
}

export function createGreetingSession(studentName: string, soundEnabled = true, random = Math.random, id = crypto.randomUUID(), at = new Date().toISOString()): GreetingSession {
  return {
    id, studentName: studentName.trim().slice(0, 12) || "小冒险家", createdAt: at, updatedAt: at,
    currentIndex: 0, soundEnabled,
    attempts: Object.fromEntries(greetingQuestions.map((question) => [question.id, question.kind === "oral"
      ? { kind: "oral" }
      : { kind: "spelling", order: shuffleLetterIds(question, random), selected: [], submissions: 0, status: "pending" }])),
  };
}

export function isGreetingAttemptComplete(attempt: GreetingAttempt): boolean {
  return attempt.score !== undefined;
}

export function greetingCompletedCount(session: GreetingSession): number {
  return greetingQuestions.filter((question) => isGreetingAttemptComplete(session.attempts[question.id])).length;
}

function updateSpelling(question: GreetingSpellingQuestion, attempt: GreetingSpellingAttempt, action: GreetingQuestionAction): GreetingSpellingAttempt {
  if (attempt.status !== "pending") return attempt;
  switch (action.type) {
    case "SELECT_LETTER":
      if (!attempt.order.includes(action.tileId) || attempt.selected.includes(action.tileId)) return attempt;
      return { ...attempt, selected: [...attempt.selected, action.tileId] };
    case "REMOVE_LETTER":
      return { ...attempt, selected: attempt.selected.filter((id) => id !== action.tileId) };
    case "CLEAR_LETTERS":
      return { ...attempt, selected: [] };
    case "SUBMIT_SPELLING": {
      if (attempt.selected.length !== question.word.length) return attempt;
      const submissions = attempt.submissions + 1;
      if (!isSpellingCorrect(question, attempt.selected)) return { ...attempt, submissions };
      return { ...attempt, submissions, status: "correct", score: submissions === 1 ? 2 : 1 };
    }
    case "SKIP_SPELLING":
      return { ...attempt, status: "skipped", score: 0 };
    default:
      return attempt;
  }
}

export function greetingsReducer(data: GreetingsData, event: GreetingsAction): GreetingsData {
  if (event.type === "HYDRATE") return event.data;
  if (event.type === "START") {
    if (data.sessions.some((session) => session.id === event.session.id)) return data;
    return { version: 1, sessions: [event.session, ...data.sessions].slice(0, 20) };
  }
  return { ...data, sessions: data.sessions.map((session) => {
    if (session.id !== event.sessionId) return session;
    if (event.type === "TOGGLE_SOUND") return { ...session, soundEnabled: !session.soundEnabled };
    if (session.completedAt) return session;
    const question = greetingQuestions[session.currentIndex];
    const attempt = session.attempts[question.id];
    if (event.type === "NAVIGATE") {
      if (event.direction === "previous") return session.currentIndex > 0 ? { ...session, currentIndex: session.currentIndex - 1, updatedAt: event.at } : session;
      if (!isGreetingAttemptComplete(attempt)) return session;
      if (session.currentIndex === greetingQuestions.length - 1) return { ...session, completedAt: event.at, updatedAt: event.at };
      return { ...session, currentIndex: session.currentIndex + 1, updatedAt: event.at };
    }
    if (event.questionId !== question.id) return session;
    let next = attempt;
    if (question.kind === "oral" && attempt.kind === "oral" && event.action.type === "SCORE_ORAL") {
      if (![0, 1, 2].includes(event.action.score)) return session;
      next = { kind: "oral", score: event.action.score };
    } else if (question.kind === "spelling" && attempt.kind === "spelling") next = updateSpelling(question, attempt, event.action);
    return next === attempt ? session : { ...session, updatedAt: event.at, attempts: { ...session.attempts, [question.id]: next } };
  }) };
}

export function buildGreetingReport(session: GreetingSession) {
  const skills = (Object.keys(greetingSkillLabels) as GreetingSkill[]).map((skill) => {
    const questions = greetingQuestions.filter((question) => question.skill === skill);
    const earned = questions.reduce((sum, question) => sum + (session.attempts[question.id].score ?? 0), 0);
    return { skill, label: greetingSkillLabels[skill], earned, possible: questions.length * 2, completed: questions.filter((question) => isGreetingAttemptComplete(session.attempts[question.id])).length, total: questions.length };
  });
  return {
    earned: skills.reduce((sum, skill) => sum + skill.earned, 0), possible: greetingQuestions.length * 2,
    completed: greetingCompletedCount(session), skills,
    review: greetingQuestions.filter((question) => session.attempts[question.id].score !== undefined && session.attempts[question.id].score! < 2),
  };
}
