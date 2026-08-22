export type Mode = "teacher-led" | "self-play";

export type SkillDimension =
  | "listening"
  | "vocabulary"
  | "speaking"
  | "sceneComprehension"
  | "wordRecognition"
  | "phonics"
  | "sentenceComprehension";

export type QuestionType =
  | "oral-manual"
  | "audio-image-choice"
  | "scene-hotspot"
  | "single-choice"
  | "word-reading-manual"
  | "phonics-manual"
  | "sentence-choice";

export type ManualScore = 0 | 1 | 2;

export type QuestionOption = {
  id: string;
  label?: string;
  zh?: string;
  pronunciationWord?: string;
  imageSrc?: string;
  emoji?: string;
  illustration?: "cat-under-table" | "cat-on-table" | "cat-beside-table";
  alt: string;
  accent?: string;
};

type QuestionBase = {
  id: string;
  stageId: string;
  skill: SkillDimension;
  promptEn: string;
  promptZh?: string;
  audioText?: string;
  enabledInModes: Mode[];
  maxAttempts?: number;
};

export type OralQuestion = QuestionBase & {
  type: "oral-manual";
  manualRubric: { score0: string; score1: string; score2: string };
};

export type ChoiceQuestion = QuestionBase & {
  type: "audio-image-choice" | "single-choice" | "sentence-choice";
  options: QuestionOption[];
  correctOptionId: string;
  sceneId?: string;
};

export type SceneHotspotQuestion = QuestionBase & {
  type: "scene-hotspot";
  sceneId: string;
  hotspotId: string;
};

export type WordReadingQuestion = QuestionBase & {
  type: "word-reading-manual";
  word: string;
};

export type PhonicsQuestion = QuestionBase & {
  type: "phonics-manual";
  word: string;
  isPseudoWord: boolean;
};

export type AssessmentQuestion =
  | OralQuestion
  | ChoiceQuestion
  | SceneHotspotQuestion
  | WordReadingQuestion
  | PhonicsQuestion;

export type VocabularyAsset = {
  id: string;
  word: string;
  zh: string;
  emoji: string;
  imageSrc?: string;
  audioText: string;
  category: "animal" | "food" | "school" | "nature" | "person" | "object";
};

export type SceneHotspot = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  pronunciationWord?: string;
  emoji: string;
};

export type SceneAsset = {
  id: string;
  title: string;
  imageSrc?: string;
  alt: string;
  kind: "classroom" | "park";
  hotspots: SceneHotspot[];
};

export type StageDefinition = {
  id: string;
  order: number;
  title: string;
  titleZh: string;
  description: string;
  icon: string;
  accent: string;
  enabledInModes: Mode[];
  shuffleQuestions?: boolean;
};

export type WordReadingScores = {
  pronunciation?: ManualScore;
  meaning?: ManualScore;
};

export type QuestionAttempt = {
  questionId: string;
  startedAt: string;
  completedAt?: string;
  attempts: number;
  selectedOptionIds: string[];
  isCorrect?: boolean;
  manualScore?: ManualScore;
  wordScores?: WordReadingScores;
  hintUsed: boolean;
  answerRevealed: boolean;
  skipped: boolean;
  durationMs?: number;
  note?: string;
};

export type AssessmentSettings = {
  soundEnabled: boolean;
  reducedMotion: boolean;
  hotspotDebug: boolean;
  hintVisible: boolean;
};

export type AssessmentSession = {
  id: string;
  studentName: string;
  avatarId: string;
  mode: Mode;
  status: "active" | "paused" | "completed";
  createdAt: string;
  completedAt?: string;
  currentStageId: string;
  currentQuestionIndex: number;
  questionOrder: Record<string, string[]>;
  completedStageIds: string[];
  badges: string[];
  settings: AssessmentSettings;
  attempts: QuestionAttempt[];
  overallNote?: string;
};

export type PersistedAssessmentData = {
  version: 1;
  sessions: AssessmentSession[];
  activeSessionId?: string;
};

export type SkillResult = {
  skill: SkillDimension;
  earned: number;
  possible: number;
  percentage?: number;
  level: "基础较好" | "具备基础" | "需要巩固" | "建议从启蒙开始" | "数据不足";
  evidenceQuestionIds: string[];
};

export type AssessmentReport = {
  totalStars: number;
  durationMs: number;
  completedCount: number;
  firstTryAccuracy: number;
  hintCount: number;
  skippedCount: number;
  skillResults: SkillResult[];
  recommendations: string[];
  unstableWords: string[];
};

export type AvatarDefinition = {
  id: string;
  label: string;
  emoji: string;
  color: string;
};

export type AssessmentAction =
  | { type: "HYDRATE"; data: PersistedAssessmentData }
  | { type: "CREATE_SESSION"; session: AssessmentSession }
  | { type: "SET_ACTIVE_SESSION"; sessionId: string }
  | { type: "START_STAGE"; sessionId: string; stageId: string }
  | { type: "SUBMIT_AUTO_ANSWER"; sessionId: string; questionId: string; optionId: string; correct: boolean }
  | { type: "SUBMIT_MANUAL_SCORE"; sessionId: string; questionId: string; score: ManualScore }
  | { type: "SUBMIT_WORD_SCORE"; sessionId: string; questionId: string; field: keyof WordReadingScores; score: ManualScore }
  | { type: "USE_HINT"; sessionId: string; questionId: string }
  | { type: "REVEAL_ANSWER"; sessionId: string; questionId: string }
  | { type: "SKIP_QUESTION"; sessionId: string; questionId: string }
  | { type: "RETRY_QUESTION"; sessionId: string; questionId: string }
  | { type: "NEXT_QUESTION"; sessionId: string }
  | { type: "PREVIOUS_QUESTION"; sessionId: string }
  | { type: "COMPLETE_STAGE"; sessionId: string; stageId: string; nextStageId?: string }
  | { type: "COMPLETE_SESSION"; sessionId: string }
  | { type: "ADD_NOTE"; sessionId: string; questionId: string; note: string }
  | { type: "SET_OVERALL_NOTE"; sessionId: string; note: string }
  | { type: "TOGGLE_SETTING"; sessionId: string; setting: keyof AssessmentSettings }
  | { type: "PAUSE_SESSION"; sessionId: string }
  | { type: "RESUME_SESSION"; sessionId: string }
  | { type: "RESET_SESSION"; sessionId: string; reset: AssessmentSession }
  | { type: "DELETE_SESSION"; sessionId: string }
  | { type: "CLEAR_HISTORY" };
