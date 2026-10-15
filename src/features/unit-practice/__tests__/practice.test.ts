import { beforeEach, describe, expect, it, vi } from "vitest";
import { practiceCollections, practiceQuests } from "@/content/unit-practice";
import { greetingQuestions } from "@/content/greetings/questions";
import { createGreetingSession } from "@/features/greetings/engine";
import { parseGreetingsData } from "@/features/greetings/storage";
import { buildPracticeReport, createPracticeSession, emptyPracticeData, getPracticeTiles, isPracticeCorrect, practiceReducer, shuffledPracticeOrder } from "../engine";
import { loadPracticeData, parsePracticeData, savePracticeData } from "../storage";
import type { PracticeData, PracticeInput, PracticeQuestId, PracticeTilesAttempt } from "../types";

const at = "2026-10-15T08:00:00.000Z";
function start(questId: PracticeQuestId = "morning"): PracticeData { return { version: 1, sessions: [createPracticeSession(questId, "小明", false, () => 0.5, "run", at)] }; }
function input(data: PracticeData, value: PracticeInput) {
  const s = data.sessions[0], q = practiceQuests[s.questId].questions[s.currentIndex];
  return practiceReducer(data, { type: "ANSWER", sessionId: s.id, questionId: q.id, input: value, at });
}
function next(data: PracticeData) { return practiceReducer(data, { type: "NAVIGATE", sessionId: data.sessions[0].id, direction: "next", at }); }
function correct(data: PracticeData) {
  const s = data.sessions[0], q = practiceQuests[s.questId].questions[s.currentIndex];
  if (q.kind === "oral") return input(data, { type: "SCORE", score: 2 });
  for (const tile of getPracticeTiles(q)) data = input(data, { type: "SELECT", tileId: tile.id });
  return input(data, { type: "SUBMIT" });
}
function reachFirstSort(id: PracticeQuestId = "morning") {
  let data = start(id);
  while (practiceQuests[id].questions[data.sessions[0].currentIndex].kind !== "sentence") data = next(correct(data));
  return data;
}

describe("school and review question banks", () => {
  it.each([["morning", 20, 6, 10, 4], ["meet", 18, 6, 8, 4], ["review", 40, 16, 14, 10]] as const)("keeps %s within its agreed scope and counts", (id, total, oral, spelling, sentence) => {
    const quest = practiceQuests[id];
    expect(quest.questions).toHaveLength(total);
    expect(["oral", "spelling", "sentence"].map((kind) => quest.questions.filter((q) => q.kind === kind).length)).toEqual([oral, spelling, sentence]);
    expect(new Set(quest.questions.map((q) => q.id)).size).toBe(total);
    for (const q of quest.questions) {
      expect(quest.stages.some((s) => s.id === q.stage)).toBe(true);
      if (q.kind === "oral") expect(q.examples.every((e) => e.en && e.zh) && Boolean(q.promptEn ? q.translationZh : q.sceneZh)).toBe(true);
      if (q.kind === "sentence") { expect(q.tokens.length).toBeGreaterThan(1); expect(q.translationZh).toBeTruthy(); }
      if (q.kind === "spelling") expect(q.word).toMatch(/^[a-z]+$/);
    }
  });

  it("reviews precisely the original 14 words, adds longer dialogue, and leaves the 26-question bank intact", () => {
    const words = (qs: typeof greetingQuestions) => qs.filter((q) => q.kind === "spelling").map((q) => q.word);
    const reviewWords = practiceQuests.review.questions.filter((q) => q.kind === "spelling").map((q) => q.word);
    expect(reviewWords).toEqual(words(greetingQuestions));
    expect(greetingQuestions).toHaveLength(26);
    expect(practiceQuests.review.questions.some((q) => q.kind === "sentence" && q.tokens.length === 6)).toBe(true);
    expect(JSON.stringify(practiceQuests.review)).not.toMatch(/Good morning|Nice to meet you/);
  });

  it("shuffles every automatic task away from its answer, even with repeated letters", () => {
    for (const quest of Object.values(practiceQuests)) for (const q of quest.questions) {
      if (q.kind === "oral") continue;
      for (const random of [() => 0, () => 0.5, () => 0.99999]) {
        const ids = shuffledPracticeOrder(q, random);
        expect(new Set(ids).size).toBe(getPracticeTiles(q).length);
        expect(isPracticeCorrect(q, ids)).toBe(false);
      }
    }
    const morning = practiceQuests.morning.questions.find((q) => q.kind === "spelling" && q.word === "morning")!;
    expect(isPracticeCorrect(morning, ["letter-0", "letter-1", "letter-2", "letter-5", "letter-4", "letter-3", "letter-6"])).toBe(true);
    expect(isPracticeCorrect(morning, ["letter-0", "letter-1", "letter-2", "letter-3", "letter-4", "letter-3", "letter-6"])).toBe(false);
  });
});

