import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdventureHub } from "@/components/home/AdventureHub";
import { sentenceTrainings } from "@/content/sentence-battle/trainings";
import { BattleProvider } from "@/features/sentence-battle/battle-context";
import { createBattleRun, getBattleTiles, reduceBattleData } from "@/features/sentence-battle/engine";
import { BATTLE_STORAGE_KEY, emptyBattleData, parseBattleData } from "@/features/sentence-battle/storage";
import type { BattleRunAction } from "@/features/sentence-battle/types";
import { BattleHub } from "../BattleHub";
import { BattleScreen } from "../BattleScreen";

const sortTraining = sentenceTrainings.find((training) => training.id === "is-things")!;
const choiceTraining = sentenceTrainings.find((training) => training.id === "are-you-answers")!;

async function startScreen(trainingId: string) {
  const view = render(<BattleProvider><BattleScreen trainingId={trainingId} /></BattleProvider>);
  fireEvent.click(await screen.findByRole("button", { name: "开始挑战" }));
  return view;
}

describe("sentence battle screens", () => {
  it("adds the homepage entry alongside all existing destinations", () => {
    render(<AdventureHub />);
    const paths = screen.getAllByRole("link").map((link) => new URL(link.getAttribute("href")!, "http://localhost").pathname.replace(/\/$/, ""));
    for (const path of ["/assessment", "/grammar", "/sentence-battle", "/words"]) expect(paths).toContain(path);
  });

  it("lists 18 unlocked trainings across five groups and restores completion labels", async () => {
    const data = reduceBattleData(emptyBattleData(), { type: "START", trainingId: sortTraining.id, run: createBattleRun(sortTraining) });
    data.trainings[sortTraining.id].everCompleted = true;
    window.localStorage.setItem(BATTLE_STORAGE_KEY, JSON.stringify(data));
    render(<BattleProvider><BattleHub /></BattleProvider>);
    expect(await screen.findByText("已通关 1 / 18")).toBeInTheDocument();
    expect(screen.getAllByRole("link").filter((link) => new URL(link.getAttribute("href")!, "http://localhost").searchParams.has("training"))).toHaveLength(18);
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(5);
    expect(screen.getByText("继续挑战")).toBeInTheDocument();
  });

  it("supports word-card edits, restores a draft after remount, and attacks only once", async () => {
    const view = await startScreen(sortTraining.id);
    const question = sortTraining.questions[0];
    fireEvent.click(screen.getByRole("button", { name: "添加词卡 Is" }));
    fireEvent.click(screen.getByRole("button", { name: "移回词卡 Is" }));
    expect(within(screen.getByRole("group", { name: "句子排列区" })).queryAllByRole("button")).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "添加词卡 Is" }));
    const stored = window.localStorage.getItem(BATTLE_STORAGE_KEY);
    const order = parseBattleData(stored).trainings[sortTraining.id].run.attempts[0].order;
    view.unmount();
    render(<BattleProvider><BattleScreen trainingId={sortTraining.id} /></BattleProvider>);
    expect(await screen.findByRole("button", { name: "移回词卡 Is" })).toBeInTheDocument();
    expect(parseBattleData(window.localStorage.getItem(BATTLE_STORAGE_KEY)).trainings[sortTraining.id].run.attempts[0].order).toEqual(order);
    for (const tile of getBattleTiles(question).slice(1)) fireEvent.click(screen.getByRole("button", { name: `添加词卡 ${tile.label}` }));
    fireEvent.click(screen.getByRole("button", { name: "检查答案" }));
    expect(screen.getByRole("progressbar", { name: "怪物血量" })).toHaveAttribute("aria-valuenow", "90");
    fireEvent.click(screen.getByRole("button", { name: "已答对" }));
    expect(screen.getByRole("progressbar", { name: "怪物血量" })).toHaveAttribute("aria-valuenow", "90");
    fireEvent.click(screen.getByRole("button", { name: "下一题" }));
    fireEvent.click(screen.getByRole("button", { name: "上一题回看" }));
    expect(screen.getByRole("button", { name: "已答对" })).toBeDisabled();
  });

  it("shows a hint, reveals after two errors, and accepts a corrected choice", async () => {
    await startScreen(choiceTraining.id);
    expect(screen.getByText("请作肯定回答（Yes）")).toBeInTheDocument();
    const wrong = getBattleTiles(choiceTraining.questions[0])[1].label;
    fireEvent.click(screen.getByRole("button", { name: wrong }));
    fireEvent.click(screen.getByRole("button", { name: "检查答案" }));
    expect(screen.getByText(/问句里的 you，回答时换成 I/)).toBeInTheDocument();
    expect(screen.queryByText(/一起记住：/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "检查答案" }));
    expect(screen.getByText("一起记住：Yes, I am.")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "怪物血量" })).toHaveAttribute("aria-valuenow", "100");
    fireEvent.click(screen.getByRole("button", { name: "Yes, I am." }));
    fireEvent.click(screen.getByRole("button", { name: "检查答案" }));
    expect(screen.getByRole("progressbar", { name: "怪物血量" })).toHaveAttribute("aria-valuenow", "90");
  });

  it("keeps both victory results visible through reload and supports a second wave", async () => {
    let data = reduceBattleData(emptyBattleData(), { type: "START", trainingId: choiceTraining.id, run: createBattleRun(choiceTraining, () => 0.9) });
    function play(action: BattleRunAction) {
      const run = data.trainings[choiceTraining.id].run;
      data = reduceBattleData(data, { type: "PLAY", trainingId: choiceTraining.id, runId: run.id, questionIndex: run.currentIndex, action });
    }
    for (let i = 0; i < 10; i++) {
      play({ type: "SELECT", tileId: "answer-0" });
      play({ type: "SUBMIT", completedAt: "2026-09-13T10:00:00Z" });
      if (i < 9) play({ type: "NEXT" });
    }
    window.localStorage.setItem(BATTLE_STORAGE_KEY, JSON.stringify(data));
    const view = render(<BattleProvider><BattleScreen trainingId={choiceTraining.id} /></BattleProvider>);
    expect(await screen.findByRole("heading", { name: /第一只怪物被击败/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "挑战第二只怪物" }));
    expect(screen.getByRole("progressbar", { name: "怪物血量" })).toHaveAttribute("aria-valuenow", "100");
    for (let i = 10; i < 20; i++) {
      fireEvent.click(screen.getByRole("button", { name: choiceTraining.questions[i].answer! }));
      fireEvent.click(screen.getByRole("button", { name: "检查答案" }));
      if (i < 19) fireEvent.click(screen.getByRole("button", { name: "下一题" }));
    }
    expect(screen.getByRole("heading", { name: /两只怪物都击败/ })).toBeInTheDocument();
    view.unmount();
    render(<BattleProvider><BattleScreen trainingId={choiceTraining.id} /></BattleProvider>);
    expect(await screen.findByRole("heading", { name: /两只怪物都击败/ })).toBeInTheDocument();
    expect(screen.getByText("本轮金币 2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "上一题回看" }));
    expect(screen.getByRole("heading", { name: /两只怪物都击败/ })).toBeInTheDocument();
  });

  it("handles invalid links and unavailable storage without crashing", async () => {
    const view = render(<BattleProvider><BattleScreen trainingId="missing" /></BattleProvider>);
    expect(await screen.findByRole("heading", { name: "没有找到这个训练" })).toBeInTheDocument();
    view.unmount();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("full"); });
    render(<BattleProvider><BattleScreen trainingId={sortTraining.id} /></BattleProvider>);
    await waitFor(() => expect(screen.getByText(/当前浏览器无法保存进度/)).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "开始挑战" }));
    expect(screen.getByRole("heading", { name: "点击词卡，组成正确的问句" })).toBeInTheDocument();
  });
});
