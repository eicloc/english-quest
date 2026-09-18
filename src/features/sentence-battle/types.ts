export type SentenceFamily = "Is" | "Are" | "Can" | "Do" | "Does";
export type BattleKind = "question-sort" | "answer-choice";

export type SentenceQuestion = {
  id: string;
  question: string;
  emoji: string;
  answer?: string;
  polarity?: "yes" | "no";
};

export type SentenceTraining = {
  id: string;
  family: SentenceFamily;
  title: string;
  sourceFile: string;
  kind: BattleKind;
  questions: SentenceQuestion[];
};

export type BattleTile = { id: string; label: string };
export type BattleAttempt = {
  order: string[];
  selected: string[];
  errors: number;
  solved: boolean;
};

export type BattleRun = {
  id: string;
  currentIndex: number;
  wave: 0 | 1;
  attempts: BattleAttempt[];
  monsters: [string, string];
  drops: [0 | 1, 0 | 1];
  rewards: [number | null, number | null];
};

export type BattleProgress = {
  everCompleted: boolean;
  completedAt?: string;
  run: BattleRun;
};

export type BattleData = { version: 1; trainings: Record<string, BattleProgress> };

export type BattleRunAction =
  | { type: "SELECT"; tileId: string }
  | { type: "REMOVE"; tileId: string }
  | { type: "CLEAR" }
  | { type: "SUBMIT"; completedAt: string }
  | { type: "PREVIOUS" }
  | { type: "NEXT" };

export type BattleAction =
  | { type: "START"; trainingId: string; run: BattleRun; restart?: boolean }
  | { type: "PLAY"; trainingId: string; runId: string; questionIndex: number; action: BattleRunAction };