describe("automatic and teacher scoring", () => {
  it.each(["morning", "meet", "review"] as const)("finishes %s with the correct total and a stable saved report", (id) => {
    let data = start(id);
    for (let i = 0; i < practiceQuests[id].questions.length; i++) { data = next(correct(data)); }
    const s = data.sessions[0], report = buildPracticeReport(s);
    expect(s.completedAt).toBe(at);
    expect(report).toMatchObject({ earned: practiceQuests[id].questions.length * 2, possible: practiceQuests[id].questions.length * 2, review: [] });
    expect(parsePracticeData(JSON.stringify(data), practiceQuests[id].collection)).toEqual(data);
    expect(input(data, { type: "SKIP" })).toEqual(data);
  });

  it("does not submit incomplete sorting, and editing cards costs no attempt", () => {
    let data = reachFirstSort();
    data = input(data, { type: "SELECT", tileId: "token-0" });
    data = input(data, { type: "SELECT", tileId: "token-0" });
    data = input(data, { type: "SUBMIT" });
    const id = practiceQuests.morning.questions[data.sessions[0].currentIndex].id;
    expect(data.sessions[0].attempts[id]).toMatchObject({ selected: ["token-0"], submissions: 0 });
    expect(next(data).sessions[0].currentIndex).toBe(data.sessions[0].currentIndex);
    data = input(data, { type: "REMOVE", tileId: "token-0" });
    data = input(data, { type: "CLEAR" });
    data = correct(data);
    expect(data.sessions[0].attempts[id]).toMatchObject({ submissions: 1, score: 2 });
  });

  it("retains a wrong sentence through refresh and awards 1 after correction, only once", () => {
    let data = reachFirstSort();
    const q = practiceQuests.morning.questions[data.sessions[0].currentIndex];
    for (const tile of getPracticeTiles(q).reverse()) data = input(data, { type: "SELECT", tileId: tile.id });
    data = input(data, { type: "SUBMIT" });
    expect(data.sessions[0].attempts[q.id].score).toBeUndefined();
    data = parsePracticeData(JSON.stringify(data), "school");
    expect(data.sessions[0].attempts[q.id]).toMatchObject({ submissions: 1, status: "pending", selected: ["token-1", "token-0"] });
    data = input(data, { type: "CLEAR" }); data = correct(data);
    expect(data.sessions[0].attempts[q.id]).toMatchObject({ score: 1, submissions: 2, status: "correct" });
    expect(input(data, { type: "SUBMIT" })).toEqual(data);
    expect(input(data, { type: "SKIP" })).toEqual(data);
    expect(buildPracticeReport(data.sessions[0]).review.map((item) => item.id)).toContain(q.id);
  });

  it("allows 0-point responses and skipped sentences to continue, but ignores stale actions", () => {
    const initial = start();
    let data = next(input(initial, { type: "SCORE", score: 0 }));
    expect(data.sessions[0].currentIndex).toBe(1);
    expect(practiceReducer(data, { type: "ANSWER", sessionId: "run", questionId: "morning-class", input: { type: "SCORE", score: 2 }, at })).toEqual(data);
    data = reachFirstSort(); const before = data.sessions[0].currentIndex;
    data = next(input(data, { type: "SKIP" }));
    expect(data.sessions[0].currentIndex).toBe(before + 1);
  });
});

describe("independent storage and compatibility", () => {
  beforeEach(() => { savePracticeData(emptyPracticeData(), "school"); savePracticeData(emptyPracticeData(), "review"); });
  it("keeps original 26-question records and isolates school from review", () => {
    const old = { version: 1 as const, sessions: [createGreetingSession("旧记录")] };
    window.localStorage.setItem("english-greetings-quest:v1", JSON.stringify(old));
    savePracticeData(start("morning"), "school"); savePracticeData(start("review"), "review");
    expect(parseGreetingsData(window.localStorage.getItem("english-greetings-quest:v1"))).toEqual(old);
    expect(loadPracticeData("school").data.sessions[0].questId).toBe("morning");
    expect(loadPracticeData("review").data.sessions[0].questId).toBe("review");
    expect(parsePracticeData(JSON.stringify(start("morning")), "review").sessions).toEqual([]);
    expect(practiceCollections.school.storageKey).not.toBe(practiceCollections.review.storageKey);
  });
  it("keeps 20 records per lesson and does not overwrite the other lesson on restart", () => {
    let data = emptyPracticeData();
    for (const questId of ["morning", "meet"] as const) for (let i = 0; i < 22; i++) data = practiceReducer(data, { type: "START", session: createPracticeSession(questId, "小明", false, Math.random, `${questId}-${i}`, at) });
    expect(data.sessions).toHaveLength(40);
    expect(data.sessions.filter((s) => s.questId === "morning")).toHaveLength(20);
    expect(data.sessions.some((s) => s.id === "morning-21")).toBe(true);
    expect(parsePracticeData(JSON.stringify(data), "school").sessions).toHaveLength(40);
  });
  it("drops malformed records alone and retains selected letters and errors", () => {
    const data = reachFirstSort(), broken = structuredClone(data.sessions[0]); broken.id = "broken";
    const q = practiceQuests.morning.questions[broken.currentIndex];
    (broken.attempts[q.id] as PracticeTilesAttempt).order = ["unknown"];
    expect(parsePracticeData(JSON.stringify({ version: 1, sessions: [broken, data.sessions[0]] }), "school")).toEqual(data);
    for (const raw of ["bad", "{}", '{"version":1,"sessions":[{"questId":"__proto__"}]}']) expect(parsePracticeData(raw, "school").sessions).toEqual([]);
  });
  it("continues in memory if browser storage fails", () => {
    const data = start("review");
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("denied"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("denied"); });
    expect(savePracticeData(data, "review")).toBe(false);
    expect(loadPracticeData("review")).toEqual({ data, storageAvailable: false });
  });
});
