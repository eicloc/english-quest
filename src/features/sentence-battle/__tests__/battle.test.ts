import { describe, expect, it, vi } from "vitest";
import sourceData from "@/content/sentence-battle/source-data.json";
import { sentenceTrainings } from "@/content/sentence-battle/trainings";
import { battleCoins, battleHp, battleSolvedCount, createBattleRun, getBattleTiles, isBattleAnswerCorrect, reduceBattleData } from "../engine";
import { BATTLE_STORAGE_KEY, emptyBattleData, loadBattleData, parseBattleData, saveBattleData } from "../storage";
import type { BattleData, BattleRunAction, SentenceQuestion } from "../types";

const sorting = sentenceTrainings.find((training) => training.id === "is-things")!;
const choice = sentenceTrainings.find((training) => training.id === "are-you-answers")!;

function start(training = choice): BattleData {
  return reduceBattleData(emptyBattleData(), { type: "START", trainingId: training.id, run: createBattleRun(training, () => 0.9, "test-run") });
}

function play(data: BattleData, action: BattleRunAction, training = choice): BattleData {
  const run = data.trainings[training.id].run;
  return reduceBattleData(data, { type: "PLAY", trainingId: training.id, runId: run.id, questionIndex: run.currentIndex, action });
}

function solve(data: BattleData, training = choice): BattleData {
  const index = data.trainings[training.id].run.currentIndex;
  const question = training.questions[index];
  data = play(data, { type: "CLEAR" }, training);
  for (const tile of getBattleTiles(question).slice(0, question.answer ? 1 : undefined)) data = play(data, { type: "SELECT", tileId: tile.id }, training);
  return play(data, { type: "SUBMIT", completedAt: "2026-09-13T10:00:00.000Z" }, training);
}

describe("sentence battle content", () => {
  it("retains all 18 sources and 360 items in order with nine sets of each kind", () => {
    expect(sentenceTrainings).toHaveLength(18);
    expect(new Set(sentenceTrainings.map((training) => training.sourceFile)).size).toBe(18);
    expect(sentenceTrainings.filter((training) => training.kind === "question-sort")).toHaveLength(9);
    expect(sentenceTrainings.filter((training) => training.kind === "answer-choice")).toHaveLength(9);
    expect(sentenceTrainings.flatMap((training) => training.questions)).toHaveLength(360);
    for (const [index, training] of sentenceTrainings.entries()) {
      expect(training.questions).toHaveLength(20);
      expect(training.sourceFile).toBe(sourceData[index].sourceFile);
      for (const [itemIndex, question] of training.questions.entries()) {
        const original = sourceData[index].items[itemIndex];
        expect(question.question).toBe(("q" in original ? original.q : original.sentence).replace(/\s*\((yes|no)\)\s*$/i, ""));
        expect(question.answer).toBe("a" in original ? original.a : undefined);
        expect(question.emoji).toBe(original.emoji);
        expect(question.question).toMatch(/\?$/);
      }
    }
    expect(new Set(sentenceTrainings.flatMap((training) => training.questions.map((question) => question.id))).size).toBe(360);
  });

  it("gives every choice three distinct answers and exactly one correct answer", () => {
    for (const question of sentenceTrainings.flatMap((training) => training.questions).filter((question) => question.answer)) {
      const tiles = getBattleTiles(question);
      expect(tiles).toHaveLength(3);
      expect(new Set(tiles.map((tile) => tile.label)).size).toBe(3);
      expect(tiles.filter((tile) => isBattleAnswerCorrect(question, [tile.id]))).toEqual([{ id: "answer-0", label: question.answer }]);
      expect(question.polarity).toBe(question.answer!.startsWith("Yes") ? "yes" : "no");
    }
  });

  it("keeps demonstrative and you-to-I answers grammatically aligned", () => {
    for (const question of sentenceTrainings.flatMap((training) => training.questions).filter((question) => question.answer)) {
      const [, auxiliary, subject] = question.question.match(/^(Is|Are|Can|Do|Does) (\w+)/)!;
      const pronoun = ["this", "that", "it"].includes(subject) ? "it" : ["these", "those"].includes(subject) ? "they" : subject === "you" ? "I" : subject;
      const verb = auxiliary === "Are" && pronoun === "I" ? "am" : auxiliary.toLowerCase();
      const negative = verb === "am" ? "I'm not" : `${pronoun} ${verb === "can" ? "can't" : `${verb}n't`}`;
      expect(question.answer).toBe(question.polarity === "yes" ? `Yes, ${pronoun} ${verb}.` : `No, ${negative}.`);
    }
  });

  it("uses distinct identities for repeated words and excludes yes/no annotations", () => {
    const question: SentenceQuestion = { id: "repeated", question: "Can you see a dog and a cat?", emoji: "👀" };
    const tiles = getBattleTiles(question);
    expect(new Set(tiles.map((tile) => tile.id)).size).toBe(tiles.length);
    expect(isBattleAnswerCorrect(question, tiles.map((tile) => tile.id))).toBe(true);
    const equivalent = tiles.map((tile) => tile.id);
    [equivalent[3], equivalent[6]] = [equivalent[6], equivalent[3]];
    expect(isBattleAnswerCorrect(question, equivalent)).toBe(true);
    expect(isBattleAnswerCorrect(question, tiles.map(() => "word-0"))).toBe(false);
    expect(getBattleTiles(sorting.questions[0]).some((tile) => /yes|no/.test(tile.label))).toBe(false);
  });
});

