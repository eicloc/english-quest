import { beforeEach, describe, expect, it, vi } from "vitest";
import { greetingQuestions, greetingStages } from "@/content/greetings/questions";
import { buildGreetingReport, createGreetingSession, emptyGreetingsData, getLetterTiles, greetingsReducer, isSpellingCorrect, shuffleLetterIds } from "../engine";
import { GREETINGS_STORAGE_KEY, loadGreetingsData, parseGreetingsData, saveGreetingsData } from "../storage";
import type { GreetingQuestionAction, GreetingSpellingAttempt, GreetingSpellingQuestion, GreetingsData } from "../types";

const at = "2026-10-12T08:00:00.000Z";
function initial() { return greetingsReducer(emptyGreetingsData(), { type: "START", session: createGreetingSession("小明", false, () => 0.5, "test", at) }); }
function answer(data: GreetingsData, action: GreetingQuestionAction) {
  const session = data.sessions[0];
  return greetingsReducer(data, { type: "ANSWER", sessionId: session.id, questionId: greetingQuestions[session.currentIndex].id, action, at });
}
function next(data: GreetingsData) { return greetingsReducer(data, { type: "NAVIGATE", sessionId: data.sessions[0].id, direction: "next", at }); }
function spellingStart() {
  let data = initial();
  for (let i = 0; i < 6; i++) data = next(answer(data, { type: "SCORE_ORAL", score: 2 }));
  return data;
}
function spell(data: GreetingsData, correct: boolean) {
  const question = greetingQuestions[data.sessions[0].currentIndex] as GreetingSpellingQuestion;
  const ids = getLetterTiles(question).map((tile) => tile.id);
  for (const tileId of correct ? ids : [...ids].reverse()) data = answer(data, { type: "SELECT_LETTER", tileId });
  return answer(data, { type: "SUBMIT_SPELLING" });
}

describe("greeting content and spelling", () => {
  it("contains exactly the agreed 26 questions in four continuous stages", () => {
    expect(greetingQuestions).toHaveLength(26);
    expect(new Set(greetingQuestions.map((question) => question.id)).size).toBe(26);
    expect(greetingStages.map((stage) => greetingQuestions.filter((question) => question.stage === stage.id).length)).toEqual([6, 6, 6, 8]);
    expect(greetingQuestions.filter((question) => question.kind === "spelling").map((question) => question.word)).toEqual(["hi", "hello", "name", "what", "your", "my", "fine", "goodbye", "bye", "how", "you", "thanks", "see", "later"]);
    for (const question of greetingQuestions) {
      if (question.kind === "oral") {
        expect(question.examples.every((example) => example.en && example.zh)).toBe(true);
        expect(question.sceneZh || (question.promptEn && question.translationZh)).toBeTruthy();
      } else expect(question.meaningZh).toBeTruthy();
    }
  });

  it("never starts with letters already spelling the answer, including repeated letters", () => {
    for (const question of greetingQuestions) {
      if (question.kind !== "spelling") continue;
      for (const random of [() => 0, () => 0.5, () => 0.99999, Math.random]) {
        const ids = shuffleLetterIds(question, random);
        expect(new Set(ids).size).toBe(question.word.length);
        expect(isSpellingCorrect(question, ids)).toBe(false);
      }
    }
  });

  it("accepts swapped identical letters but rejects a reused tile or unknown tile", () => {
    const hello = greetingQuestions.find((question) => question.kind === "spelling" && question.word === "hello") as GreetingSpellingQuestion;
    expect(isSpellingCorrect(hello, ["letter-0", "letter-1", "letter-3", "letter-2", "letter-4"])).toBe(true);
    expect(isSpellingCorrect(hello, ["letter-0", "letter-1", "letter-2", "letter-2", "letter-4"])).toBe(false);
    expect(isSpellingCorrect(hello, ["letter-0", "letter-1", "unknown", "letter-3", "letter-4"])).toBe(false);
  });

  it("does not submit an incomplete word or count selection edits as attempts", () => {
    let data = spellingStart();
    data = answer(data, { type: "SELECT_LETTER", tileId: "letter-0" });
    data = answer(data, { type: "SELECT_LETTER", tileId: "letter-0" });
    data = answer(data, { type: "SUBMIT_SPELLING" });
    expect(data.sessions[0].attempts["spell-hi"]).toMatchObject({ selected: ["letter-0"], submissions: 0 });
    data = answer(data, { type: "REMOVE_LETTER", tileId: "letter-0" });
    data = answer(data, { type: "CLEAR_LETTERS" });
    expect(data.sessions[0].attempts["spell-hi"]).toMatchObject({ selected: [], submissions: 0 });
    expect(next(data).sessions[0].currentIndex).toBe(6);
  });

  it("awards 2 for first success and cannot award the same word again", () => {
    let data = spell(spellingStart(), true);
    expect(data.sessions[0].attempts["spell-hi"]).toMatchObject({ status: "correct", score: 2, submissions: 1 });
    const saved = data.sessions[0].attempts["spell-hi"];
    for (const action of [{ type: "SUBMIT_SPELLING" }, { type: "SKIP_SPELLING" }, { type: "CLEAR_LETTERS" }] as GreetingQuestionAction[]) data = answer(data, action);
    expect(data.sessions[0].attempts["spell-hi"]).toEqual(saved);
    expect(buildGreetingReport(data.sessions[0]).earned).toBe(14);
  });

  it("keeps a wrong arrangement, earns nothing until correct, then awards 1", () => {
    let data = spell(spellingStart(), false);
    expect(data.sessions[0].attempts["spell-hi"]).toMatchObject({ status: "pending", submissions: 1, selected: ["letter-1", "letter-0"] });
    expect(data.sessions[0].attempts["spell-hi"].score).toBeUndefined();
    data = answer(data, { type: "CLEAR_LETTERS" });
    data = spell(data, true);
    expect(data.sessions[0].attempts["spell-hi"]).toMatchObject({ status: "correct", submissions: 2, score: 1 });
  });

  it("lets a zero-score oral answer and a skipped word continue", () => {
    expect(next(answer(initial(), { type: "SCORE_ORAL", score: 0 })).sessions[0].currentIndex).toBe(1);
    let data = answer(spellingStart(), { type: "SKIP_SPELLING" });
    expect(data.sessions[0].attempts["spell-hi"]).toMatchObject({ status: "skipped", score: 0 });
    data = next(data);
    expect(data.sessions[0].currentIndex).toBe(7);
  });

  it("ignores a stale answer after navigation", () => {
    const data = next(answer(initial(), { type: "SCORE_ORAL", score: 2 }));
    expect(greetingsReducer(data, { type: "ANSWER", sessionId: "test", questionId: "hello-hi", action: { type: "SCORE_ORAL", score: 0 }, at })).toEqual(data);
  });

  it("completes all 26 questions with a 52-point report and freezes completed answers", () => {
    let data = initial();
    for (const question of greetingQuestions) {
      data = question.kind === "oral" ? answer(data, { type: "SCORE_ORAL", score: 2 }) : spell(data, true);
      data = next(data);
    }
    expect(data.sessions[0].completedAt).toBe(at);
    expect(buildGreetingReport(data.sessions[0])).toMatchObject({ earned: 52, possible: 52, completed: 26, review: [] });
    expect(buildGreetingReport(data.sessions[0]).skills.map((skill) => skill.possible)).toEqual([14, 10, 12, 16]);
    expect(answer(data, { type: "SKIP_SPELLING" })).toEqual(data);
    expect(parseGreetingsData(JSON.stringify(data))).toEqual(data);
  });
});

