import { getGrammarQuestionsForStage } from "@/content/grammar/questions";
import { grammarStages } from "@/content/grammar/stages";
import type { GrammarQuestion, GrammarSession } from "./types";

function hashText(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  return () => {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function stableGrammarShuffle<T>(items: T[], seedText: string): T[] {
  const result = [...items];
  const random = mulberry32(hashText(seedText));
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function selectGrammarQuestions(questions: GrammarQuestion[], seed: string, count = 8) {
  const shuffled = stableGrammarShuffle(questions, seed);
  const coverageGroups = Array.from(new Set(shuffled.map((question) => question.coverageGroup)));
  const selected: GrammarQuestion[] = coverageGroups.slice(0, count).map((group) => shuffled.find((question) => question.coverageGroup === group)!).filter(Boolean);
  const remaining = shuffled.filter((question) => !selected.some((item) => item.id === question.id));
  const difficultyTargets = [1, 1, 1, 2, 2, 2, 3, 3] as const;

  for (const difficulty of difficultyTargets) {
    if (selected.length >= count) break;
    const have = selected.filter((question) => question.difficulty === difficulty).length;
    const target = difficultyTargets.filter((item) => item === difficulty).length;
    if (have >= target) continue;
    const index = remaining.findIndex((question) => question.difficulty === difficulty);
    if (index >= 0) selected.push(remaining.splice(index, 1)[0]);
  }
  while (selected.length < count && remaining.length) selected.push(remaining.shift()!);
  return stableGrammarShuffle(selected, `${seed}:final`);
}

export function makeGrammarSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `grammar-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createGrammarSession(input: { studentName: string; avatarId: string; soundEnabled: boolean; reducedMotion: boolean }): GrammarSession {
  const id = makeGrammarSessionId();
  const questionOrder = Object.fromEntries(grammarStages.map((stage) => [stage.id, selectGrammarQuestions(getGrammarQuestionsForStage(stage.id), `${id}:${stage.id}`).map((question) => question.id)]));
  return {
    id,
    studentName: input.studentName.trim().slice(0, 12) || "小勇士",
    avatarId: input.avatarId,
    status: "active",
    createdAt: new Date().toISOString(),
    currentStageId: grammarStages[0].id,
    currentQuestionIndex: 0,
    questionOrder,
    completedStageIds: [],
    badges: [],
    settings: { soundEnabled: input.soundEnabled, reducedMotion: input.reducedMotion },
    attempts: [],
    inReview: false,
    reviewOrder: [],
    reviewIndex: 0,
    reviewAttempts: [],
  };
}

export function resetGrammarSession(session: GrammarSession) {
  return createGrammarSession({ studentName: session.studentName, avatarId: session.avatarId, soundEnabled: session.settings.soundEnabled, reducedMotion: session.settings.reducedMotion });
}

export function getNextGrammarStageId(stageId: string) {
  const index = grammarStages.findIndex((stage) => stage.id === stageId);
  return grammarStages[index + 1]?.id;
}
