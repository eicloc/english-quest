"use client";

import { RotateCcw } from "lucide-react";
import { OralQuestion, SpellingQuestion } from "@/components/greetings/GreetingQuestion";
import { AudioPromptButton } from "@/components/assessment/AudioPromptButton";
import { getPracticeTiles } from "@/features/unit-practice/engine";
import type { GreetingQuestionAction } from "@/features/greetings/types";
import type { PracticeAttempt, PracticeInput, PracticeQuestion as Question } from "@/features/unit-practice/types";

export function PracticeQuestion({ question, attempt, studentName, soundEnabled, onInput }: {
  question: Question; attempt: PracticeAttempt; studentName: string; soundEnabled: boolean; onInput: (input: PracticeInput) => void;
}) {
  function legacyInput(a: GreetingQuestionAction) {
    if (a.type === "SCORE_ORAL") onInput({ type: "SCORE", score: a.score });
    else if (a.type === "SELECT_LETTER") onInput({ type: "SELECT", tileId: a.tileId });
    else if (a.type === "REMOVE_LETTER") onInput({ type: "REMOVE", tileId: a.tileId });
    else if (a.type === "CLEAR_LETTERS") onInput({ type: "CLEAR" });
    else if (a.type === "SUBMIT_SPELLING") onInput({ type: "SUBMIT" });
    else onInput({ type: "SKIP" });
  }
  if (question.kind === "oral" && attempt.kind === "oral") return <OralQuestion question={question} attempt={attempt} studentName={studentName} soundEnabled={soundEnabled} onAction={legacyInput} />;
  if (question.kind === "spelling" && attempt.kind === "spelling") return <>
    <SpellingQuestion question={question} attempt={{ ...attempt, kind: "spelling" }} soundEnabled={soundEnabled} onAction={legacyInput} />
    {question.word === "to" && attempt.status !== "pending" && <p className="mt-4 text-sm font-semibold text-slate-500">老师提示：Nice to meet you 整句表示“很高兴认识你”，其中 to 不逐字译成“到”。</p>}
  </>;
  if (question.kind !== "sentence" || attempt.kind === "oral") return null;
  const tiles = getPracticeTiles(question), labels = new Map(tiles.map((t) => [t.id, t.label]));
  const locked = attempt.status !== "pending";
  return <div>
    <p className="font-bold text-slate-500">看中文，点击词卡，拼成英文句子。</p>
    <h1 className="my-6 text-2xl font-black leading-relaxed text-amber-800 sm:text-3xl">{question.translationZh}</h1>
    <div role="group" aria-label="句子排列区" className="flex min-h-32 flex-wrap items-center justify-center gap-2 rounded-[24px] border-2 border-dashed border-amber-200 bg-amber-50 p-4">
      {attempt.selected.length ? attempt.selected.map((id, i) => <button key={id} type="button" disabled={locked} aria-label={`撤回第${i + 1}张词卡 ${labels.get(id)}`} onClick={() => onInput({ type: "REMOVE", tileId: id })} className="game-button min-h-14 break-words bg-amber-700 px-4 py-3 text-lg text-white">{labels.get(id)}</button>) : <p className="font-semibold text-amber-800">依次点击下方词卡，排在这里</p>}
    </div>
    <div role="group" aria-label="待选词卡" className="my-6 flex min-h-20 flex-wrap items-center justify-center gap-3">{attempt.order.filter((id) => !attempt.selected.includes(id)).map((id) => <button key={id} type="button" disabled={locked} aria-label={`选择词卡 ${labels.get(id)}`} onClick={() => onInput({ type: "SELECT", tileId: id })} className="game-button min-h-14 border-2 border-amber-100 bg-white px-4 py-3 text-lg hover:border-amber-400 disabled:opacity-40">{labels.get(id)}</button>)}</div>
    <div className="flex flex-wrap justify-center gap-3">
      <button type="button" disabled={locked || !attempt.selected.length} onClick={() => onInput({ type: "CLEAR" })} className="game-button flex items-center gap-2 bg-slate-100 px-5 text-sm disabled:opacity-40"><RotateCcw className="size-4" />清空重排</button>
      <button type="button" disabled={locked || attempt.selected.length !== tiles.length} onClick={() => onInput({ type: "SUBMIT" })} className="game-button bg-amber-700 px-7 text-white disabled:opacity-40">{locked ? "已记录" : "检查答案"}</button>
      <button type="button" disabled={locked} onClick={() => onInput({ type: "SKIP" })} className="game-button border border-slate-200 bg-white px-5 text-sm text-slate-500 disabled:opacity-40">暂时不会</button>
    </div>
    {!locked && attempt.submissions > 0 && <p role="status" className="mt-5 rounded-2xl bg-amber-50 p-4 font-bold text-amber-900">词序还需要调整。点击上方词卡撤回，再试一试。</p>}
    {locked ? <div role="status" className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
      <p className="font-black text-emerald-800">{attempt.status === "correct" ? `排对啦！获得 ${attempt.score} 分 ⭐` : "这次记0分，一起读读正确句子。"}</p>
      <p lang="en" className="my-4 text-2xl font-black leading-relaxed">{question.tokens.join(" ")}</p>
      <p className="mb-4 font-semibold text-slate-500">{question.translationZh}</p><AudioPromptButton text={question.tokens.join(" ")} enabled={soundEnabled} />
      <p className="mt-4 text-sm font-bold text-emerald-800">再开口读一遍，不额外计分。</p>
    </div> : <p className="mt-5 text-xs font-semibold text-slate-400">全部排好再检查 · 首次正确2分，重试正确1分 · 标点不用单独排列</p>}
  </div>;
}
