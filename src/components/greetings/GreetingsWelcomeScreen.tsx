"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, History, Play, Sparkles, Volume2, VolumeX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppHeader } from "@/components/ui/AppHeader";
import { greetingStages } from "@/content/greetings/questions";
import { buildGreetingReport, createGreetingSession, greetingCompletedCount } from "@/features/greetings/engine";
import { useGreetings } from "@/features/greetings/greetings-context";

export function GreetingsWelcomeScreen() {
  const router = useRouter();
  const { data, dispatch, hydrated, storageAvailable } = useGreetings();
  const [studentName, setStudentName] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const active = data.sessions.find((session) => !session.completedAt);

  function start() {
    const session = createGreetingSession(studentName, soundEnabled);
    dispatch({ type: "START", session });
    router.push(`/greetings/play/?session=${encodeURIComponent(session.id)}`);
  }

  if (!hydrated) return <main className="grid min-h-screen place-items-center font-black text-slate-500">正在准备见面礼…</main>;

  return <div className="min-h-screen">
    <AppHeader actions={<Link href="/" className="game-button flex items-center gap-2 bg-white px-4 text-sm shadow-sm"><ArrowLeft className="size-4" />选择板块</Link>} />
    <main className="mx-auto max-w-6xl px-4 pb-12 pt-4 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
        <section>
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-black text-amber-800"><Sparkles className="size-4" />Unit 1 · Hello! / How are you?</span>
          <h1 className="mt-5 text-4xl font-black leading-tight sm:text-6xl">问候交朋友<br /><span className="text-amber-600">让我们开口吧！</span></h1>
          <p className="mt-5 max-w-lg text-lg font-bold leading-8 text-slate-500">回应朋友、主动问好，再把字母拼成单词。老师陪你一起完成26道小挑战。</p>
          <div className="mt-7 space-y-3">{greetingStages.map((stage, index) => <div key={stage.id} className="flex items-center gap-3 rounded-2xl bg-white/75 px-4 py-3"><span className="text-2xl" aria-hidden="true">{stage.emoji}</span><span className="text-xs font-black text-amber-600">0{index + 1}</span><div><p className="font-black">{stage.title}</p><p className="text-sm font-semibold text-slate-500">{stage.subtitle}</p></div></div>)}</div>
        </section>
        <section className="paper-panel rounded-[32px] p-5 sm:p-8" aria-labelledby="greeting-start-title">
          <div className="mb-5 text-5xl" aria-hidden="true">👋 💬 🧩</div>
          <h2 id="greeting-start-title" className="text-2xl font-black">领取交朋友通行证</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">12道口头交流，由老师评分；14道中文拼词，点击字母作答。两部分连续进行，可以随时返回继续。</p>
          {!storageAvailable && <p role="status" className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm font-bold text-amber-800">当前浏览器无法保存记录，刷新后进度可能丢失。</p>}
          {active && <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <strong>{active.studentName} 的挑战还在继续</strong>
            <p className="mt-1 text-sm font-semibold text-slate-500">已完成 {greetingCompletedCount(active)}/26 题</p>
            <Link href={`/greetings/play/?session=${encodeURIComponent(active.id)}`} className="game-button mt-3 inline-flex items-center gap-2 bg-white px-5 text-sm text-amber-800 shadow-sm"><Play className="size-4" />继续挑战</Link>
          </div>}
          <label htmlFor="greeting-student-name" className="mt-6 block text-sm font-black">小朋友叫什么名字？</label>
          <input id="greeting-student-name" maxLength={12} value={studentName} onChange={(event) => setStudentName(event.target.value)} placeholder="可以用中文名字，不填也可以" className="mt-2 h-14 w-full rounded-2xl border-2 border-slate-100 bg-white px-4 font-bold focus:border-amber-300" />
          <button type="button" aria-pressed={soundEnabled} onClick={() => setSoundEnabled((enabled) => !enabled)} className="game-button mt-4 inline-flex items-center gap-2 bg-slate-100 px-4 text-sm">{soundEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}{soundEnabled ? "声音开启" : "声音关闭"}</button>
          <button type="button" onClick={start} className="game-button mt-6 flex w-full items-center justify-center gap-3 bg-amber-600 px-5 text-lg text-white shadow-[0_7px_0_#92400E] hover:bg-amber-700">{active ? "重新挑战，建立新记录" : "开始交朋友"}<ArrowRight className="size-5" /></button>
          <p className="mt-4 text-xs font-semibold leading-6 text-slate-400">姓名会用于老师参考答句；孩子可以直接说自己的中文名字。</p>
        </section>
      </div>
      <section className="paper-panel mt-8 flex flex-col gap-4 rounded-[28px] border-2 border-amber-200 p-5 sm:flex-row sm:items-center sm:justify-between" aria-labelledby="greeting-review-entry">
        <div><h2 id="greeting-review-entry" className="text-2xl font-black">🧭 复习挑战 · 稍微难一点</h2><p className="mt-2 max-w-2xl font-semibold leading-7 text-slate-500">40题：换角色、主动反问、完整短对话、14个单词拼写和10道句子排序。原26题基础挑战和历史记录继续保留。</p></div>
        <Link href="/greetings/review/" className="game-button inline-flex shrink-0 items-center justify-center gap-2 bg-amber-700 px-6 text-white">进入复习挑战<ArrowRight className="size-4" /></Link>
      </section>
      {data.sessions.length > 0 && <section className="mt-10" aria-labelledby="greeting-history-title">
        <h2 id="greeting-history-title" className="flex items-center gap-2 text-xl font-black"><History className="size-5 text-amber-600" />挑战记录</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{data.sessions.map((session) => <Link key={session.id} href={`/greetings/${session.completedAt ? "report" : "play"}/?session=${encodeURIComponent(session.id)}`} className="flex items-center justify-between gap-3 rounded-2xl border border-amber-100 bg-white p-4 hover:bg-amber-50">
          <div><strong className="block">{session.studentName}</strong><span className="text-xs font-semibold text-slate-400">{new Date(session.createdAt).toLocaleString("zh-CN")}</span><p className="mt-1 text-sm font-bold text-amber-800">{session.completedAt ? `已完成 · ${buildGreetingReport(session).earned}/52 分` : `继续挑战 · ${greetingCompletedCount(session)}/26 题`}</p></div><ArrowRight className="size-4 shrink-0 text-amber-600" />
        </Link>)}</div>
      </section>}
    </main>
  </div>;
}
