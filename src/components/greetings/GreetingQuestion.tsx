"use client";

import { RotateCcw } from "lucide-react";
import { ManualScoreButtons } from "@/components/assessment/ManualScoreButtons";
import { AudioPromptButton } from "@/components/assessment/AudioPromptButton";
import { personalizeGreeting } from "@/content/greetings/questions";
import { getLetterTiles } from "@/features/greetings/engine";
import type { GreetingAttempt, GreetingOralAttempt, GreetingOralQuestion, GreetingQuestion as Question, GreetingQuestionAction, GreetingSpellingAttempt, GreetingSpellingQuestion } from "@/features/greetings/types";

export function GreetingQuestion({ question, attempt, studentName, soundEnabled, onAction }: {
  question: Question; attempt: GreetingAttempt; studentName: string; soundEnabled: boolean;
  onAction: (action: GreetingQuestionAction) => void;
}) {
  if (question.kind === "oral" && attempt.kind === "oral") return <OralQuestion question={question} attempt={attempt} studentName={studentName} soundEnabled={soundEnabled} onAction={onAction} />;
  if (question.kind === "spelling" && attempt.kind === "spelling") return <SpellingQuestion question={question} attempt={attempt} soundEnabled={soundEnabled} onAction={onAction} />;
  return null;
}

function OralQuestion({ question, attempt, studentName, soundEnabled, onAction }: {
  question: GreetingOralQuestion; attempt: GreetingOralAttempt; studentName: string; soundEnabled: boolean;
  onAction: (action: GreetingQuestionAction) => void;
}) {
  return <div>
    <p className="text-base font-bold leading-7 text-slate-500 sm:text-lg">{question.instructionZh}</p>
    <div className="my-6 rounded-[28px] border-2 border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50/60 px-5 py-7 sm:px-8 sm:py-9">
      {question.speaker && <p className="mb-4 text-sm font-black text-amber-800">{question.speaker}</p>}
      {question.promptEn ? <>
        <h1 lang="en" className="text-3xl font-black leading-snug tracking-tight sm:text-5xl">{question.promptEn}</h1>
        <p className="mt-4 text-lg font-bold text-slate-500 sm:text-xl">{question.translationZh}</p>
        <div className="mt-5"><AudioPromptButton text={question.promptEn} enabled={soundEnabled} /></div>
      </> : <h1 className="text-2xl font-black leading-relaxed sm:text-3xl">{question.sceneZh}</h1>}
    </div>
    <p className="mb-6 font-bold text-amber-800">🎤 轮到你开口说，老师来听一听。</p>
    <details className="mb-6 rounded-2xl border border-slate-200 bg-white text-left">
      <summary className="cursor-pointer rounded-2xl px-5 py-4 font-black text-slate-600">老师参考 · 答句与评分说明</summary>
      <div className="space-y-4 px-5 pb-5">
        <p className="text-sm font-semibold leading-6 text-slate-500">以下为参考表达，允许使用中文名字，也接受含义正确的自然表达。</p>
        {question.examples.map((example) => <div key={example.en} className="rounded-xl bg-amber-50 p-3">
          <p lang="en" className="text-lg font-black">{personalizeGreeting(example.en, studentName)}</p>
          <p className="mt-1 font-semibold text-slate-500">{personalizeGreeting(example.zh, studentName)}</p>
        </div>)}
        <p className="text-sm font-semibold leading-6">{question.teacherGuide}</p>
        <p className="text-sm font-semibold leading-6 text-emerald-800"><strong>2分：</strong>{question.independentCriteria}</p>
        <p className="text-sm font-semibold leading-6 text-slate-500">1分：给句首、动作或示范等提示后完成。0分：暂时还不能完成，鼓励后继续即可。</p>
      </div>
    </details>
    <ManualScoreButtons value={attempt.score} onChange={(score) => onAction({ type: "SCORE_ORAL", score })} />
    {attempt.score !== undefined && <p role="status" className="mt-4 text-sm font-bold text-amber-800">已记录 {attempt.score} 分。可以调整评分，再进入下一题。</p>}
  </div>;
}

