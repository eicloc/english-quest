"use client";

import { useMemo, useState } from "react";
import { Check, GripVertical, RotateCcw } from "lucide-react";
import { getGrammarAnswerText } from "@/features/grammar/evaluator";
import type { GrammarAttempt, GrammarCategoryQuestion, GrammarMatchQuestion, GrammarQuestion, GrammarQuestionVisual, GrammarResponse, GrammarSortQuestion } from "@/features/grammar/types";

export function GrammarQuestionRenderer({ question, attempt, disabled, onSubmit }: { question: GrammarQuestion; attempt?: GrammarAttempt; disabled?: boolean; onSubmit: (response: GrammarResponse) => void }) {
  const locked = disabled || Boolean(attempt?.completedAt);
  return (
    <div className="mx-auto w-full max-w-4xl">
      {question.visual && <QuestionVisual visual={question.visual} />}
      {question.type === "choice-gap" && <ChoiceGame question={question} attempt={attempt} disabled={locked} onSubmit={onSubmit} />}
      {question.type === "sentence-sort" && <SentenceSortGame key={question.id} question={question} disabled={locked} onSubmit={onSubmit} />}
      {question.type === "pair-match" && <PairMatchGame key={question.id} question={question} disabled={locked} onSubmit={onSubmit} />}
      {question.type === "category-sort" && <CategorySortGame key={question.id} question={question} disabled={locked} onSubmit={onSubmit} />}
      <AnswerFeedback question={question} attempt={attempt} />
    </div>
  );
}

function QuestionVisual({ visual }: { visual: GrammarQuestionVisual }) {
  return (
    <div role="img" aria-label={visual.altZh} className="relative mx-auto mb-7 flex min-h-28 w-full max-w-lg items-center justify-center overflow-hidden rounded-[28px] border-2 border-white bg-gradient-to-br from-sky-100 via-violet-50 to-amber-50 px-5 py-4 shadow-sm sm:min-h-32">
      <span aria-hidden="true" className="absolute left-5 top-4 text-xl text-amber-300">✦</span>
      <span aria-hidden="true" className="absolute bottom-3 right-6 size-8 rounded-full bg-violet-200/60" />
      <span aria-hidden="true" className="absolute -left-4 bottom-1 size-16 rounded-full bg-sky-200/50" />
      <span aria-hidden="true" className="relative whitespace-pre-line text-center text-4xl leading-relaxed drop-shadow-sm sm:text-5xl">{visual.emoji}</span>
    </div>
  );
}

function ChoiceGame({ question, attempt, disabled, onSubmit }: { question: Extract<GrammarQuestion, { type: "choice-gap" }>; attempt?: GrammarAttempt; disabled?: boolean; onSubmit: (response: GrammarResponse) => void }) {
  const [before, after] = question.stem.split("___");
  const latest = attempt?.responses[attempt.responses.length - 1];
  const selected = latest?.type === "choice-gap" ? latest.answer : undefined;
  return <div><h2 className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-2 text-3xl font-black leading-relaxed sm:text-5xl"><span>{before}</span><span className="inline-flex min-w-32 justify-center rounded-2xl border-b-4 border-violet-400 bg-violet-50 px-4 py-1 text-violet-700">{attempt?.completedAt ? question.correctAnswer : selected ?? "?"}</span><span>{after}</span></h2><div className="mx-auto mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">{question.options.map((option) => { const correct = Boolean(attempt?.completedAt) && option === question.correctAnswer; const chosen = selected === option; return <button type="button" key={option} disabled={disabled} aria-pressed={chosen} onClick={() => onSubmit({ type: "choice-gap", answer: option })} className={`game-button min-h-16 border-2 px-5 text-xl ${correct ? "border-emerald-400 bg-emerald-50 text-emerald-800" : chosen ? "border-violet-400 bg-violet-50 text-violet-800" : "border-slate-100 bg-white hover:border-violet-200"}`}>{correct && <Check className="mr-2 inline size-5" />}{option}</button>; })}</div></div>;
}