describe("independent greeting progress storage", () => {
  beforeEach(() => saveGreetingsData(emptyGreetingsData()));

  it("round trips shuffled letters, partial selection and errors after refresh", () => {
    let data = spell(spellingStart(), false);
    data = answer(data, { type: "REMOVE_LETTER", tileId: "letter-0" });
    expect(saveGreetingsData(data)).toBe(true);
    expect(loadGreetingsData().data).toEqual(data);
    expect((loadGreetingsData().data.sessions[0].attempts["spell-hi"] as GreetingSpellingAttempt).submissions).toBe(1);
    expect(window.localStorage.getItem(GREETINGS_STORAGE_KEY)).toBeTruthy();
    expect(window.localStorage.getItem("english-sentence-battle:v1")).toBeNull();
  });

  it("discards malformed sessions without losing valid ones", () => {
    const data = initial();
    const invalid = structuredClone(data.sessions[0]);
    invalid.id = "invalid";
    (invalid.attempts["spell-hello"] as GreetingSpellingAttempt).selected = ["letter-0", "letter-0"];
    expect(parseGreetingsData(JSON.stringify({ version: 1, sessions: [invalid, data.sessions[0]] }))).toEqual(data);
    for (const raw of [null, "not-json", '{"version":2,"sessions":[]}', '{"version":1,"sessions":[{}]}']) expect(parseGreetingsData(raw).sessions).toEqual([]);
  });

  it("keeps only 20 records and keeps the previous attempt when restarting", () => {
    let data = initial();
    for (let i = 0; i < 22; i++) data = greetingsReducer(data, { type: "START", session: createGreetingSession("新朋友", false, Math.random, `new-${i}`, at) });
    expect(data.sessions).toHaveLength(20);
    expect(data.sessions[0].id).toBe("new-21");
    expect(data.sessions[1].id).toBe("new-20");
  });

  it("continues in memory if browser storage is unavailable", () => {
    const data = initial();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("unavailable"); });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("unavailable"); });
    expect(saveGreetingsData(data)).toBe(false);
    expect(loadGreetingsData()).toEqual({ data, storageAvailable: false });
  });
});
