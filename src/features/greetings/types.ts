import type { ManualScore } from "@/features/assessment/types";

export type GreetingPart = "hello" | "how-are-you";
export type GreetingSkill = "responding" | "initiating" | "hello-spelling" | "how-spelling";
export type GreetingStage = "hello-oral" | "hello-spelling" | "how-oral" | "how-spelling";

type QuestionBase = { id: string; part: GreetingPart; stage: GreetingStage; skill: GreetingSkill };

export type GreetingOralQuestion = QuestionBase & {
  kind: "oral";
  instructionZh: string;
  speaker?: string;
  promptEn?: string;
  translationZh?: string;
  sceneZh?: string;
  examples: { en: string; zh: string }[];
  teacherGuide: string;
  independentCriteria: string;
};

export type GreetingSpellingQuestion = QuestionBase & {
  kind: "spelling";
  word: string;
  meaningZh: string;
};

export type GreetingQuestion = GreetingOralQuestion | GreetingSpellingQuestion;
export type LetterTile = { id: string; letter: string };
export type GreetingOralAttempt = { kind: "oral"; score?: ManualScore };
export type GreetingSpellingAttempt = {
  kind: "spelling";
  order: string[];
  selected: string[];
  submissions: number;
  status: "pending" | "correct" | "skipped";
  score?: ManualScore;
};
export type GreetingAttempt = GreetingOralAttempt | GreetingSpellingAttempt;

export type GreetingSession = {
  id: string;
  studentName: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  currentIndex: number;
  soundEnabled: boolean;
  attempts: Record<string, GreetingAttempt>;
};

export type GreetingsData = { version: 1; sessions: GreetingSession[] };
export type GreetingQuestionAction =
  | { type: "SCORE_ORAL"; score: ManualScore }
  | { type: "SELECT_LETTER"; tileId: string }
  | { type: "REMOVE_LETTER"; tileId: string }
  | { type: "CLEAR_LETTERS" }
  | { type: "SUBMIT_SPELLING" }
  | { type: "SKIP_SPELLING" };

export type GreetingsAction =
  | { type: "HYDRATE"; data: GreetingsData }
  | { type: "START"; session: GreetingSession }
  | { type: "ANSWER"; sessionId: string; questionId: string; action: GreetingQuestionAction; at: string }
  | { type: "NAVIGATE"; sessionId: string; direction: "previous" | "next"; at: string }
  | { type: "TOGGLE_SOUND"; sessionId: string };