function SentenceSortGame({ question, disabled, onSubmit }: { question: GrammarSortQuestion; disabled?: boolean; onSubmit: (response: GrammarResponse) => void }) {
  const [tokens, setTokens] = useState<string[]>([]);
  const available = useMemo(() => question.tokens.filter((token) => !tokens.includes(token)), [question.tokens, tokens]);
  function add(token: string) { if (!disabled && !tokens.includes(token)) setTokens((items) => [...items, token]); }
  return <div><div className="min-h-28 rounded-[24px] border-2 border-dashed border-violet-200 bg-violet-50/70 p-4" aria-label="句子排列区" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); add(event.dataTransfer.getData("text/plain")); }}><div className="flex min-h-20 flex-wrap items-center justify-center gap-3">{tokens.length ? tokens.map((token, index) => <button type="button" key={`${token}-${index}`} disabled={disabled} onClick={() => setTokens((items) => items.filter((_, itemIndex) => itemIndex !== index))} className="game-button min-h-12 bg-violet-600 px-4 text-lg text-white shadow-sm" aria-label={`移回词卡 ${token}`}>{token}</button>) : <span className="self-center font-bold text-violet-400">把词卡拖到这里，或依次点击词卡</span>}</div></div><div className="mt-5 flex flex-wrap justify-center gap-3">{available.map((token) => <button type="button" key={token} draggable={!disabled} disabled={disabled} onDragStart={(event) => event.dataTransfer.setData("text/plain", token)} onClick={() => add(token)} className="game-button flex min-h-12 items-center gap-1 border-2 border-slate-100 bg-white px-4 text-lg hover:border-violet-300"><GripVertical className="size-4 text-slate-300" />{token}</button>)}</div><div className="mt-6 flex justify-center gap-3"><button type="button" disabled={disabled || tokens.length === 0} onClick={() => setTokens([])} className="game-button flex min-h-12 items-center gap-2 bg-slate-100 px-5 text-sm disabled:opacity-40"><RotateCcw className="size-4" />重排</button><SubmitButton disabled={disabled || tokens.length !== question.tokens.length} onClick={() => onSubmit({ type: "sentence-sort", tokens })} /></div></div>;
}

function shuffledCopy<T>(items: T[]) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function shuffleMatchRightItems(question: GrammarMatchQuestion) {
  if (question.rightItems.length < 2) return [...question.rightItems];

  const hasAlignedAnswer = (items: GrammarMatchQuestion["rightItems"]) => question.leftItems.some((left, index) => question.correctPairs[left.id] === items[index]?.id);
  for (let attempt = 0; attempt < 16; attempt += 1) {
    const shuffled = shuffledCopy(question.rightItems);
    if (!hasAlignedAnswer(shuffled)) return shuffled;
  }

  const rightById = new Map(question.rightItems.map((item) => [item.id, item]));
  const answerOrder = question.leftItems.map((left) => rightById.get(question.correctPairs[left.id])).filter((item): item is GrammarMatchQuestion["rightItems"][number] => Boolean(item));
  if (answerOrder.length !== question.rightItems.length || new Set(answerOrder.map((item) => item.id)).size !== answerOrder.length) return shuffledCopy(question.rightItems);
  const offset = 1 + Math.floor(Math.random() * (answerOrder.length - 1));
  return answerOrder.map((_, index) => answerOrder[(index + offset) % answerOrder.length]);
}

function PairMatchGame({ question, disabled, onSubmit }: { question: GrammarMatchQuestion; disabled?: boolean; onSubmit: (response: GrammarResponse) => void }) {
  const [selectedLeft, setSelectedLeft] = useState<string>();
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const [rightItems] = useState(() => shuffleMatchRightItems(question));
  function connect(rightId: string) {
    if (!selectedLeft || disabled) return;
    setPairs((current) => {
      const withoutRight = Object.fromEntries(Object.entries(current).filter(([, value]) => value !== rightId));
      return { ...withoutRight, [selectedLeft]: rightId };
    });
    setSelectedLeft(undefined);
  }
  return <div><p className="mb-4 text-center font-bold text-slate-500">先点左边，再点右边完成配对</p><div className="grid grid-cols-2 gap-3"><div role="group" aria-label="左侧词卡" className="space-y-3">{question.leftItems.map((item) => <button type="button" key={item.id} disabled={disabled} aria-pressed={selectedLeft === item.id} onClick={() => setSelectedLeft(item.id)} className={`game-button w-full border-2 px-3 text-sm sm:text-base ${selectedLeft === item.id ? "border-violet-500 bg-violet-100" : pairs[item.id] ? "border-emerald-200 bg-emerald-50" : "border-slate-100 bg-white"}`}><span className="block">{item.label}</span>{pairs[item.id] && <span className="mt-1 block text-xs font-bold text-emerald-700">已连接</span>}</button>)}</div><div role="group" aria-label="右侧词卡" className="space-y-3">{rightItems.map((item) => { const linked = Object.values(pairs).includes(item.id); return <button type="button" key={item.id} disabled={disabled || !selectedLeft} onClick={() => connect(item.id)} className={`game-button w-full border-2 px-3 text-sm sm:text-base ${linked ? "border-emerald-200 bg-emerald-50" : selectedLeft ? "border-violet-200 bg-white hover:border-violet-400" : "border-slate-100 bg-white"}`}>{item.label}</button>; })}</div></div><div className="mt-6 flex justify-center gap-3"><button type="button" disabled={disabled || Object.keys(pairs).length === 0} onClick={() => { setPairs({}); setSelectedLeft(undefined); }} className="game-button flex min-h-12 items-center gap-2 bg-slate-100 px-5 text-sm disabled:opacity-40"><RotateCcw className="size-4" />重配</button><SubmitButton disabled={disabled || Object.keys(pairs).length !== question.leftItems.length} onClick={() => onSubmit({ type: "pair-match", pairs })} /></div></div>;
}

