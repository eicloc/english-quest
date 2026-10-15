"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Play, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/ui/AppHeader";
import { practiceCollections, practiceQuests } from "@/content/unit-practice";
import { buildPracticeReport, createPracticeSession, practiceCompletedCount } from "@/features/unit-practice/engine";
import { usePractice } from "@/features/unit-practice/practice-context";
import type { PracticeQuestId } from "@/features/unit-practice/types";

export function PracticeHub() {
  const { collection, data, dispatch, hydrated, storageAvailable } = usePractice();
  const config = practiceCollections[collection], router = useRouter();
  const [name, setName] = useState(""), [sound, setSound] = useState(true);
  function start(id: PracticeQuestId) {
    const session = createPracticeSession(id, name, sound);
    dispatch({ type: "START", session }); router.push(`${config.route}/play/?session=${encodeURIComponent(session.id)}`);
  }
  if (!hydrated) return <main className="grid min-h-screen place-items-center font-black">正在准备挑战…</main>;
  return <div className="min-h-screen"><AppHeader actions={<Link href={config.backRoute} className="game-button inline-flex items-center gap-2 bg-white px-4 text-sm shadow-sm"><ArrowLeft className="size-4" />{config.backLabel}</Link>} />
    <main className="mx-auto max-w-6xl px-4 pb-12 pt-4 sm:px-6">
      <header className="text-center"><span className="rounded-full bg-amber-100 px-4 py-2 text-sm font-black text-amber-800">Unit 1 · 一起开口说英语</span><h1 className="mt-5 text-4xl font-black sm:text-5xl">{config.title}</h1><p className="mx-auto mt-4 max-w-2xl font-bold leading-7 text-slate-500">{config.description}</p></header>
      <section className="paper-panel mx-auto mt-7 max-w-2xl rounded-[28px] p-5"><label htmlFor="practice-name" className="font-black">小朋友叫什么名字？</label><input id="practice-name" maxLength={12} value={name} onChange={(e) => setName(e.target.value)} placeholder="可以用中文名字，不填也可以" className="mt-2 h-14 w-full rounded-2xl border-2 border-slate-100 bg-white px-4 font-bold focus:border-amber-300" /><button type="button" aria-pressed={sound} onClick={() => setSound(!sound)} className="game-button mt-4 inline-flex items-center gap-2 bg-slate-100 px-4 text-sm">{sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}{sound ? "声音开启" : "声音关闭"}</button><p className="mt-3 text-xs font-semibold leading-6 text-slate-500">口头题由老师评分；拼词和排序完成后再检查。每道题最多2分，暂时不会也能继续。</p>{!storageAvailable && <p role="status" className="mt-3 rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-800">当前浏览器无法保存记录，刷新后进度可能丢失。</p>}</section>
      <section className={`mx-auto mt-7 grid gap-5 ${config.quests.length > 1 ? "lg:grid-cols-2" : "max-w-3xl"}`} aria-label="选择独立关卡">{config.quests.map((id) => {
        const quest = practiceQuests[id], active = data.sessions.find((s) => s.questId === id && !s.completedAt);
        const counts = ["oral", "spelling", "sentence"].map((kind) => quest.questions.filter((q) => q.kind === kind).length);
        return <article key={id} className="paper-panel flex flex-col rounded-[32px] p-5 sm:p-7" aria-labelledby={`quest-${id}`}><span className="text-5xl" aria-hidden="true">{quest.emoji}</span><p className="mt-5 text-sm font-black text-amber-700">{quest.translationZh}</p><h2 id={`quest-${id}`} className="mt-2 text-3xl font-black">{quest.title}</h2><p className="mt-3 font-semibold leading-7 text-slate-500">{quest.description}</p><p className="mt-4 rounded-xl bg-amber-50 p-3 font-black text-amber-800">{quest.questions.length}题 · {quest.questions.length * 2}分</p><p className="mt-3 text-sm font-semibold text-slate-500">口头交流{counts[0]}题 · 拼词{counts[1]}题 · 排序{counts[2]}题</p><ol className="mt-5 space-y-2">{quest.stages.map((stage) => <li key={stage.id} className="rounded-xl bg-white p-3 text-sm font-bold">{stage.emoji} {stage.title}</li>)}</ol>
          {active && <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4"><strong>{active.studentName} · 已完成 {practiceCompletedCount(active)}/{quest.questions.length} 题</strong><Link href={`${config.route}/play/?session=${encodeURIComponent(active.id)}`} className="game-button mt-3 flex items-center justify-center gap-2 bg-white px-5 text-amber-800 shadow-sm"><Play className="size-4" />继续挑战</Link></div>}
          <button type="button" onClick={() => start(id)} className="game-button mt-5 flex items-center justify-center gap-2 bg-amber-700 px-5 text-white hover:bg-amber-800">{active ? "重新挑战，建立新记录" : "开始挑战"}<ArrowRight className="size-4" /></button>
        </article>;
      })}</section>
      {data.sessions.length > 0 && <section className="mt-9" aria-labelledby="practice-history"><h2 id="practice-history" className="text-xl font-black">挑战记录</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{data.sessions.map((s) => <Link key={s.id} href={`${config.route}/${s.completedAt ? "report" : "play"}/?session=${encodeURIComponent(s.id)}`} className="rounded-2xl border border-amber-100 bg-white p-4"><strong>{s.studentName} · {practiceQuests[s.questId].title}</strong><p className="mt-2 text-sm font-semibold text-slate-500">{new Date(s.createdAt).toLocaleString("zh-CN")} · {s.completedAt ? `已完成 ${buildPracticeReport(s).earned}/${buildPracticeReport(s).possible}分` : `继续挑战 ${practiceCompletedCount(s)}/${practiceQuests[s.questId].questions.length}题`}</p></Link>)}</div></section>}
    </main></div>;
}
