"use client";

import { Check, RotateCcw } from "lucide-react";
import { getBattleHint, getBattleTiles } from "@/features/sentence-battle/engine";
import type { BattleAttempt, BattleRunAction, SentenceQuestion, SentenceTraining } from "@/features/sentence-battle/types";

export function BattleQuestion({ training, question, attempt, onAction }: {
  training: SentenceTraining;
  question: SentenceQuestion;
  attempt: BattleAttempt;
  onAction: (action: BattleRunAction) => void;
}) {
  const tiles = getBattleTiles(question);
  const tileById = new Map(tiles.map((tile) => [tile.id, tile]));
  const canSubmit = attempt.selected.length === (question.answer ? 1 : tiles.length);
  return <div>
    <div className="mx-auto mb-5 flex min-h-24 max-w-md items-center justify-center rounded-[24px] bg-gradient-to-br from-sky-100 via-emerald-50 to-amber-50 p-4 text-5xl sm:text-6xl" aria-hidden="true">{question.emoji}</div>
    <h2 className="text-center text-xl font-black sm:text-2xl">{question.answer ? "选出正确的答句" : "点击词卡，组成正确的问句"}</h2>
    {question.polarity && <p className="mt-3 text-center text-sm font-black text-violet-700">{question.answer ? "请作" : "口头回答提示："}{question.polarity === "yes" ? "肯定回答（Yes）" : "否定回答（No）"}</p>}
    {question.answer ? <>
      <p className="my-6 text-center text-2xl font-black leading-relaxed text-slate-700 sm:text-4xl">{question.question}</p>
      <div role="group" aria-label="答句选项" className="grid gap-3">{attempt.order.map((id) => <button key={id} type="button" disabled={attempt.solved} aria-pressed={attempt.selected.includes(id)} onClick={() => onAction({ type: "SELECT", tileId: id })} className={`game-button flex min-h-16 items-center justify-center gap-2 border-2 px-4 py-3 text-lg sm:text-xl ${attempt.selected.includes(id) ? attempt.solved ? "border-emerald-400 bg-emerald-50 text-emerald-800" : "border-violet-400 bg-violet-50 text-violet-800" : "border-slate-100 bg-white hover:border-violet-200"}`}>{attempt.solved && attempt.selected.includes(id) && <Check className="size-5" />}{tileById.get(id)?.label}</button>)}</div>
    </> : <>
      <div role="group" aria-label="句子排列区" className="mt-6 flex min-h-28 flex-wrap items-center justify-center gap-2 rounded-[24px] border-2 border-dashed border-emerald-200 bg-emerald-50/60 p-4">{attempt.selected.length ? attempt.selected.map((id) => <button key={id} type="button" disabled={attempt.solved} aria-label={`移回词卡 ${tileById.get(id)?.label}`} onClick={() => onAction({ type: "REMOVE", tileId: id })} className="game-button min-h-12 bg-emerald-700 px-4 py-2 text-lg text-white">{tileById.get(id)?.label}</button>) : <p className="font-bold text-emerald-700">依次点击下方词卡，把问句放在这里</p>}</div>
      <div role="group" aria-label="待选词卡" className="mt-5 flex min-h-16 flex-wrap items-center justify-center gap-2">{attempt.order.filter((id) => !attempt.selected.includes(id)).map((id) => <button key={id} type="button" disabled={attempt.solved} aria-label={`添加词卡 ${tileById.get(id)?.label}`} onClick={() => onAction({ type: "SELECT", tileId: id })} className="game-button min-h-12 border-2 border-slate-100 bg-white px-4 py-2 text-lg hover:border-emerald-300">{tileById.get(id)?.label}</button>)}</div>
    </>}
    <div className="mt-6 flex flex-wrap justify-center gap-3">
      {!question.answer && <button type="button" disabled={attempt.solved || !attempt.selected.length} onClick={() => onAction({ type: "CLEAR" })} className="game-button flex min-h-12 items-center gap-2 bg-slate-100 px-5 text-sm disabled:opacity-40"><RotateCcw className="size-4" />重排</button>}
      <button type="button" disabled={attempt.solved || !canSubmit} onClick={() => onAction({ type: "SUBMIT", completedAt: new Date().toISOString() })} className="game-button min-h-12 bg-emerald-700 px-7 text-white shadow-sm hover:bg-emerald-800 disabled:opacity-40">{attempt.solved ? "已答对" : "检查答案"}</button>
    </div>
    {attempt.solved ? <div role="status" className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-bold text-emerald-800"><p>答对啦！本题已攻击一次，怪物扣 10 血。</p><p className="mt-2 text-sm">{question.answer ?? question.question}</p></div> : attempt.errors > 0 && <div role="status" className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 font-bold text-amber-900"><p>再想一想，调整后可以继续尝试。</p><p className="mt-2 text-sm leading-6">{getBattleHint(training, question)}</p>{attempt.errors >= 2 && <p className="mt-3 rounded-xl bg-white/70 p-3">一起记住：{question.answer ?? question.question}</p>}</div>}
  </div>;
}
