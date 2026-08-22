import { describe, expect, it } from "vitest";
import { getQuestionsForStage } from "@/content/questions";
import { assessmentReducer } from "../reducer";
import { createSession, stableShuffle } from "../session";
import { EMPTY_DATA, parsePersistedData } from "../storage";

describe("session and persistence", () => {
  it("falls back safely when storage JSON is damaged", () => expect(parsePersistedData("{not-json")).toEqual(EMPTY_DATA));
  it("filters manual questions from self play", () => {
    expect(getQuestionsForStage("reading", "self-play")).toHaveLength(0);
    expect(getQuestionsForStage("word-forest", "self-play")).toHaveLength(8);
  });
  it("contains the required data-driven question counts", () => {
    expect(getQuestionsForStage("hello", "teacher-led")).toHaveLength(5);
    expect(getQuestionsForStage("classroom", "teacher-led")).toHaveLength(6);
    expect(getQuestionsForStage("park", "teacher-led")).toHaveLength(8);
    expect(getQuestionsForStage("reading", "teacher-led")).toHaveLength(9);
    expect(getQuestionsForStage("phonics", "teacher-led")).toHaveLength(12);
    expect(getQuestionsForStage("sentence", "teacher-led")).toHaveLength(6);
  });
  it("uses a deterministic session shuffle", () => {
    expect(stableShuffle([1, 2, 3, 4], "same-seed")).toEqual(stableShuffle([1, 2, 3, 4], "same-seed"));
  });
  it("restores a completed session through hydration", () => {
    const session = createSession({ studentName: "Leo", avatarId: "dog", mode: "self-play", soundEnabled: false, reducedMotion: true });
    const complete = assessmentReducer({ version: 1, sessions: [session], activeSessionId: session.id }, { type: "COMPLETE_SESSION", sessionId: session.id });
    const restored = assessmentReducer(EMPTY_DATA, { type: "HYDRATE", data: parsePersistedData(JSON.stringify(complete)) });
    expect(restored.sessions[0].status).toBe("completed");
    expect(restored.sessions[0].studentName).toBe("Leo");
  });
  it("completes one answer and survives a serialized reload", () => {
    const session = createSession({ studentName: "Amy", avatarId: "rabbit", mode: "self-play", soundEnabled: true, reducedMotion: false });
    let data = assessmentReducer(EMPTY_DATA, { type: "CREATE_SESSION", session });
    data = assessmentReducer(data, { type: "SUBMIT_AUTO_ANSWER", sessionId: session.id, questionId: "listen-apple", optionId: "apple", correct: true });
    const restored = parsePersistedData(JSON.stringify(data));
    expect(restored.sessions[0].attempts[0]).toMatchObject({ questionId: "listen-apple", isCorrect: true, attempts: 1 });
  });
});