describe("sentence battle state transitions", () => {
  it("allows editing, removing and clearing word cards before one successful attack", () => {
    let data = start(sorting);
    data = play(data, { type: "SELECT", tileId: "word-0" }, sorting);
    expect(play(data, { type: "SELECT", tileId: "word-0" }, sorting)).toBe(data);
    data = play(data, { type: "REMOVE", tileId: "word-0" }, sorting);
    expect(data.trainings[sorting.id].run.attempts[0].selected).toEqual([]);
    data = solve(data, sorting);
    expect(battleHp(data.trainings[sorting.id].run)).toBe(90);
    expect(play(data, { type: "SUBMIT", completedAt: "ignored" }, sorting)).toBe(data);
    expect(play(data, { type: "CLEAR" }, sorting)).toBe(data);
  });

  it("keeps HP unchanged on errors, allows retries and locks solved answers", () => {
    let data = start();
    expect(play(data, { type: "NEXT" })).toBe(data);
    expect(play(data, { type: "SUBMIT", completedAt: "ignored" })).toBe(data);
    data = play(data, { type: "SELECT", tileId: "answer-1" });
    for (let i = 0; i < 2; i++) data = play(data, { type: "SUBMIT", completedAt: "ignored" });
    expect(data.trainings[choice.id].run.attempts[0].errors).toBe(2);
    expect(battleHp(data.trainings[choice.id].run)).toBe(100);
    data = solve(data);
    expect(battleHp(data.trainings[choice.id].run)).toBe(90);
    expect(play(data, { type: "SELECT", tileId: "answer-2" })).toBe(data);
  });

  it("survives reloads through both victories without duplicated damage or rewards", () => {
    let data = start();
    for (let index = 0; index < 20; index++) {
      data = solve(data);
      const run = data.trainings[choice.id].run;
      expect(battleSolvedCount(run)).toBe(index + 1);
      expect(battleHp(run)).toBe(100 - ((index % 10) + 1) * 10);
      expect(battleCoins(run)).toBe(Math.floor((index + 1) / 10));
      data = parseBattleData(JSON.stringify(data));
      expect(play(data, { type: "SUBMIT", completedAt: "ignored" })).toBe(data);
      if (index === 9) {
        expect(data.trainings[choice.id].run.wave).toBe(0);
        data = play(data, { type: "PREVIOUS" });
        expect(battleHp(data.trainings[choice.id].run)).toBe(0);
        data = play(data, { type: "NEXT" });
        expect(battleCoins(data.trainings[choice.id].run)).toBe(1);
      }
      if (index < 19) data = play(data, { type: "NEXT" });
    }
    expect(data.trainings[choice.id].everCompleted).toBe(true);
    expect(data.trainings[choice.id].completedAt).toBe("2026-09-13T10:00:00.000Z");
    expect(play(data, { type: "NEXT" })).toBe(data);
    data = play(data, { type: "PREVIOUS" });
    expect(battleCoins(data.trainings[choice.id].run)).toBe(2);
    expect(battleHp(data.trainings[choice.id].run)).toBe(0);
  });

  it("restarts only one run and preserves its completed badge and other trainings", () => {
    let data = start();
    for (let i = 0; i < 20; i++) { data = solve(data); data = play(data, { type: "NEXT" }); }
    data = reduceBattleData(data, { type: "START", trainingId: sorting.id, run: createBattleRun(sorting) });
    const other = data.trainings[sorting.id];
    const previousRun = data.trainings[choice.id].run;
    data = reduceBattleData(data, { type: "START", trainingId: choice.id, restart: true, run: createBattleRun(choice) });
    expect(data.trainings[choice.id].everCompleted).toBe(true);
    expect(battleSolvedCount(data.trainings[choice.id].run)).toBe(0);
    expect(battleCoins(data.trainings[choice.id].run)).toBe(0);
    expect(data.trainings[sorting.id]).toBe(other);
    expect(reduceBattleData(data, { type: "PLAY", trainingId: choice.id, runId: previousRun.id, questionIndex: 19, action: { type: "SUBMIT", completedAt: "ignored" } })).toBe(data);
  });

  it("rejects stale question events and does not reroll an existing run", () => {
    let data = solve(start());
    data = play(data, { type: "NEXT" });
    expect(reduceBattleData(data, { type: "PLAY", trainingId: choice.id, runId: "test-run", questionIndex: 0, action: { type: "NEXT" } })).toBe(data);
    expect(reduceBattleData(data, { type: "START", trainingId: choice.id, run: createBattleRun(choice) })).toBe(data);
  });
});

