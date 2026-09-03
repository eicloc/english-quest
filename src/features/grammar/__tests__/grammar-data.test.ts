import { describe, expect, it } from "vitest";
import { grammarQuestionById, grammarQuestions, getGrammarQuestionsForStage } from "@/content/grammar/questions";
import { grammarStages } from "@/content/grammar/stages";
import { evaluateGrammarResponse } from "../evaluator";
import { grammarReducer } from "../reducer";
import { buildGrammarReport, buildReviewOrder, scoreGrammarAttempt } from "../scoring";
import { createGrammarSession, selectGrammarQuestions } from "../session";
import { EMPTY_GRAMMAR_DATA, GRAMMAR_STORAGE_KEY, parsePersistedGrammarData } from "../storage";
import type { GrammarAttempt, GrammarResponse } from "../types";

function completedAttempt(questionId: string, attempts: 1 | 2, isCorrect: boolean): GrammarAttempt {
  const question = grammarQuestionById[questionId];
  const response: GrammarResponse = question.type === "choice-gap" ? { type: "choice-gap", answer: isCorrect ? question.correctAnswer : "wrong" } : { type: "sentence-sort", tokens: [] };
  return { questionId, startedAt: "2026-09-03T00:00:00.000Z", completedAt: "2026-09-03T00:00:01.000Z", responses: Array.from({ length: attempts }, () => response), attempts, firstTryCorrect: attempts === 1 && isCorrect, isCorrect, answerRevealed: !isCorrect, hintUsed: attempts > 1 };
}

describe("grammar question bank", () => {
  it("contains ten stages with exactly fourteen unique questions each", () => {
    expect(grammarStages).toHaveLength(10);
    expect(grammarQuestions).toHaveLength(140);
    expect(new Set(grammarQuestions.map((question) => question.id)).size).toBe(140);
    for (const stage of grammarStages) expect(getGrammarQuestionsForStage(stage.id)).toHaveLength(14);
  });

  it("keeps every question structurally valid", () => {
    for (const question of grammarQuestions) {
      expect(question.hintZh).toBeTruthy();
      expect(question.explanationZh).toBeTruthy();
      expect(question.coverageGroup).toBeTruthy();
      if (question.type === "choice-gap") expect(question.options).toContain(question.correctAnswer);
      if (question.type === "sentence-sort") expect([...question.tokens].sort()).toEqual([...question.correctOrder].sort());
      if (question.type === "pair-match") {
        expect(question.rightItems).toHaveLength(question.leftItems.length);
        expect(Object.keys(question.correctPairs)).toHaveLength(question.leftItems.length);
        expect(new Set(Object.values(question.correctPairs)).size).toBe(question.rightItems.length);
        expect(Object.values(question.correctPairs).every((rightId) => question.rightItems.some((item) => item.id === rightId))).toBe(true);
      }
      if (question.type === "category-sort") expect(Object.keys(question.correctCategories)).toHaveLength(question.items.length);
    }
  });

  it("adds six accessible semantic visuals to every stage", () => {
    expect(grammarQuestions.filter((question) => question.visual)).toHaveLength(60);
    for (const stage of grammarStages) {
      const visuals = getGrammarQuestionsForStage(stage.id).filter((question) => question.visual);
      expect(visuals).toHaveLength(6);
      for (const question of visuals) {
        expect(question.visual?.emoji.trim()).toBeTruthy();
        expect(question.visual?.altZh.trim()).toBeTruthy();
      }
    }
  });

  it("selects eight deterministic, stratified questions for every stage", () => {
    for (const stage of grammarStages) {
      const pool = getGrammarQuestionsForStage(stage.id);
      const selected = selectGrammarQuestions(pool, `seed:${stage.id}`);
      expect(selected).toHaveLength(8);
      expect(new Set(selected.map((question) => question.id)).size).toBe(8);
      expect(new Set(selected.map((question) => question.coverageGroup))).toEqual(new Set(pool.map((question) => question.coverageGroup)));
      expect(new Set(selected.map((question) => question.difficulty))).toEqual(new Set([1, 2, 3]));
      expect(selectGrammarQuestions(pool, `seed:${stage.id}`).map((question) => question.id)).toEqual(selected.map((question) => question.id));
    }
  });

  it("varies the selected questions when the seed changes", () => {
    const pool = getGrammarQuestionsForStage("be");
    expect(selectGrammarQuestions(pool, "alpha").map((question) => question.id)).not.toEqual(selectGrammarQuestions(pool, "beta").map((question) => question.id));
  });
});

