"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Coins, Map, RotateCcw, Swords } from "lucide-react";
import { AppHeader } from "@/components/ui/AppHeader";
import { findSentenceTraining } from "@/content/sentence-battle/trainings";
import { useBattle } from "@/features/sentence-battle/battle-context";
import { battleCoins, battleHp, battleSolvedCount, createBattleRun } from "@/features/sentence-battle/engine";
import type { BattleRunAction } from "@/features/sentence-battle/types";
import { BattleQuestion } from "./BattleQuestion";
import { BattleStorageNotice } from "./BattleHub";

export function BattleScreen({ trainingId }: { trainingId: string | null }) {
  const { data, dispatch, hydrated } = useBattle();
  const reducedMotion = useReducedMotion();
  const training = findSentenceTraining(trainingId);
  const progress = training ? data.trainings[training.id] : undefined;
  const run = progress?.run;
  const solved = run ? battleSolvedCount(run) : 0;

  function start(restart = false) {
    if (!training) return;
    if (restart && !window.confirm("重新挑战将重置这个训练的本轮答题、怪物和金币；已通关标记会保留。确定重新挑战吗？")) return;
    dispatch({ type: "START", trainingId: training.id, run: createBattleRun(training), restart });
  }

  function act(action: BattleRunAction) {
    if (training && run) dispatch({ type: "PLAY", trainingId: training.id, runId: run.id, questionIndex: run.currentIndex, action });
  }

  return <div className="min-h-screen">
    <AppHeader actions={<Link href="/sentence-battle/" className="game-button flex min-h-11 items-center gap-2 bg-white px-4 text-sm shadow-sm"><Map className="size-4" />训练列表</Link>} />
    <main className="mx-auto max-w-6xl px-4 pb-12 pt-3 sm:px-6 lg:px-8">
      <BattleStorageNotice />
      {!hydrated ? <p className="py-24 text-center font-black text-slate-500">正在读取挑战进度…</p> : !training ? <section className="paper-panel mx-auto max-w-lg rounded-[32px] p-8 text-center"><p className="text-6xl" aria-hidden="true">🧭</p><h1 className="mt-5 text-2xl font-black">没有找到这个训练</h1><p className="mt-3 font-bold text-slate-500">回到训练列表，选择想练习的句型。</p><Link href="/sentence-battle/" className="game-button mt-6 inline-flex items-center gap-2 bg-emerald-700 px-6 py-4 text-white"><ArrowLeft className="size-4" />返回训练列表</Link></section> : <>
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Sentence Battle · {training.family}</p><h1 className="mt-2 text-2xl font-black sm:text-3xl">{training.title}</h1><p className="mt-2 text-sm font-bold text-slate-500">{training.kind === "question-sort" ? "排列问句" : "选择答句"} · 每关 20 组 · 进度自动保存</p></div>
          {run && <button type="button" onClick={() => start(true)} className="game-button flex min-h-11 items-center gap-2 bg-white px-4 text-sm text-slate-600 shadow-sm"><RotateCcw className="size-4" />重新挑战</button>}
        </header>
        {!run ? <section className="paper-panel mx-auto max-w-2xl rounded-[32px] p-7 text-center sm:p-10">
          <div className="flex items-center justify-center gap-6 text-6xl" aria-hidden="true"><span>{training.questions[0].emoji}</span><Swords className="size-9 text-emerald-600" /><span>🐲</span></div>
          <h2 className="mt-7 text-2xl font-black">准备挑战两只小怪物！</h2>
          <p className="mt-4 font-bold leading-8 text-slate-500">{training.kind === "question-sort" ? "点击词卡排列问句，再检查答案。" : "看清肯定或否定提示，选好答句，再检查答案。"}<br />答对一次扣 10 血，每完成 10 组击败一只怪物。<br />答错可以重试，不会扣除已获得的奖励。</p>
          <button type="button" onClick={() => start()} className="game-button mt-7 inline-flex items-center gap-3 bg-emerald-700 px-8 text-lg text-white shadow-[0_6px_0_#065F46]">开始挑战<ArrowRight className="size-5" /></button>
        </section> : <>
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl bg-white/80 p-4 shadow-sm"><span className="font-black text-emerald-800">本轮已完成 {solved} / 20</span><div className="h-2.5 min-w-20 flex-1 overflow-hidden rounded-full bg-emerald-50" role="progressbar" aria-label="训练进度" aria-valuemin={0} aria-valuemax={20} aria-valuenow={solved}><div className="h-full rounded-full bg-emerald-500 transition-[width]" style={{ width: `${solved * 5}%` }} /></div><span className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-sm font-black text-amber-800"><Coins className="size-4" />本轮金币 {battleCoins(run)}</span>{progress?.everCompleted && <span className="text-sm font-black text-emerald-700">🏅 已通关</span>}</div>
          <div className="grid items-start gap-5 lg:grid-cols-[0.65fr_1.35fr]">
            <aside className="paper-panel rounded-[28px] p-5 text-center sm:p-6 lg:sticky lg:top-5" aria-label="怪物战况">
              <p className="text-sm font-black text-slate-500">第 {run.wave + 1} / 2 只怪物</p>
              <motion.div key={`${run.id}-${solved}-${run.wave}`} initial={false} animate={reducedMotion ? {} : { scale: solved > 0 ? [1, 0.9, 1] : 1 }} transition={{ duration: 0.25 }} className="my-4 text-7xl sm:text-8xl" aria-hidden="true">{battleHp(run) === 0 ? "✨" : run.monsters[run.wave]}</motion.div>
              <p className="font-black text-slate-600">怪物血量：{battleHp(run)} / 100</p>
              <div role="progressbar" aria-label="怪物血量" aria-valuemin={0} aria-valuemax={100} aria-valuenow={battleHp(run)} className="mt-3 h-4 overflow-hidden rounded-full bg-rose-100"><div className="h-full rounded-full bg-rose-400 transition-[width]" style={{ width: `${battleHp(run)}%` }} /></div>
              {battleHp(run) === 0 ? <div role="status" className="mt-5 rounded-2xl bg-amber-50 p-4"><h2 className="text-xl font-black text-amber-900">{solved === 20 ? "🎉 两只怪物都击败啦！" : "🎉 第一只怪物被击败！"}</h2><p className="mt-2 font-bold text-amber-800">{run.rewards[run.wave] ? "这只怪物掉落 1 枚金币" : "这只怪物没有掉落金币"}</p><p className="mt-3 text-sm font-bold leading-6 text-slate-500">{solved === 20 ? "本关 20 组全部完成！可以回看题目，或回到列表挑战其他句型。" : "前 10 组练习已完成，继续向第二只怪物出发！"}</p></div> : <p className="mt-5 text-sm font-bold leading-6 text-slate-500">每答对一组，怪物扣 10 血。<br />回看题目时不会重复攻击。</p>}
              {solved === 20 && <Link href="/sentence-battle/" className="game-button mt-5 inline-flex w-full items-center justify-center gap-2 bg-emerald-700 px-4 text-white">选择下一个训练<ArrowRight className="size-4" /></Link>}
            </aside>
            <section className="paper-panel min-w-0 rounded-[28px] p-4 sm:p-7" aria-label="句型练习">
              <p className="mb-5 text-center text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Question {run.currentIndex + 1} / 20{run.attempts[run.currentIndex].solved ? " · 已完成，可回看" : ""}</p>
              <BattleQuestion training={training} question={training.questions[run.currentIndex]} attempt={run.attempts[run.currentIndex]} onAction={act} />
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                <button type="button" disabled={run.currentIndex === 0} onClick={() => act({ type: "PREVIOUS" })} className="game-button flex min-h-12 items-center gap-2 bg-slate-100 px-4 text-sm disabled:opacity-40"><ArrowLeft className="size-4" />上一题回看</button>
                {run.currentIndex === 19 && solved === 20 ? <Link href="/sentence-battle/" className="game-button flex min-h-12 items-center gap-2 bg-emerald-700 px-5 text-sm text-white">返回训练列表<ArrowRight className="size-4" /></Link> : <button type="button" disabled={!run.attempts[run.currentIndex].solved || run.currentIndex === 19} onClick={() => act({ type: "NEXT" })} className="game-button flex min-h-12 items-center gap-2 bg-emerald-700 px-5 text-sm text-white disabled:opacity-40">{run.currentIndex === 9 && run.wave === 0 ? "挑战第二只怪物" : "下一题"}<ArrowRight className="size-4" /></button>}
              </div>
            </section>
          </div>
        </>}
      </>}
    </main>
  </div>;
}
