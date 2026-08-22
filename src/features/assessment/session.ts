import { getQuestionsForStage } from "@/content/questions";
import { getPlayableStages, stageById } from "@/content/stages";
import type { AssessmentSession, Mode } from "./types";

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

export function stableShuffle<T>(items: T[], seedText: string): T[] {
  const result = [...items];
  const random = mulberry32(hashText(seedText));
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function makeSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `quest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createSession(input: {
  studentName: string;
  avatarId: string;
  mode: Mode;
  soundEnabled: boolean;
  reducedMotion: boolean;
}): AssessmentSession {
  const id = makeSessionId();
  const playableStages = getPlayableStages(input.mode);
  const questionOrder = Object.fromEntries(
    playableStages.map((stage) => {
      const ids = getQuestionsForStage(stage.id, input.mode).map((question) => question.id);
      return [stage.id, stage.shuffleQuestions ? stableShuffle(ids, `${id}:${stage.id}`) : ids];
    }),
  );
  return {
    id,
    studentName: input.studentName.trim().slice(0, 12) || "小勇士",
    avatarId: input.avatarId,
    mode: input.mode,
    status: "active",
    createdAt: new Date().toISOString(),
    currentStageId: playableStages[0]?.id ?? "hello",
    currentQuestionIndex: 0,
    questionOrder,
    completedStageIds: [],
    badges: [],
    settings: {
      soundEnabled: input.soundEnabled,
      reducedMotion: input.reducedMotion,
      hotspotDebug: false,
      hintVisible: false,
    },
    attempts: [],
  };
}

export function resetSession(session: AssessmentSession): AssessmentSession {
  return createSession({
    studentName: session.studentName,
    avatarId: session.avatarId,
    mode: session.mode,
    soundEnabled: session.settings.soundEnabled,
    reducedMotion: session.settings.reducedMotion,
  });
}

export function getNextPlayableStageId(session: AssessmentSession, stageId: string) {
  const playable = getPlayableStages(session.mode);
  const index = playable.findIndex((stage) => stage.id === stageId);
  return playable[index + 1]?.id;
}

export function isStagePlayable(session: AssessmentSession, stageId: string) {
  return Boolean(stageById[stageId]?.enabledInModes.includes(session.mode));
}
