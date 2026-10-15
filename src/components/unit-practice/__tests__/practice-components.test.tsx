import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { practiceCollections, practiceQuests } from "@/content/unit-practice";
import { createPracticeSession, getPracticeTiles } from "@/features/unit-practice/engine";
import { PracticeProvider } from "@/features/unit-practice/practice-context";
import { parsePracticeData } from "@/features/unit-practice/storage";
import type { PracticeQuestId, PracticeTilesAttempt } from "@/features/unit-practice/types";
import { PracticeQuestion } from "../PracticeQuestion";
import { PracticePlayScreen } from "../PracticePlayScreen";
import { PracticeReportScreen } from "../PracticeReportScreen";
import { PracticeHub } from "../PracticeHub";

const mocks = vi.hoisted(() => ({ push: vi.fn(), speak: vi.fn(), stop: vi.fn(), preload: vi.fn(), tone: vi.fn(async () => undefined) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/hooks/useSpeech", () => ({ useSpeech: () => ({ supported: false, speaking: false, speak: mocks.speak, stop: mocks.stop, preloadRecording: mocks.preload, playSuccessTone: mocks.tone, playErrorTone: mocks.tone, modelStatus: "idle", progress: {} }) }));
beforeEach(() => vi.clearAllMocks());

describe("new practice interfaces", () => {
  it("shows Chinese only for a sentence, keeps its answer hidden, and can skip", () => {
    const quest = practiceQuests.meet, q = quest.questions.find((q) => q.kind === "sentence")!;
    const s = createPracticeSession("meet", "小明"), onInput = vi.fn();
    render(<PracticeQuestion question={q} attempt={s.attempts[q.id]} studentName="小明" soundEnabled={false} onInput={onInput} />);
    expect(screen.getByRole("heading", { name: "很高兴认识你。" })).toBeInTheDocument();
    expect(screen.queryByText("Nice to meet you.", { exact: true })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "检查答案" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "暂时不会" })); expect(onInput).toHaveBeenCalledWith({ type: "SKIP" });
    expect(mocks.speak).not.toHaveBeenCalled();
  });

  it.each(["morning", "meet", "review"] as PracticeQuestId[])("walks every question in %s and loads the completed report after refresh", async (id) => {
    const quest = practiceQuests[id], config = practiceCollections[quest.collection], session = createPracticeSession(id, "小明", false);
    window.localStorage.setItem(config.storageKey, JSON.stringify({ version: 1, sessions: [session] }));
    const { unmount } = render(<PracticeProvider collection={quest.collection}><PracticePlayScreen sessionId={session.id} /></PracticeProvider>);
    await screen.findByText(new RegExp(`第 1 / ${quest.questions.length} 题`));
    for (let i = 0; i < quest.questions.length; i++) {
      const q = quest.questions[i], last = i === quest.questions.length - 1;
      if (q.kind === "oral") {
        expect(screen.getByRole("button", { name: last ? "查看挑战结果" : "下一题" })).toBeDisabled();
        fireEvent.click(screen.getByRole("button", { name: /独立完成/ }));
      } else {
        for (const tile of getPracticeTiles(q)) fireEvent.click(screen.getAllByRole("button", { name: `选择${q.kind === "spelling" ? "字母" : "词卡"} ${tile.label}` })[0]);
        fireEvent.click(screen.getByRole("button", { name: "检查答案" }));
      }
      fireEvent.click(screen.getByRole("button", { name: last ? "查看挑战结果" : "下一题" }));
    }
    await waitFor(() => expect(parsePracticeData(window.localStorage.getItem(config.storageKey), quest.collection).sessions[0].completedAt).toBeTruthy());
    expect(mocks.push).toHaveBeenCalledWith(`${config.route}/report/?session=${session.id}`);
    expect(mocks.speak).not.toHaveBeenCalled();
    unmount();
    render(<PracticeProvider collection={quest.collection}><PracticeReportScreen sessionId={session.id} /></PracticeProvider>);
    await screen.findByRole("heading", { name: "小明，挑战完成啦！" });
    expect(screen.getByText(/每道题都独立完成/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "句子排序" })).toBeInTheDocument();
    expect(screen.getByText(`⭐ ${quest.questions.length * 2}`, { exact: false, selector: "strong" })).toHaveTextContent(`/ ${quest.questions.length * 2} 分`);
  }, 20000);

  it("offers both school lessons independently and never locks the fourth part", async () => {
    render(<PracticeProvider collection="school"><PracticeHub /></PracticeProvider>);
    const morning = await screen.findByRole("article", { name: "Good morning!" }), meet = screen.getByRole("article", { name: "Nice to meet you." });
    expect(within(morning).getByText("20题 · 40分")).toBeInTheDocument();
    expect(within(meet).getByText("18题 · 36分")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "小朋友叫什么名字？" }), { target: { value: "新朋友" } });
    fireEvent.click(within(meet).getByRole("button", { name: "开始挑战" }));
    await waitFor(() => expect(parsePracticeData(window.localStorage.getItem(practiceCollections.school.storageKey), "school").sessions[0].questId).toBe("meet"));
  });

  it("restores a partial sentence and its retry counter, and lists skipped answers for review", async () => {
    const quest = practiceQuests.morning, s = createPracticeSession("morning", "小明", false);
    const first = quest.questions.findIndex((q) => q.kind === "sentence"); s.currentIndex = first;
    for (const q of quest.questions.slice(0, first)) s.attempts[q.id] = q.kind === "oral" ? { kind: "oral", score: 2 } : { ...s.attempts[q.id], selected: getPracticeTiles(q).map((t) => t.id), submissions: 1, status: "correct", score: 2 } as PracticeTilesAttempt;
    const q = quest.questions[first], a = s.attempts[q.id] as PracticeTilesAttempt;
    a.selected = ["token-1"]; a.submissions = 1;
    window.localStorage.setItem(practiceCollections.school.storageKey, JSON.stringify({ version: 1, sessions: [s] }));
    render(<PracticeProvider collection="school"><PracticePlayScreen sessionId={s.id} /></PracticeProvider>);
    await screen.findByRole("button", { name: "撤回第1张词卡 morning!" });
    expect(screen.getByRole("button", { name: "检查答案" })).toBeDisabled();
    expect(screen.getByText(/词序还需要调整/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "暂时不会" }));
    expect(screen.getByText("Good morning!", { exact: true, selector: "p" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "下一题" })).toBeEnabled();
  });
});