describe("isolated sentence battle persistence", () => {
  it("retains in-progress card order, selections, errors and monsters", () => {
    let data = start(sorting);
    data = play(data, { type: "SELECT", tileId: "word-2" }, sorting);
    expect(parseBattleData(JSON.stringify(data))).toEqual(data);
    window.localStorage.setItem("english-quest:v1", "assessment untouched");
    window.localStorage.setItem("english-grammar-quest:v1", "grammar untouched");
    expect(saveBattleData(data)).toBe(true);
    expect(loadBattleData().data).toEqual(data);
    expect(window.localStorage.getItem(BATTLE_STORAGE_KEY)).toBe(JSON.stringify(data));
    expect(window.localStorage.getItem("english-quest:v1")).toBe("assessment untouched");
    expect(window.localStorage.getItem("english-grammar-quest:v1")).toBe("grammar untouched");
  });

  it("drops only corrupt training records, including impossible reward and answer states", () => {
    const good = start();
    const withOther = reduceBattleData(good, { type: "START", trainingId: sorting.id, run: createBattleRun(sorting) });
    for (const mutate of [
      (value: BattleData) => { value.trainings[sorting.id].run.currentIndex = 99; },
      (value: BattleData) => { value.trainings[sorting.id].run.attempts[0].order = ["bad"]; },
      (value: BattleData) => { value.trainings[sorting.id].run.attempts[0].solved = true; },
      (value: BattleData) => { value.trainings[sorting.id].run.rewards[0] = 1; },
    ]) {
      const corrupted = JSON.parse(JSON.stringify(withOther)) as BattleData;
      mutate(corrupted);
      expect(parseBattleData(JSON.stringify(corrupted))).toEqual(good);
    }
    for (const raw of [null, "{broken", "null", '{"version":2,"trainings":{}}']) expect(parseBattleData(raw)).toEqual(emptyBattleData());
  });

  it("continues in memory when browser storage throws", () => {
    const data = start();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("quota exceeded"); });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("access denied"); });
    expect(saveBattleData(data)).toBe(false);
    expect(loadBattleData()).toEqual({ data, storageAvailable: false });
  });
});
