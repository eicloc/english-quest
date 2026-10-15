import type { GreetingOralQuestion, GreetingSpellingAttempt } from "@/features/greetings/types";
import type { ManualScore } from "@/features/assessment/types";

export type PracticeCollection = "school" | "review";
export type PracticeQuestId = "morning" | "meet" | "review";
export type PracticeSkill = "responding" | "initiating" | "spelling" | "sentence";
type Base = { id: string; stage: string; skill: PracticeSkill };
export type PracticeOral = Base & Omit<GreetingOralQuestion, "id" | "part" | "stage" | "skill">;
export type PracticeSpelling = Base & { kind: "spelling"; word: string; meaningZh: string };
export type PracticeSentence = Base & { kind: "sentence"; tokens: string[]; translationZh: string };
export type PracticeQuestion = PracticeOral | PracticeSpelling | PracticeSentence;
export type PracticeQuest = {
  id: PracticeQuestId; collection: PracticeCollection; title: string; translationZh: string; description: string; emoji: string;
  stages: { id: string; title: string; emoji: string }[];
  questions: PracticeQuestion[];
};
export type PracticeTilesAttempt = Omit<GreetingSpellingAttempt, "kind"> & { kind: "spelling" | "sentence" };
export type PracticeAttempt = { kind: "oral"; score?: ManualScore } | PracticeTilesAttempt;
export type PracticeSession = {
  id: string; questId: PracticeQuestId; studentName: string; createdAt: string; updatedAt: string;
  completedAt?: string; currentIndex: number; soundEnabled: boolean; attempts: Record<string, PracticeAttempt>;
};
export type PracticeData = { version: 1; sessions: PracticeSession[] };
export type PracticeInput =
  | { type: "SCORE"; score: ManualScore }
  | { type: "SELECT" | "REMOVE"; tileId: string }
  | { type: "CLEAR" | "SUBMIT" | "SKIP" };
export type PracticeAction =
  | { type: "HYDRATE"; data: PracticeData }
  | { type: "START"; session: PracticeSession }
  | { type: "ANSWER"; sessionId: string; questionId: string; input: PracticeInput; at: string }
  | { type: "NAVIGATE"; sessionId: string; direction: "previous" | "next"; at: string }
  | { type: "TOGGLE_SOUND"; sessionId: string };
