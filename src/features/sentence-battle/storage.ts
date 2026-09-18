import { sentenceTrainings } from "@/content/sentence-battle/trainings";
import { battleMonsters, battleSolvedCount, getBattleTiles, isBattleAnswerCorrect } from "./engine";
import type { BattleData, BattleProgress, SentenceTraining } from "./types";

export const BATTLE_STORAGE_KEY = "english-sentence-battle:v1";
export const emptyBattleData = (): BattleData => ({ version: 1, trainings: {} });
let memoryFallback = emptyBattleData();

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidProgress(value: unknown, training: SentenceTraining): value is BattleProgress {
  if (!isObject(value) || typeof value.everCompleted !== "boolean" || !isObject(value.run)) return false;
  if (value.completedAt !== undefined && (typeof value.completedAt !== "string" || !Number.isFinite(Date.parse(value.completedAt)))) return false;
  const run = value.run;
  if (typeof run.id !== "string" || !run.id || !Number.isInteger(run.currentIndex) || Number(run.currentIndex) < 0 || Number(run.currentIndex) >= training.questions.length) return false;
  if (run.wave !== 0 && run.wave !== 1) return false;
  if (!Array.isArray(run.monsters) || run.monsters.length !== 2 || !run.monsters.every((monster) => typeof monster === "string" && battleMonsters.includes(monster))) return false;
  if (!Array.isArray(run.drops) || run.drops.length !== 2 || !run.drops.every((drop) => drop === 0 || drop === 1)) return false;
  if (!Array.isArray(run.rewards) || run.rewards.length !== 2) return false;
  if (!Array.isArray(run.attempts) || run.attempts.length !== training.questions.length) return false;
  let reachedUnsolved = false;
  for (const [index, attempt] of run.attempts.entries()) {
    if (!isObject(attempt) || typeof attempt.solved !== "boolean" || !Number.isSafeInteger(attempt.errors) || Number(attempt.errors) < 0) return false;
    const question = training.questions[index];
    const ids = getBattleTiles(question).map((tile) => tile.id);
    if (!Array.isArray(attempt.order) || attempt.order.length !== ids.length || new Set(attempt.order).size !== ids.length || !attempt.order.every((id) => ids.includes(id))) return false;
    if (!Array.isArray(attempt.selected) || new Set(attempt.selected).size !== attempt.selected.length || !attempt.selected.every((id) => typeof id === "string" && ids.includes(id))) return false;
    if (question.answer && attempt.selected.length > 1) return false;
    if (attempt.solved && (reachedUnsolved || !isBattleAnswerCorrect(question, attempt.selected))) return false;
    if (!attempt.solved) reachedUnsolved = true;
  }
  const count = battleSolvedCount(run as unknown as BattleProgress["run"]);
  if (Number(run.currentIndex) > Math.min(count, 19) || (run.wave === 0 && count > 10) || (run.wave === 1 && count < 10) || (Number(run.currentIndex) >= 10 && run.wave !== 1)) return false;
  if (run.rewards[0] !== (count >= 10 ? run.drops[0] : null) || run.rewards[1] !== (count === 20 ? run.drops[1] : null)) return false;
  if (count === 20 && (!value.everCompleted || !value.completedAt)) return false;
  return true;
}

export function parseBattleData(raw: string | null): BattleData {
  const clean = emptyBattleData();
  if (!raw) return clean;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isObject(parsed) || parsed.version !== 1 || !isObject(parsed.trainings)) return clean;
    for (const training of sentenceTrainings) {
      const progress = parsed.trainings[training.id];
      if (isValidProgress(progress, training)) clean.trainings[training.id] = progress;
    }
  } catch {
    return clean;
  }
  return clean;
}

export function loadBattleData(): { data: BattleData; storageAvailable: boolean } {
  try {
    memoryFallback = parseBattleData(window.localStorage.getItem(BATTLE_STORAGE_KEY));
    return { data: memoryFallback, storageAvailable: true };
  } catch {
    return { data: memoryFallback, storageAvailable: false };
  }
}

export function saveBattleData(data: BattleData): boolean {
  memoryFallback = data;
  try {
    window.localStorage.setItem(BATTLE_STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
