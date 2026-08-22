import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QuestScreen } from "@/components/quest/QuestScreen";
import { createSession } from "@/features/assessment/session";

const mocks = vi.hoisted(() => ({
  data: { version: 1 as const, sessions: [] as unknown[] },
  dispatch: vi.fn(),
  speak: vi.fn(async () => undefined),
  stop: vi.fn(),
  playSuccessTone: vi.fn(async () => undefined),
  playErrorTone: vi.fn(async () => undefined),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock("@/features/assessment/assessment-context", () => ({
  useAssessment: () => ({ data: mocks.data, dispatch: mocks.dispatch, hydrated: true, storageAvailable: true }),
}));
vi.mock("@/hooks/useSpeech", () => ({
  useSpeech: () => ({
    supported: true,
    speaking: false,
    speak: mocks.speak,
    stop: mocks.stop,
    playSuccessTone: mocks.playSuccessTone,
    playErrorTone: mocks.playErrorTone,
    preloadRecording: vi.fn(),
    modelStatus: "idle",
    progress: { loaded: 0, total: 0 },
  }),
}));
vi.mock("@/components/assessment/StageMap", () => ({
  StageMap: ({ session, onSelect }: { session: { currentStageId: string }; onSelect: (stageId: string) => void }) => (
    <button type="button" onClick={() => onSelect(session.currentStageId)}>open stage</button>
  ),
}));
vi.mock("@/components/assessment/QuestionRenderer", () => ({
  QuestionRenderer: ({ onAutoSelect, onBlankScene, onManualScore }: {
    onAutoSelect: (optionId: string) => void;
    onBlankScene: () => void;
    onManualScore: (score: 0 | 1 | 2) => void;
  }) => (
    <div>
      <button type="button" onClick={() => onAutoSelect("banana")}>wrong answer</button>
      <button type="button" onClick={() => onAutoSelect("apple")}>correct answer</button>
      <button type="button" onClick={onBlankScene}>blank scene</button>
      <button type="button" onClick={() => onManualScore(1)}>manual score</button>
    </div>
  ),
}));
vi.mock("@/components/assessment/QuestionShell", () => ({ QuestionShell: ({ children }: { children: ReactNode }) => children }));
vi.mock("@/components/assessment/AdventureProgress", () => ({ AdventureProgress: () => null }));
vi.mock("@/components/assessment/FeedbackOverlay", () => ({ FeedbackOverlay: () => null }));
vi.mock("@/components/ui/AppHeader", () => ({ AppHeader: () => null }));

function renderQuest(attempts = 0) {
  const session = createSession({ studentName: "Mia", avatarId: "cat", mode: "self-play", soundEnabled: true, reducedMotion: true });
  session.currentStageId = "word-forest";
  session.currentQuestionIndex = 0;
  session.questionOrder["word-forest"] = ["listen-apple"];
  if (attempts > 0) {
    session.attempts = [{
      questionId: "listen-apple",
      startedAt: "2026-08-22T00:00:00.000Z",
      attempts,
      selectedOptionIds: ["banana"],
      isCorrect: false,
      hintUsed: false,
      answerRevealed: false,
      skipped: false,
    }];
  }
  mocks.data.sessions = [session];
  render(<QuestScreen sessionId={session.id} />);
  fireEvent.click(screen.getByRole("button", { name: "open stage" }));
}

describe("quest feedback audio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.data.sessions = [];
  });

  it.each([
    ["first wrong selection", 0, "wrong answer"],
    ["second wrong selection", 1, "wrong answer"],
    ["blank scene", 0, "blank scene"],
  ])("plays only the error tone for %s", (_label, attempts, buttonName) => {
    renderQuest(attempts as number);
    fireEvent.click(screen.getByRole("button", { name: buttonName as string }));

    expect(mocks.playErrorTone).toHaveBeenCalledTimes(1);
    expect(mocks.playSuccessTone).not.toHaveBeenCalled();
    expect(mocks.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: "SUBMIT_AUTO_ANSWER",
      optionId: buttonName === "blank scene" ? "__blank__" : "banana",
      correct: false,
    }));
  });

  it("plays only the success tone for a correct automatic answer", () => {
    renderQuest();
    fireEvent.click(screen.getByRole("button", { name: "correct answer" }));

    expect(mocks.playSuccessTone).toHaveBeenCalledTimes(1);
    expect(mocks.playErrorTone).not.toHaveBeenCalled();
    expect(mocks.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: "SUBMIT_AUTO_ANSWER",
      optionId: "apple",
      correct: true,
    }));
  });

  it("does not play feedback audio for manual scoring", () => {
    renderQuest();
    fireEvent.click(screen.getByRole("button", { name: "manual score" }));

    expect(mocks.playSuccessTone).not.toHaveBeenCalled();
    expect(mocks.playErrorTone).not.toHaveBeenCalled();
    expect(mocks.dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: "SUBMIT_MANUAL_SCORE", score: 1 }));
  });
});
