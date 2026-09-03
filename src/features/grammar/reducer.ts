import { grammarQuestionById } from "@/content/grammar/questions";
import { evaluateGrammarResponse } from "./evaluator";
import type { GrammarAction, GrammarAttempt, GrammarSession, PersistedGrammarData } from "./types";

function updateSession(data: PersistedGrammarData, sessionId: string, update: (session: GrammarSession) => GrammarSession): PersistedGrammarData {
  return { ...data, sessions: data.sessions.map((session) => session.id === sessionId ? update(session) : session) };
}

function makeAttempt(questionId: string): GrammarAttempt {
  return { questionId, startedAt: new Date().toISOString(), responses: [], attempts: 0, answerRevealed: false, hintUsed: false };
}

function submitTo(attempts: GrammarAttempt[], questionId: string, response: GrammarAttempt["responses"][number]) {
  const existing = attempts.find((attempt) => attempt.questionId === questionId);
  if (existing?.completedAt) return attempts;
  const attempt = existing ?? makeAttempt(questionId);
  const question = grammarQuestionById[questionId];
  if (!question) return attempts;
  const correct = evaluateGrammarResponse(question, response);
  const nextCount = attempt.attempts + 1;
  const completed = correct || nextCount >= 2;
  const now = new Date();
  const next: GrammarAttempt = {
    ...attempt,
    responses: [...attempt.responses, response],
    attempts: nextCount,
    firstTryCorrect: attempt.firstTryCorrect ?? correct,
    isCorrect: correct,
    hintUsed: attempt.hintUsed || !correct,
    answerRevealed: !correct && completed,
    completedAt: completed ? now.toISOString() : undefined,
    durationMs: completed ? now.getTime() - new Date(attempt.startedAt).getTime() : undefined,
  };
  return existing ? attempts.map((item) => item.questionId === questionId ? next : item) : [...attempts, next];
}

export function grammarReducer(data: PersistedGrammarData, action: GrammarAction): PersistedGrammarData {
  switch (action.type) {
    case "HYDRATE": return action.data;
    case "CREATE_SESSION": return { ...data, sessions: [action.session, ...data.sessions.filter((session) => session.id !== action.session.id)].slice(0, 20), activeSessionId: action.session.id };
    case "START_STAGE": return updateSession(data, action.sessionId, (session) => ({ ...session, currentStageId: action.stageId, currentQuestionIndex: 0, inReview: false, status: "active" }));
    case "SUBMIT_RESPONSE": return updateSession(data, action.sessionId, (session) => action.review ? { ...session, reviewAttempts: submitTo(session.reviewAttempts, action.questionId, action.response) } : { ...session, attempts: submitTo(session.attempts, action.questionId, action.response) });
    case "NEXT_QUESTION":
      return updateSession(data, action.sessionId, (session) => action.review
        ? { ...session, reviewIndex: Math.min(session.reviewIndex + 1, Math.max(0, session.reviewOrder.length - 1)) }
        : { ...session, currentQuestionIndex: Math.min(session.currentQuestionIndex + 1, Math.max(0, (session.questionOrder[session.currentStageId]?.length ?? 1) - 1)) });
    case "PREVIOUS_QUESTION":
      return updateSession(data, action.sessionId, (session) => action.review
        ? { ...session, reviewIndex: Math.max(0, session.reviewIndex - 1) }
        : { ...session, currentQuestionIndex: Math.max(0, session.currentQuestionIndex - 1) });
    case "COMPLETE_STAGE": return updateSession(data, action.sessionId, (session) => ({ ...session, completedStageIds: Array.from(new Set([...session.completedStageIds, action.stageId])), badges: Array.from(new Set([...session.badges, action.stageId])), currentStageId: action.nextStageId ?? session.currentStageId, currentQuestionIndex: 0 }));
    case "BEGIN_REVIEW": return updateSession(data, action.sessionId, (session) => ({ ...session, inReview: true, reviewOrder: action.questionIds, reviewIndex: 0 }));
    case "COMPLETE_SESSION": return { ...updateSession(data, action.sessionId, (session) => ({ ...session, status: "completed", completedAt: new Date().toISOString() })), activeSessionId: data.activeSessionId === action.sessionId ? undefined : data.activeSessionId };
    case "TOGGLE_SETTING": return updateSession(data, action.sessionId, (session) => ({ ...session, settings: { ...session.settings, [action.setting]: !session.settings[action.setting] } }));
    case "PAUSE_SESSION": return updateSession(data, action.sessionId, (session) => ({ ...session, status: "paused" }));
    case "RESUME_SESSION": return { ...updateSession(data, action.sessionId, (session) => ({ ...session, status: "active" })), activeSessionId: action.sessionId };
    case "RESET_SESSION": return { ...data, sessions: [action.reset, ...data.sessions.filter((session) => session.id !== action.sessionId)].slice(0, 20), activeSessionId: action.reset.id };
    case "CLEAR_HISTORY": return { ...data, sessions: data.sessions.filter((session) => session.id === data.activeSessionId) };
    default: return data;
  }
}
