import { findSentenceTraining } from "@/content/sentence-battle/trainings";
import type { BattleAction, BattleData, BattleProgress, BattleRun, BattleTile, SentenceQuestion, SentenceTraining } from "./types";

export const battleMonsters = ["🐱", "🐶", "🐰", "🐻", "🐼", "🐨", "🦊", "🐷", "🐮", "🐑", "🐸", "🐯", "🦁", "🐵", "🐔", "🐧", "🐦", "🐤", "🦋", "🐝", "🐞", "🐢", "🐙", "🦑", "🦖", "🦕", "🦄", "👻", "🤖", "👾", "🧸", "🐹", "🦔", "🐿️", "🦥", "🐽", "🦙"];

export function getBattleTiles(question: SentenceQuestion): BattleTile[] {
  if (!question.answer) return question.question.split(/\s+/).map((label, index) => ({ id: `word-${index}`, label }));
  // One distractor changes the subject, the other changes the auxiliary.
  const answer = question.answer;
  const wrongSubject = /\bthey\b/.test(answer) ? answer.replace(/\bthey\b/, "we")
    : /\bhe\b/.test(answer) ? answer.replace(/\bhe\b/, "she")
    : /\bshe\b/.test(answer) ? answer.replace(/\bshe\b/, "he")
    : /\bit\b/.test(answer) ? answer.replace(/\bit\b/, "he")
    : answer.includes("I'm") ? answer.replace("I'm", "you're")
    : answer.includes("I am") ? answer.replace("I am", "you are")
    : answer.replace(/\bI\b/, "you");
  const wrongAuxiliary = answer.replace(/\b(can't|can|doesn't|does|don't|do|aren't|are|isn't|is|am)\b|I'm/g, (word) => ({
    "can't": "don't", can: "do", "doesn't": "don't", does: "do", "don't": "doesn't", do: "does", "aren't": "isn't", are: "is", "isn't": "aren't", is: "are", am: "are", "I'm": "I is",
  })[word] ?? word);
  return [answer, wrongSubject, wrongAuxiliary].map((label, index) => ({ id: `answer-${index}`, label }));
}

export function getBattleHint(training: SentenceTraining, question: SentenceQuestion): string {
  if (training.kind === "question-sort") return `把 ${training.family} 放在句首，接着放人称或指示词，再放其余内容，问号放在句尾。`;
  if (question.question.startsWith("Are you")) return "问句里的 you，回答时换成 I；和 I 搭配的 be 动词是 am。";
  if (/^Is (this|that|it)\b/.test(question.question)) return "this、that 和 it 都用 it 回答，搭配 is；否定时用 isn't。";
  if (training.family === "Are") return "these 和 those 都用 they 回答，搭配 are；否定时用 aren't。";
  if (training.family === "Is") return "看清是 he 还是 she，答句沿用这个人称，搭配 is 或 isn't。";
  return `答句沿用 ${training.family.toLowerCase()}；问句里的 you 换成 I，he / she 保持不变。再看清需要肯定还是否定回答。`;
}

export function isBattleAnswerCorrect(question: SentenceQuestion, selected: string[]): boolean {
  const tiles = getBattleTiles(question);
  if (new Set(selected).size !== selected.length) return false;
  if (question.answer) return selected.length === 1 && selected[0] === "answer-0";
  return selected.length === tiles.length && selected.every((id, index) => tiles.find((tile) => tile.id === id)?.label === tiles[index].label);
}

function shuffledIds(tiles: BattleTile[], random: () => number) {
  const ids = tiles.map((tile) => tile.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  if (ids.length > 1 && ids.every((id, index) => id === tiles[index].id)) ids.push(ids.shift()!);
  return ids;
}

export function createBattleRun(training: SentenceTraining, random = Math.random, id = crypto.randomUUID()): BattleRun {
  return {
    id,
    currentIndex: 0,
    wave: 0,
    attempts: training.questions.map((question) => ({ order: shuffledIds(getBattleTiles(question), random), selected: [], errors: 0, solved: false })),
    monsters: [battleMonsters[Math.floor(random() * battleMonsters.length)], battleMonsters[Math.floor(random() * battleMonsters.length)]],
    drops: [random() < 0.5 ? 0 : 1, random() < 0.5 ? 0 : 1],
    rewards: [null, null],
  };
}

export function battleSolvedCount(run: BattleRun) {
  return run.attempts.filter((attempt) => attempt.solved).length;
}

export function battleHp(run: BattleRun) {
  return 100 - run.attempts.slice(run.wave * 10, run.wave * 10 + 10).filter((attempt) => attempt.solved).length * 10;
}

export function battleCoins(run: BattleRun) {
  return run.rewards.reduce<number>((sum, reward) => sum + (reward ?? 0), 0);
}

export function reduceBattleData(data: BattleData, event: BattleAction): BattleData {
  const training = findSentenceTraining(event.trainingId);
  if (!training) return data;
  const previous = data.trainings[training.id];
  let progress: BattleProgress;
  if (event.type === "START") {
    if (previous && !event.restart) return data;
    progress = { everCompleted: previous?.everCompleted ?? false, completedAt: previous?.completedAt, run: event.run };
  } else {
    if (!previous || previous.run.id !== event.runId || previous.run.currentIndex !== event.questionIndex) return data;
    const run = previous.run;
    const question = training.questions[run.currentIndex];
    const attempt = run.attempts[run.currentIndex];
    const action = event.action;
    let nextRun: BattleRun;
    if (action.type === "PREVIOUS") {
      if (run.currentIndex === 0) return data;
      nextRun = { ...run, currentIndex: run.currentIndex - 1 };
    } else if (action.type === "NEXT") {
      if (!attempt.solved || run.currentIndex >= training.questions.length - 1) return data;
      const nextIndex = run.currentIndex + 1;
      nextRun = { ...run, currentIndex: nextIndex, wave: nextIndex >= 10 ? 1 : run.wave };
    } else {
      if (attempt.solved) return data;
      const updated = { ...attempt };
      if (action.type === "SELECT") {
        if (!attempt.order.includes(action.tileId)) return data;
        if (training.kind === "question-sort" && attempt.selected.includes(action.tileId)) return data;
        updated.selected = training.kind === "question-sort" ? [...attempt.selected, action.tileId] : [action.tileId];
      } else if (action.type === "REMOVE") updated.selected = attempt.selected.filter((id) => id !== action.tileId);
      else if (action.type === "CLEAR") updated.selected = [];
      else {
        const expectedLength = question.answer ? 1 : attempt.order.length;
        if (attempt.selected.length !== expectedLength) return data;
        updated.solved = isBattleAnswerCorrect(question, attempt.selected);
        if (!updated.solved) updated.errors++;
      }
      nextRun = { ...run, attempts: run.attempts.map((item, index) => index === run.currentIndex ? updated : item) };
      if (updated.solved) {
        const solved = battleSolvedCount(nextRun);
        if (solved === 10 && run.rewards[0] === null) nextRun.rewards = [run.drops[0], null];
        if (solved === 20 && run.rewards[1] === null) nextRun.rewards = [run.rewards[0], run.drops[1]];
      }
    }
    progress = { ...previous, run: nextRun };
    if (battleSolvedCount(nextRun) === 20 && !run.attempts.every((item) => item.solved) && action.type === "SUBMIT") {
      progress.everCompleted = true;
      progress.completedAt = action.completedAt;
    }
  }
  return { ...data, trainings: { ...data.trainings, [training.id]: progress } };
}
