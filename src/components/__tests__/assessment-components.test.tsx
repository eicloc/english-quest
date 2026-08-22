import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PictureChoiceGrid } from "@/components/assessment/PictureChoiceGrid";
import { ManualScoreButtons } from "@/components/assessment/ManualScoreButtons";
import { AudioPromptButton } from "@/components/assessment/AudioPromptButton";
import { QuestionRenderer } from "@/components/assessment/QuestionRenderer";
import { TeacherControlPanel } from "@/components/teacher/TeacherControlPanel";
import { StudentRewardView } from "@/components/report/StudentRewardView";
import { buildReport } from "@/features/assessment/scoring";
import { createSession } from "@/features/assessment/session";
import { questionById } from "@/content/questions";

describe("assessment components", () => {
  it("PictureChoiceGrid submits the selected option", () => {
    const onSelect = vi.fn();
    render(<PictureChoiceGrid options={[{ id: "cat", emoji: "🐱", alt: "cat" }, { id: "dog", emoji: "🐶", alt: "dog" }]} correctOptionId="cat" onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: "cat" }));
    expect(onSelect).toHaveBeenCalledWith("cat");
  });
  it("PictureChoiceGrid hides answer text before answering and reveals it afterwards", () => {
    const options = [{ id: "cat", emoji: "🐱", label: "cat", zh: "猫", alt: "cat" }, { id: "dog", emoji: "🐶", label: "dog", zh: "狗", alt: "dog" }];
    const { rerender } = render(<PictureChoiceGrid options={options} correctOptionId="cat" hideTextUntilAnswer onSelect={vi.fn()} />);
    expect(screen.queryByText("cat")).not.toBeInTheDocument();
    expect(screen.queryByText("猫")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "图片选项 1" })).toBeInTheDocument();

    rerender(<PictureChoiceGrid options={options} correctOptionId="cat" hideTextUntilAnswer answerFinalized selectedOptionIds={["cat"]} onSelect={vi.fn()} />);
    expect(screen.getByText("cat")).toBeInTheDocument();
    expect(screen.getByText("猫")).toBeInTheDocument();
  });
  it("PictureChoiceGrid only marks the latest attempt as selected", () => {
    render(<PictureChoiceGrid options={[{ id: "cat", emoji: "🐱", alt: "cat" }, { id: "dog", emoji: "🐶", alt: "dog" }]} selectedOptionIds={["dog", "cat"]} correctOptionId="cat" onSelect={vi.fn()} />);
    expect(screen.getByRole("button", { name: "cat" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "dog" })).toHaveAttribute("aria-pressed", "false");
  });
  it("shows the selected keyword IPA immediately and only reveals the correct IPA when finalized", () => {
    const options = [
      { id: "apple", emoji: "🍎", label: "apple", pronunciationWord: "apple", alt: "apple" },
      { id: "banana", emoji: "🍌", label: "banana", pronunciationWord: "banana", alt: "banana" },
    ];
    const { container, rerender } = render(<PictureChoiceGrid options={options} selectedOptionIds={["banana"]} correctOptionId="apple" hideTextUntilAnswer onSelect={vi.fn()} />);
    expect(container.querySelector('[data-pronunciation-word="banana"]')).toHaveTextContent("US /bəˈnænə/");
    expect(container.querySelector('[data-pronunciation-word="apple"]')).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "banana" })).toHaveClass("border-rose-300");

    rerender(<PictureChoiceGrid options={options} selectedOptionIds={["banana"]} correctOptionId="apple" hideTextUntilAnswer answerFinalized onSelect={vi.fn()} />);
    expect(container.querySelector('[data-pronunciation-word="banana"]')).toHaveTextContent("所选关键词");
    expect(container.querySelector('[data-pronunciation-word="apple"]')).toHaveTextContent("正确关键词");
  });
  it("shows selected and corrected hotspot pronunciations without changing scene scoring", () => {
    const question = questionById["class-teacher"];
    if (question.type !== "scene-hotspot") throw new Error("Expected a scene hotspot question");
    const props = {
      question,
      settings: { soundEnabled: true, reducedMotion: true, hotspotDebug: false, hintVisible: false },
      interactionLocked: false,
      onAutoSelect: vi.fn(),
      onSceneSelect: vi.fn(),
      onBlankScene: vi.fn(),
      onManualScore: vi.fn(),
      onWordScore: vi.fn(),
      onReveal: vi.fn(),
    };
    const attempt = { questionId: question.id, startedAt: "2026-08-22T00:00:00.000Z", attempts: 1, selectedOptionIds: ["book"], isCorrect: false, hintUsed: false, answerRevealed: false, skipped: false };
    const { container, rerender } = render(<QuestionRenderer {...props} attempt={attempt} />);
    expect(container.querySelector('[data-pronunciation-word="book"]')).toBeInTheDocument();
    expect(container.querySelector('[data-pronunciation-word="teacher"]')).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "book" })).toHaveClass("ring-rose-400");

    rerender(<QuestionRenderer {...props} attempt={{ ...attempt, attempts: 2, completedAt: "2026-08-22T00:00:01.000Z" }} />);
    expect(container.querySelector('[data-pronunciation-word="book"]')).toBeInTheDocument();
    expect(container.querySelector('[data-pronunciation-word="teacher"]')).toHaveTextContent("正确关键词");
  });
  it("PictureChoiceGrid renders the corrected cat-under-table illustration", () => {
    const { container } = render(<PictureChoiceGrid options={[{ id: "under", illustration: "cat-under-table", alt: "cat under the table" }]} correctOptionId="under" onSelect={vi.fn()} />);
    expect(container.querySelector('[data-illustration="cat-under-table"]')).toBeInTheDocument();
  });
  it("ManualScoreButtons reports a manual score", () => {
    const onChange = vi.fn();
    render(<ManualScoreButtons onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /独立完成/ }));
    expect(onChange).toHaveBeenCalledWith(2);
  });
  it("AudioPromptButton falls back when speech is unavailable", () => {
    render(<AudioPromptButton text="hello" enabled />);
    const buttons = screen.getAllByRole("button", { name: "当前语音不可用" });
    expect(buttons).toHaveLength(2);
    expect(buttons.every((button) => button.hasAttribute("disabled"))).toBe(true);
  });
  it("TeacherControlPanel exposes core navigation controls", () => {
    const session = createSession({ studentName: "Mia", avatarId: "cat", mode: "teacher-led", soundEnabled: true, reducedMotion: false });
    render(<TeacherControlPanel session={session} questionNumber={1} totalQuestions={5} onPrevious={vi.fn()} onNext={vi.fn()} onSkip={vi.fn()} onRetry={vi.fn()} onReplay={vi.fn()} onToggleHint={vi.fn()} onReveal={vi.fn()} onToggleDebug={vi.fn()} onToggleSound={vi.fn()} onToggleMotion={vi.fn()} onPause={vi.fn()} onMap={vi.fn()} onEnd={vi.fn()} onNote={vi.fn()} />);
    expect(screen.getByRole("button", { name: /下一题/ })).toBeEnabled();
    expect(screen.getByRole("button", { name: /上一题/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /US 美音/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /UK 英音/ })).toBeDisabled();
  });
  it("StudentRewardView shows positive rewards without percentages", () => {
    const session = createSession({ studentName: "Mia", avatarId: "cat", mode: "self-play", soundEnabled: true, reducedMotion: true });
    session.badges = ["hello"];
    render(<StudentRewardView session={session} report={buildReport(session)} />);
    expect(screen.getByRole("heading", { name: "英语冒险完成啦！" })).toBeInTheDocument();
    expect(screen.getByText("参与徽章")).toBeInTheDocument();
    expect(screen.queryByText(/不及格|失败|%/)).not.toBeInTheDocument();
  });
});
