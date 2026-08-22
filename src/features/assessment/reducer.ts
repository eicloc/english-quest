import { questionById } from "@/content/questions";
import type {
  AssessmentAction,
  AssessmentSession,
  PersistedAssessmentData,
  QuestionAttempt,
} from "./types";

function updateSession(
  data: PersistedAssessmentData,
  sessionId: string,
  update: (session: AssessmentSession) => AssessmentSession,
): PersistedAssessmentData {
  return {
    ...data,
    sessions: data.sessions.map((session) => (session.id === sessionId ? update(session) : session)),
  };
}

function makeAttempt(questionId: string): QuestionAttempt {
  return {
    questionId,
    startedAt: new Date().toISOString(),
    attempts: 0,
    selectedOptionIds: [],
    hintUsed: false,
    answerRevealed: false,
    skipped: false,
  };
}

function updateAttempt(
  session: AssessmentSession,
  questionId: string,
  update: (attempt: QuestionAttempt) => QuestionAttempt,
) {
  const existing = session.attempts.find((attempt) => attempt.questionId === questionId);
  const next = update(existing ?? makeAttempt(questionId));
  return {
    ...session,
    attempts: existing
      ? session.attempts.map((attempt) => (attempt.questionId === questionId ? next : attempt))
      : [...session.attempts, next],
  };
}

export function assessmentReducer(
  data: PersistedAssessmentData,
  action: AssessmentAction,
): PersistedAssessmentData {
  switch (action.type) {
    case "HYDRATE":
      return action.data;
    case "CREATE_SESSION":
      return {
        ...data,
        sessions: [action.session, ...data.sessions.filter((session) => session.id !== action.session.id)].slice(0, 20),
        activeSessionId: action.session.id,
      };
    case "SET_ACTIVE_SESSION":
      return { ...data, activeSessionId: action.sessionId };
    case "START_STAGE":
      return updateSession(data, action.sessionId, (session) => ({
        ...session,
        currentStageId: action.stageId,
        currentQuestionIndex: 0,
        status: "active",
      }));
    case "SUBMIT_AUTO_ANSWER":
      return updateSession(data, action.sessionId, (session) =>
        updateAttempt(session, action.questionId, (attempt) => {
          if (attempt.completedAt) return attempt;
          const attempts = attempt.attempts + 1;
          const completed = action.correct || attempts >= 2;
          const now = new Date();
          return {
            ...attempt,
            attempts,
            selectedOptionIds: [...attempt.selectedOptionIds, action.optionId],
            isCorrect: action.correct,
            completedAt: completed ? now.toISOString() : undefined,
            durationMs: completed ? now.getTime() - new Date(attempt.startedAt).getTime() : undefined,
          };
        }),
      );
    case "SUBMIT_MANUAL_SCORE":
      return updateSession(data, action.sessionId, (session) =>
        updateAttempt(session, action.questionId, (attempt) => ({
          ...attempt,
          attempts: 1,
          manualScore: action.score,
          skipped: false,
          completedAt: new Date().toISOString(),
          durationMs: Date.now() - new Date(attempt.startedAt).getTime(),
        })),
      );
    case "SUBMIT_WORD_SCORE":
      return updateSession(data, action.sessionId, (session) =>
        updateAttempt(session, action.questionId, (attempt) => {
          const wordScores = { ...attempt.wordScores, [action.field]: action.score };
          const completed = wordScores.pronunciation !== undefined && wordScores.meaning !== undefined;
          return {
            ...attempt,
            attempts: 1,
            wordScores,
            skipped: false,
            completedAt: completed ? new Date().toISOString() : undefined,
            durationMs: completed ? Date.now() - new Date(attempt.startedAt).getTime() : undefined,
          };
        }),
      );
    case "USE_HINT":
      return updateSession(data, action.sessionId, (session) =>
        updateAttempt(session, action.questionId, (attempt) => ({ ...attempt, hintUsed: true })),
      );
    case "REVEAL_ANSWER":
      return updateSession(data, action.sessionId, (session) =>
        updateAttempt(session, action.questionId, (attempt) => {
          const question = questionById[action.questionId];
          const isAutomatic = question && !["oral-manual", "word-reading-manual", "phonics-manual"].includes(question.type);
          return {
            ...attempt,
            answerRevealed: true,
            completedAt: isAutomatic ? new Date().toISOString() : attempt.completedAt,
          };
        }),
      );
    case "SKIP_QUESTION":
      return updateSession(data, action.sessionId, (session) =>
        updateAttempt(session, action.questionId, (attempt) => ({
          ...attempt,
          skipped: true,
          isCorrect: false,
          completedAt: new Date().toISOString(),
          durationMs: Date.now() - new Date(attempt.startedAt).getTime(),
        })),
      );
    case "RETRY_QUESTION":
      return updateSession(data, action.sessionId, (session) => ({
        ...session,
        attempts: session.attempts.filter((attempt) => attempt.questionId !== action.questionId),
      }));
    case "NEXT_QUESTION":
      return updateSession(data, action.sessionId, (session) => ({
        ...session,
        currentQuestionIndex: Math.min(
          session.currentQuestionIndex + 1,
          Math.max(0, (session.questionOrder[session.currentStageId]?.length ?? 1) - 1),
        ),
      }));
    case "PREVIOUS_QUESTION":
      return updateSession(data, action.sessionId, (session) => ({
        ...session,
        currentQuestionIndex: Math.max(0, session.currentQuestionIndex - 1),
      }));
    case "COMPLETE_STAGE":
      return updateSession(data, action.sessionId, (session) => ({
        ...session,
        completedStageIds: Array.from(new Set([...session.completedStageIds, action.stageId])),
        badges: Array.from(new Set([...session.badges, action.stageId])),
        currentStageId: action.nextStageId ?? session.currentStageId,
        currentQuestionIndex: 0,
      }));
    case "COMPLETE_SESSION":
      return {
        ...updateSession(data, action.sessionId, (session) => ({
          ...session,
          status: "completed",
          completedAt: new Date().toISOString(),
        })),
        activeSessionId: data.activeSessionId === action.sessionId ? undefined : data.activeSessionId,
      };
    case "ADD_NOTE":
      return updateSession(data, action.sessionId, (session) =>
        updateAttempt(session, action.questionId, (attempt) => ({ ...attempt, note: action.note })),
      );
    case "SET_OVERALL_NOTE":
      return updateSession(data, action.sessionId, (session) => ({ ...session, overallNote: action.note }));
    case "TOGGLE_SETTING":
      return updateSession(data, action.sessionId, (session) => ({
        ...session,
        settings: { ...session.settings, [action.setting]: !session.settings[action.setting] },
      }));
    case "PAUSE_SESSION":
      return updateSession(data, action.sessionId, (session) => ({ ...session, status: "paused" }));
    case "RESUME_SESSION":
      return {
        ...updateSession(data, action.sessionId, (session) => ({ ...session, status: "active" })),
        activeSessionId: action.sessionId,
      };
    case "RESET_SESSION":
      return {
        ...data,
        sessions: [action.reset, ...data.sessions.filter((session) => session.id !== action.sessionId)].slice(0, 20),
        activeSessionId: action.reset.id,
      };
    case "DELETE_SESSION":
      return {
        ...data,
        sessions: data.sessions.filter((session) => session.id !== action.sessionId),
        activeSessionId: data.activeSessionId === action.sessionId ? undefined : data.activeSessionId,
      };
    case "CLEAR_HISTORY":
      return {
        ...data,
        sessions: data.sessions.filter((session) => session.id === data.activeSessionId),
      };
    default:
      return data;
  }
}