function SpellingQuestion({ question, attempt, soundEnabled, onAction }: {
  question: GreetingSpellingQuestion; attempt: GreetingSpellingAttempt; soundEnabled: boolean;
  onAction: (action: GreetingQuestionAction) => void;
}) {
  const tiles = getLetterTiles(question);
  const letters = new Map(tiles.map((tile) => [tile.id, tile.letter]));
  const locked = attempt.status !== "pending";
  const full = attempt.selected.length === tiles.length;
  return <div>
    <p className="font-bold text-slate-500">看中文，点击字母，拼出这个单词。</p>
    <h1 className="my-7 text-3xl font-black text-amber-800 sm:text-5xl">{question.meaningZh}</h1>
    <div role="group" aria-label="已选字母" className="flex min-h-28 flex-wrap items-center justify-center gap-2 rounded-[24px] border-2 border-dashed border-amber-200 bg-amber-50/60 p-4">
      {tiles.map((_, index) => {
        const id = attempt.selected[index];
        return id ? <button key={index} type="button" disabled={locked} aria-label={`撤回第${index + 1}个字母 ${letters.get(id)}`} onClick={() => onAction({ type: "REMOVE_LETTER", tileId: id })} className="game-button grid size-14 shrink-0 place-items-center bg-amber-600 text-2xl text-white shadow-sm disabled:opacity-90 sm:size-16 sm:text-3xl">{letters.get(id)}</button>
          : <span key={index} aria-label={`第${index + 1}个空位`} className="grid size-14 shrink-0 place-items-center rounded-[18px] border-2 border-amber-100 bg-white text-2xl font-black text-amber-200 sm:size-16">_</span>;
      })}
    </div>
    <div role="group" aria-label="待选字母" className="my-5 flex min-h-20 flex-wrap items-center justify-center gap-3">
      {attempt.order.filter((id) => !attempt.selected.includes(id)).map((id) => <button key={id} type="button" disabled={locked} aria-label={`选择字母 ${letters.get(id)}`} onClick={() => onAction({ type: "SELECT_LETTER", tileId: id })} className="game-button grid size-14 shrink-0 place-items-center border-2 border-amber-100 bg-white text-2xl shadow-sm hover:border-amber-400 disabled:opacity-40 sm:size-16 sm:text-3xl">{letters.get(id)}</button>)}
    </div>
    <div className="flex flex-wrap justify-center gap-3">
      <button type="button" disabled={locked || !attempt.selected.length} onClick={() => onAction({ type: "CLEAR_LETTERS" })} className="game-button flex items-center gap-2 bg-slate-100 px-5 text-sm disabled:opacity-40"><RotateCcw className="size-4" />清空重排</button>
      <button type="button" disabled={locked || !full} onClick={() => onAction({ type: "SUBMIT_SPELLING" })} className="game-button bg-amber-600 px-7 text-white shadow-sm hover:bg-amber-700 disabled:opacity-40">{locked ? "已记录" : "检查答案"}</button>
      <button type="button" disabled={locked} onClick={() => onAction({ type: "SKIP_SPELLING" })} className="game-button border border-slate-200 bg-white px-5 text-sm text-slate-500 disabled:opacity-40">暂时不会</button>
    </div>
    {!locked && attempt.submissions > 0 && <p role="status" className="mt-5 rounded-2xl bg-amber-50 p-4 font-bold text-amber-900">字母顺序还需要调整。点击上方字母撤回，再试一试！</p>}
    {locked && <div role="status" className={`mt-6 rounded-2xl border p-5 ${attempt.status === "correct" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-blue-200 bg-blue-50 text-blue-800"}`}>
      <p className="font-black">{attempt.status === "correct" ? `拼对啦！获得 ${attempt.score} 分 ⭐` : "这次先记0分，一起记住这个单词。"}</p>
      <p lang="en" className="mt-3 text-3xl font-black tracking-wider">{question.word}</p>
      <p className="mb-4 mt-1 font-semibold">{question.meaningZh}</p>
      <AudioPromptButton text={question.word} enabled={soundEnabled} purpose="word" />
    </div>}
    {!locked && <p className="mt-5 text-xs font-semibold text-slate-400">全部拼好再检查 · 首次正确2分，重试正确1分</p>}
  </div>;
}
