"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Flag, Swords } from "lucide-react";
import { AppHeader } from "@/components/ui/AppHeader";
import { sentenceFamilies, sentenceTrainings } from "@/content/sentence-battle/trainings";
import { useBattle } from "@/features/sentence-battle/battle-context";
import { battleSolvedCount } from "@/features/sentence-battle/engine";

export function BattleStorageNotice() {
  const { storageAvailable } = useBattle();
  return storageAvailable ? null : <p role="status" className="mb-5 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-800">当前浏览器无法保存进度，仍可继续游戏；关闭页面后本次进度可能丢失。</p>;
}

export function BattleHub() {
  const { data, hydrated } = useBattle();
  const completed = sentenceTrainings.filter((training) => data.trainings[training.id]?.everCompleted).length;
  return <div className="min-h-screen">
    <AppHeader actions={<Link href="/" className="game-button flex min-h-11 items-center gap-2 bg-white px-4 text-sm shadow-sm"><ArrowLeft className="size-4" />选择板块</Link>} />
    <main className="mx-auto max-w-6xl px-4 pb-14 pt-5 sm:px-6 lg:px-8">
      <BattleStorageNotice />
      <header className="paper-panel relative overflow-hidden rounded-[32px] p-6 sm:p-9">
        <span className="pointer-events-none absolute -right-5 -top-4 text-[12rem] opacity-10" aria-hidden="true">🐲</span>
        <p className="relative flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-emerald-700"><Swords className="size-5" />Sentence Battle</p>
        <h1 className="relative mt-4 text-4xl font-black tracking-tight sm:text-5xl">句型打怪岛</h1>
        <p className="relative mt-4 max-w-2xl font-bold leading-7 text-slate-500">把问句排好，为问句选对答句。每关 20 组练习，答对就能攻击，击败两只小怪物！</p>
        <div className="relative mt-6 flex flex-wrap gap-3 text-sm font-black">
          <span className="rounded-full bg-emerald-100 px-4 py-2 text-emerald-800">18 个训练 · 全部开放</span>
          <span className="flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-amber-800"><Flag className="size-4" />{hydrated ? `已通关 ${completed} / 18` : "正在读取进度…"}</span>
        </div>
      </header>
      <nav aria-label="句型分类" className="my-7 flex flex-wrap gap-2">{sentenceFamilies.map((family) => <a key={family} href={`#family-${family.toLowerCase()}`} className="game-button min-h-11 rounded-full border border-emerald-100 bg-white px-5 py-3 text-sm text-emerald-800 shadow-sm">{family}</a>)}</nav>
      <div className="space-y-9">{sentenceFamilies.map((family) => <section key={family} id={`family-${family.toLowerCase()}`} aria-labelledby={`title-${family}`} className="scroll-mt-5">
        <h2 id={`title-${family}`} className="mb-4 flex items-center gap-3 text-2xl font-black"><span className="h-7 w-1.5 rounded-full bg-emerald-400" />{family} 句型<span className="text-sm font-bold text-slate-400">{sentenceTrainings.filter((training) => training.family === family).length} 个训练</span></h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{sentenceTrainings.filter((training) => training.family === family).map((training) => {
          const progress = data.trainings[training.id];
          const solved = progress ? battleSolvedCount(progress.run) : 0;
          return <Link key={training.id} href={`/sentence-battle/play/?training=${training.id}`} className="paper-panel group flex flex-col rounded-[26px] border-2 border-transparent p-5 transition hover:-translate-y-1 hover:border-emerald-300 focus-visible:outline-4">
            <div className="flex items-center justify-between gap-2"><span className="grid size-12 place-items-center rounded-2xl bg-emerald-50 text-2xl" aria-hidden="true">{training.questions[0].emoji}</span><span className={`rounded-full px-3 py-1.5 text-xs font-black ${training.kind === "question-sort" ? "bg-sky-50 text-sky-700" : "bg-violet-50 text-violet-700"}`}>{training.kind === "question-sort" ? "排列问句" : "选择答句"}</span></div>
            <h3 className="mt-4 text-lg font-black leading-7">{training.title}</h3>
            <p className="mt-2 text-sm font-semibold text-slate-500">20 组练习 · 2 只怪物</p>
            <div className="mt-4 flex min-h-6 items-center gap-2 text-sm font-bold text-emerald-700">{hydrated && progress?.everCompleted && <span className="flex items-center gap-1"><Check className="size-4" />已通关</span>}{hydrated && progress && <span className="text-slate-500">本轮 {solved} / 20</span>}</div>
            <span className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-black text-emerald-700">{hydrated && progress ? solved === 20 ? "查看战果" : "继续挑战" : "进入训练"}<ArrowRight className="size-4 transition group-hover:translate-x-1" /></span>
          </Link>;
        })}</div>
      </section>)}</div>
    </main>
  </div>;
}