describe("grammar evaluation and sessions", () => {
  it("evaluates all four automatic response types", () => {
    const choice = grammarQuestionById["be-i-am"];
    const order = grammarQuestionById["pronoun-sort-we"];
    const pairs = grammarQuestionById["pronoun-match-person"];
    const categories = grammarQuestionById["pronoun-category-number"];
    expect(choice.type === "choice-gap" && evaluateGrammarResponse(choice, { type: "choice-gap", answer: "am" })).toBe(true);
    expect(order.type === "sentence-sort" && evaluateGrammarResponse(order, { type: "sentence-sort", tokens: order.correctOrder })).toBe(true);
    expect(pairs.type === "pair-match" && evaluateGrammarResponse(pairs, { type: "pair-match", pairs: pairs.correctPairs })).toBe(true);
    expect(categories.type === "category-sort" && evaluateGrammarResponse(categories, { type: "category-sort", categories: categories.correctCategories })).toBe(true);
  });

  it("allows two attempts and prevents changes after completion", () => {
    const session = createGrammarSession({ studentName: "Mia", avatarId: "cat", soundEnabled: true, reducedMotion: true });
    session.questionOrder.pronouns[0] = "pronoun-i";
    let data = grammarReducer(EMPTY_GRAMMAR_DATA, { type: "CREATE_SESSION", session });
    data = grammarReducer(data, { type: "SUBMIT_RESPONSE", sessionId: session.id, questionId: "pronoun-i", response: { type: "choice-gap", answer: "He" } });
    expect(data.sessions[0].attempts[0]).toMatchObject({ attempts: 1, hintUsed: true, completedAt: undefined });
    data = grammarReducer(data, { type: "SUBMIT_RESPONSE", sessionId: session.id, questionId: "pronoun-i", response: { type: "choice-gap", answer: "I" } });
    expect(data.sessions[0].attempts[0]).toMatchObject({ attempts: 2, isCorrect: true, firstTryCorrect: false });
    const frozen = grammarReducer(data, { type: "SUBMIT_RESPONSE", sessionId: session.id, questionId: "pronoun-i", response: { type: "choice-gap", answer: "He" } });
    expect(frozen.sessions[0].attempts[0].attempts).toBe(2);
    expect(scoreGrammarAttempt(frozen.sessions[0].attempts[0])).toBe(1);
  });

  it("prioritizes zero-star misses in the review station", () => {
    const session = createGrammarSession({ studentName: "Leo", avatarId: "dog", soundEnabled: false, reducedMotion: false });
    session.attempts = [completedAttempt("pronoun-he", 2, true), completedAttempt("pronoun-i", 2, false), completedAttempt("pronoun-you", 1, true)];
    expect(buildReviewOrder(session)).toEqual(["pronoun-i", "pronoun-he"]);
    const report = buildGrammarReport(session);
    expect(report.firstTryAccuracy).toBe(33);
    expect(report.finalAccuracy).toBe(67);
    expect(report.mistakes).toHaveLength(2);
  });

  it("uses isolated, resilient grammar persistence", () => {
    expect(GRAMMAR_STORAGE_KEY).toBe("english-grammar-quest:v1");
    expect(GRAMMAR_STORAGE_KEY).not.toBe("english-quest:v1");
    expect(parsePersistedGrammarData("{broken")).toEqual(EMPTY_GRAMMAR_DATA);
    const session = createGrammarSession({ studentName: "Amy", avatarId: "rabbit", soundEnabled: true, reducedMotion: false });
    expect(parsePersistedGrammarData(JSON.stringify({ version: 1, sessions: [session], activeSessionId: session.id })).sessions[0].id).toBe(session.id);
  });
});
