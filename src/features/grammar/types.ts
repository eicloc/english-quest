export type GrammarSkill =
  | "pronouns"
  | "beAgreement"
  | "nounNumber"
  | "demonstratives"
  | "thereBe"
  | "haveHas"
  | "thirdPersonVerbs"
  | "negatives"
  | "questions";

export type GrammarDifficulty = 1 | 2 | 3;
export type GrammarQuestionType = "choice-gap" | "sentence-sort" | "pair-match" | "category-sort";

export type GrammarQuestionVisual = {
  emoji: string;
  altZh: string;
};

type GrammarQuestionBase = {
  id: string;
  stageId: string;
  type: GrammarQuestionType;
  skill: GrammarSkill;
  ruleGroup: string;
  coverageGroup: string;
  difficulty: GrammarDifficulty;
  promptEn: string;
  promptZh: string;
  hintZh: string;
  explanationZh: string;
  audioText?: string;
  visual?: GrammarQuestionVisual;
};

export type GrammarChoiceQuestion = GrammarQuestionBase & {
  type: "choice-gap";
  stem: string;
  options: string[];
  correctAnswer: string;
};

export type GrammarSortQuestion = GrammarQuestionBase & {
  type: "sentence-sort";
  tokens: string[];
  correctOrder: string[];
};

export type GrammarMatchQuestion = GrammarQuestionBase & {
  type: "pair-match";
  leftItems: { id: string; label: string }[];
  rightItems: { id: string; label: string }[];
  correctPairs: Record<string, string>;
};

export type GrammarCategoryQuestion = GrammarQuestionBase & {
  type: "category-sort";
  categories: { id: string; label: string }[];
  items: { id: string; label: string }[];
  correctCategories: Record<string, string>;
};

export type GrammarQuestion = GrammarChoiceQuestion | GrammarSortQuestion | GrammarMatchQuestion | GrammarCategoryQuestion;

export type GrammarResponse =
  | { type: "choice-gap"; answer: string }
  | { type: "sentence-sort"; tokens: string[] }
  | { type: "pair-match"; pairs: Record<string, string> }
  | { type: "category-sort"; categories: Record<string, string> };

export type GrammarAttempt = {
  questionId: string;
  startedAt: string;
  completedAt?: string;
  responses: GrammarResponse[];
  attempts: number;
  firstTryCorrect?: boolean;
  isCorrect?: boolean;
  answerRevealed: boolean;
  hintUsed: boolean;
  durationMs?: number;
};

export type GrammarStageDefinition = {
  id: string;
  order: number;
  title: string;
  titleZh: string;
  description: string;
  icon: string;
  accent: string;
};

export type GrammarSettings = {
  soundEnabled: boolean;
  reducedMotion: boolean;
};

export type GrammarSession = {
  id: string;
  studentName: string;
  avatarId: string;
  status: "active" | "paused" | "completed";
  createdAt: string;
  completedAt?: string;
  currentStageId: string;
  currentQuestionIndex: number;
  questionOrder: Record<string, string[]>;
  completedStageIds: string[];
  badges: string[];
  settings: GrammarSettings;
  attempts: GrammarAttempt[];
  inReview: boolean;
  reviewOrder: string[];
  reviewIndex: number;
  reviewAttempts: GrammarAttempt[];
};

export type PersistedGrammarData = {
  version: 1;
  sessions: GrammarSession[];
  activeSessionId?: string;
};

export type GrammarSkillResult = {
  skill: GrammarSkill;
  earned: number;
  possible: number;
  percentage?: number;
  status: "已掌握" | "继续练习" | "重点巩固" | "暂无数据";
  evidenceQuestionIds: string[];
};

export type GrammarMistake = {
  questionId: string;
  prompt: string;
  response: string;
  answer: string;
  explanation: string;
};

export type GrammarReport = {
  totalStars: number;
  completedCount: number;
  firstTryAccuracy: number;
  finalAccuracy: number;
  reviewAccuracy?: number;
  skillResults: GrammarSkillResult[];
  weakRules: string[];
  mistakes: GrammarMistake[];
};

export type GrammarAction =
  | { type: "HYDRATE"; data: PersistedGrammarData }
  | { type: "CREATE_SESSION"; session: GrammarSession }
  | { type: "START_STAGE"; sessionId: string; stageId: string }
  | { type: "SUBMIT_RESPONSE"; sessionId: string; questionId: string; response: GrammarResponse; review?: boolean }
  | { type: "NEXT_QUESTION"; sessionId: string; review?: boolean }
  | { type: "PREVIOUS_QUESTION"; sessionId: string; review?: boolean }
  | { type: "COMPLETE_STAGE"; sessionId: string; stageId: string; nextStageId?: string }
  | { type: "BEGIN_REVIEW"; sessionId: string; questionIds: string[] }
  | { type: "COMPLETE_SESSION"; sessionId: string }
  | { type: "TOGGLE_SETTING"; sessionId: string; setting: keyof GrammarSettings }
  | { type: "PAUSE_SESSION"; sessionId: string }
  | { type: "RESUME_SESSION"; sessionId: string }
  | { type: "RESET_SESSION"; sessionId: string; reset: GrammarSession }
  | { type: "CLEAR_HISTORY" };
