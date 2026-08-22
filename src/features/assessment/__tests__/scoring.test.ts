import { describe, expect, it } from "vitest";
import { questionById } from "@/content/questions";
import { buildRecommendations, calculateSkillResults, getTotalStars, scoreAttempt, scoreAutomatic } from "../scoring";
import { createSession } from "../session";
import type { QuestionAttempt } from "../types";

function attempt(overrides: Partial<QuestionAttempt> & Pick<QuestionAttempt, "questionId">): QuestionAttempt {
  return { startedAt: "2026-08-22T00:00:00.000Z", attempts: 1, selectedOptionIds: [], hintUsed: false, answerRevealed: false, skipped: false, completedAt: "2026-08-22T00:00:01.000Z", ...overrides };
}

describe("assessment scoring", () => {
  it("awards 2 points for a first try correct answer", () => expect(scoreAutomatic(true, 1)).toBe(2));
  it("awards 1 point for a second try correct answer", () => expect(scoreAutomatic(true, 2)).toBe(1));
  it("awards 0 after two wrong answers", () => expect(scoreAutomatic(false, 2)).toBe(0));
  it("saves manual scores as their point value", () => expect(scoreAttempt(attempt({ questionId: "hello-name", manualScore: 2 }), questionById["hello-name"])).toBe(2));
  it("adds both word reading dimensions", () => expect(scoreAttempt(attempt({ questionId: "read-cat", wordScores: { pronunciation: 2, meaning: 1 } }), questionById["read-cat"])).toBe(3));
  it("normalizes skill results", () => {
    const session = createSession({ studentName: "Mia", avatarId: "cat", mode: "teacher-led", soundEnabled: true, reducedMotion: false });
    session.attempts = [attempt({ questionId: "listen-apple", attempts: 1, isCorrect: true }), attempt({ questionId: "listen-dog", attempts: 2, isCorrect: true })];
    expect(calculateSkillResults(session).find((result) => result.skill === "listening")?.percentage).toBe(75);
  });
  it("calculates stars from attempts without drift", () => {
    const session = createSession({ studentName: "Mia", avatarId: "cat", mode: "teacher-led", soundEnabled: true, reducedMotion: false });
    session.attempts = [attempt({ questionId: "listen-apple", isCorrect: true }), attempt({ questionId: "read-cat", wordScores: { pronunciation: 2, meaning: 1 } })];
    expect(getTotalStars(session)).toBe(5);
  });
  it("generates stable recommendations", () => {
    const session = createSession({ studentName: "Mia", avatarId: "cat", mode: "teacher-led", soundEnabled: true, reducedMotion: false });
    session.attempts = [attempt({ questionId: "phonics-cat", manualScore: 0 })];
    const recommendations = buildRecommendations(calculateSkillResults(session));
    expect(recommendations.join(" ")).toContain("CVC");
  });
});