function CategorySortGame({ question, disabled, onSubmit }: { question: GrammarCategoryQuestion; disabled?: boolean; onSubmit: (response: GrammarResponse) => void }) {
  const [selectedItem, setSelectedItem] = useState<string>();
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  function assign(itemId: string, categoryId: string) {
    if (!disabled) setAssignments((current) => ({ ...current, [itemId]: categoryId }));
    setSelectedItem(undefined);
  }
  const unassigned = question.items.filter((item) => !assignments[item.id]);
  return <div><p className="mb-4 text-center font-bold text-slate-500">拖动词卡到分组，或先点词卡再点分组</p><div className="flex min-h-20 flex-wrap justify-center gap-3 rounded-2xl bg-slate-50 p-3">{unassigned.length ? unassigned.map((item) => <ItemCard key={item.id} item={item} selected={selectedItem === item.id} disabled={disabled} onSelect={() => setSelectedItem(item.id)} />) : <span className="self-center font-bold text-slate-400">所有词卡都已分组</span>}</div><div className={`mt-5 grid gap-3 ${question.categories.length >= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>{question.categories.map((category) => <div key={category.id} role="button" tabIndex={disabled ? -1 : 0} onClick={() => selectedItem && assign(selectedItem, category.id)} onKeyDown={(event) => { if ((event.key === "Enter" || event.key === " ") && selectedItem) { event.preventDefault(); assign(selectedItem, category.id); } }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); assign(event.dataTransfer.getData("text/plain"), category.id); }} className="min-h-36 rounded-[22px] border-2 border-dashed border-violet-200 bg-violet-50 p-3 text-left"><strong className="block text-center text-violet-800">{category.label}</strong><span className="mt-3 flex flex-wrap justify-center gap-2">{question.items.filter((item) => assignments[item.id] === category.id).map((item) => <ItemCard key={item.id} item={item} selected={selectedItem === item.id} disabled={disabled} onSelect={() => setSelectedItem(item.id)} />)}</span></div>)}</div><div className="mt-6 flex justify-center gap-3"><button type="button" disabled={disabled || Object.keys(assignments).length === 0} onClick={() => { setAssignments({}); setSelectedItem(undefined); }} className="game-button flex min-h-12 items-center gap-2 bg-slate-100 px-5 text-sm disabled:opacity-40"><RotateCcw className="size-4" />重分</button><SubmitButton disabled={disabled || Object.keys(assignments).length !== question.items.length} onClick={() => onSubmit({ type: "category-sort", categories: assignments })} /></div></div>;
}

function ItemCard({ item, selected, disabled, onSelect }: { item: { id: string; label: string }; selected: boolean; disabled?: boolean; onSelect: () => void }) {
  return <span draggable={!disabled} onDragStart={(event) => event.dataTransfer.setData("text/plain", item.id)}><button type="button" disabled={disabled} aria-pressed={selected} onClick={(event) => { event.stopPropagation(); onSelect(); }} className={`rounded-xl border-2 px-3 py-2 text-sm font-black shadow-sm ${selected ? "border-violet-500 bg-violet-100" : "border-white bg-white"}`}>{item.label}</button></span>;
}

function SubmitButton({ disabled, onClick }: { disabled?: boolean; onClick: () => void }) {
  return <button type="button" disabled={disabled} onClick={onClick} className="game-button min-h-12 bg-violet-600 px-7 text-white shadow-sm disabled:opacity-40">检查答案</button>;
}

function AnswerFeedback({ question, attempt }: { question: GrammarQuestion; attempt?: GrammarAttempt }) {
  if (!attempt) return null;
  if (!attempt.completedAt && attempt.attempts === 1) return <div role="status" aria-live="polite" className="mt-6 rounded-2xl border-2 border-amber-200 bg-amber-50 p-4 text-left"><strong className="text-amber-800">🌱 再想一想</strong><p className="mt-1 font-semibold text-amber-800">{question.hintZh}</p></div>;
  if (attempt.completedAt && attempt.isCorrect) return <div role="status" aria-live="polite" className="mt-6 rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4 text-left"><strong className="text-emerald-800">⭐ 答对啦！{attempt.attempts === 1 ? "获得 2 颗星" : "获得 1 颗星"}</strong><p className="mt-1 font-semibold text-emerald-700">{question.explanationZh}</p></div>;
  if (attempt.completedAt) return <div role="status" aria-live="polite" className="mt-6 rounded-2xl border-2 border-blue-200 bg-blue-50 p-4 text-left"><strong className="text-blue-800">💡 一起记住正确规则</strong><p className="mt-2 font-black text-slate-800">正确答案：{getGrammarAnswerText(question)}</p><p className="mt-1 font-semibold text-blue-800">{question.explanationZh}</p></div>;
  return null;
}
