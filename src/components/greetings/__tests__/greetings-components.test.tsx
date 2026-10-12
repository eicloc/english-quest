import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { greetingQuestions } from "@/content/greetings/questions";
import { GreetingQuestion } from "../GreetingQuestion";
import { GreetingsPlayScreen } from "../GreetingsPlayScreen";
import { GreetingsReportScreen } from "../GreetingsReportScreen";
import { GreetingsWelcomeScreen } from "../GreetingsWelcomeScreen";
import { GreetingsProvider } from "@/features/greetings/greetings-context";
import { createGreetingSession } from "@/features/greetings/engine";
import { GREETINGS_STORAGE_KEY, parseGreetingsData } from "@/features/greetings/storage";
import type { GreetingOralQuestion, GreetingSpellingQuestion } from "@/features/greetings/types";

const mocks = vi.hoisted(() => ({ push: vi.fn(), speak: vi.fn(async () => undefined), stop: vi.fn(), success: vi.fn(async () => undefined), error: vi.fn(async () => undefined), preload: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/hooks/useSpeech", () => ({ useSpeech: () => ({ supported: false, speaking: false, speak: mocks.speak, stop: mocks.stop, playSuccessTone: mocks.success, playErrorTone: mocks.error, preloadRecording: mocks.preload, modelStatus: "idle", progress: { loaded: 0, total: 0 } }) }));

beforeEach(() => vi.clearAllMocks());

describe("greeting question interfaces", () => {
  it("shows bilingual prompts, folds teacher answers and accepts manual scoring", () => {
    const question = greetingQuestions[2] as GreetingOralQuestion;
    const onAction = vi.fn();
    const { container } = render(<GreetingQuestion question={question} attempt={{ kind: "oral" }} studentName="小明" soundEnabled={false} onAction={onAction} />);
    expect(screen.getByRole("heading", { name: "Hi! I am Jenny." })).toBeInTheDocument();
    expect(screen.getByText("你好！我叫詹妮。")).toBeInTheDocument();
    expect(container.querySelector("details")).not.toHaveAttribute("open");
    fireEvent.click(screen.getByText(/老师参考/));
    expect(screen.getByText("Hi! I’m 小明.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /独立完成/ }));
    expect(onAction).toHaveBeenCalledWith({ type: "SCORE_ORAL", score: 2 });
    expect(mocks.speak).not.toHaveBeenCalled();
  });

  it("hides spelling answers and disables checking before all letters are selected", () => {
    const question = greetingQuestions[7] as GreetingSpellingQuestion;
    const onAction = vi.fn();
    const session = createGreetingSession("小明");
    const attempt = session.attempts[question.id];
    render(<GreetingQuestion question={question} attempt={attempt} studentName="小明" soundEnabled={false} onAction={onAction} />);
    expect(screen.getByRole("heading", { name: "你好" })).toBeInTheDocument();
    expect(screen.queryByText("hello", { exact: true })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "检查答案" })).toBeDisabled();
    expect(screen.getAllByRole("button", { name: "选择字母 l" })).toHaveLength(2);
    fireEvent.click(screen.getAllByRole("button", { name: "选择字母 l" })[1]);
    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ type: "SELECT_LETTER" }));
  });

  it("completes the real 26-question UI flow, persists it, and renders the report", async () => {
    const session = createGreetingSession("小明", false);
    window.localStorage.setItem(GREETINGS_STORAGE_KEY, JSON.stringify({ version: 1, sessions: [session] }));
    const { unmount } = render(<GreetingsProvider><GreetingsPlayScreen sessionId={session.id} /></GreetingsProvider>);
    await screen.findByRole("heading", { name: "Hi!" });
    for (let i = 0; i < greetingQuestions.length; i++) {
      const question = greetingQuestions[i];
      expect(screen.getByText(new RegExp(`第 ${i + 1} / 26 题`))).toBeInTheDocument();
      if (question.kind === "oral") {
        expect(screen.getByRole("button", { name: i === 25 ? "查看挑战结果" : "下一题" })).toBeDisabled();
        fireEvent.click(screen.getByRole("button", { name: /独立完成/ }));
      } else {
        for (const letter of question.word) fireEvent.click(screen.getAllByRole("button", { name: `选择字母 ${letter}` })[0]);
        fireEvent.click(screen.getByRole("button", { name: "检查答案" }));
        expect(within(screen.getByRole("group", { name: "已选字母" })).getAllByRole("button").every((button) => button.hasAttribute("disabled"))).toBe(true);
      }
      fireEvent.click(screen.getByRole("button", { name: i === 25 ? "查看挑战结果" : "下一题" }));
    }
    await waitFor(() => expect(parseGreetingsData(window.localStorage.getItem(GREETINGS_STORAGE_KEY)).sessions[0].completedAt).toBeTruthy());
    expect(mocks.push).toHaveBeenCalledWith(`/greetings/report/?session=${session.id}`);
    expect(mocks.speak).not.toHaveBeenCalled();
    unmount();
    render(<GreetingsProvider><GreetingsReportScreen sessionId={session.id} /></GreetingsProvider>);
    await screen.findByRole("heading", { name: "小明，交朋友挑战完成啦！" });
    expect(screen.getByText("52", { exact: false, selector: "strong" })).toHaveTextContent("52/ 52 分");
    expect(screen.getByText(/每道题都独立完成/)).toBeInTheDocument();
    expect(screen.getByText("14/14 分")).toBeInTheDocument();
    expect(screen.getByText("16/16 分")).toBeInTheDocument();
  }, 20000);

  it("starts a new record while keeping an unfinished session available", async () => {
    const session = createGreetingSession("旧朋友", false);
    window.localStorage.setItem(GREETINGS_STORAGE_KEY, JSON.stringify({ version: 1, sessions: [session] }));
    render(<GreetingsProvider><GreetingsWelcomeScreen /></GreetingsProvider>);
    await screen.findByRole("button", { name: /重新挑战/ });
    expect(screen.getByRole("link", { name: "继续挑战" }).getAttribute("href")).toMatch(new RegExp(`/greetings/play/?\\?session=${session.id}$`));
    fireEvent.change(screen.getByRole("textbox", { name: "小朋友叫什么名字？" }), { target: { value: "新朋友" } });
    fireEvent.click(screen.getByRole("button", { name: /重新挑战/ }));
    await waitFor(() => expect(parseGreetingsData(window.localStorage.getItem(GREETINGS_STORAGE_KEY)).sessions).toHaveLength(2));
    expect(parseGreetingsData(window.localStorage.getItem(GREETINGS_STORAGE_KEY)).sessions.some((item) => item.id === session.id)).toBe(true);
  });
});
