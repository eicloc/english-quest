"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, RotateCcw, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/ui/AppHeader";
import { personalizeGreeting } from "@/content/greetings/questions";
import { buildGreetingReport, createGreetingSession } from "@/features/greetings/engine";
import { useGreetings } from "@/features/greetings/greetings-context";
import { MissingGreetingSession } from "./GreetingsPlayScreen";

export function GreetingsReportScreen({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const { data, dispatch, hydrated } = useGreetings();
  const session = data.sessions.find((item) => item.id === sessionId);
  if (!hydrated) return <main className="grid min-h-screen place-items-center font-black">正在整理交朋友记录…</main>;
  if (!session) return <MissingGreetingSession />;
  const report = buildGreetingReport(session);

  function restart() {
    if (!session) return;
    const next = createGreetingSession(session.studentName, session.soundEnabled);
    dispatch({ type: "START", session: next });
    router.push(`/greetings/play/?session=${encodeURIComponent(next.id)}`);
  }

  return <div className="min-h-screen">
    <AppHeader actions={<Link href="/greetings/" className="game-button flex items-center gap-2 bg-white px-4 text-sm shadow-sm"><ArrowLeft className="size-4" />挑战入口</Link>} />
    <main className="mx-auto max-w-5xl px-4 pb-12 sm:px-6">
      <section className="paper-panel rounded-[32px] p-5 sm:p-8">
        <header className="text-center"><div className="text-6xl" aria-hidden="true">{session.completedAt ? "🌟" : "🧭"}</div><h1 className="mt-5 text-3xl font-black sm:text-4xl">{session.studentName}，{session.completedAt ? "交朋友挑战完成啦！" : "挑战还在继续"}</h1><p className="mt-3 font-semibold text-slate-500">已完成 {report.completed}/26 题 · {new Date(session.createdAt).toLocaleString("zh-CN")}</p><div className="mx-auto mt-6 inline-flex items-center gap-3 rounded-[24px] bg-amber-100 px-8 py-5 text-amber-900"><Star className="size-8 fill-current" /><strong className="text-4xl">{report.earned}<span className="ml-2 text-xl text-amber-700">/ 52 分</span></strong></div><p className="mt-4 text-sm font-semibold text-slate-500">愿意开口、认真尝试，就是一次进步。</p></header>
        <section className="mt-8" aria-labelledby="greeting-skills-title"><h2 id="greeting-skills-title" className="text-xl font-black">这次的表现</h2><div className="mt-4 grid gap-4 sm:grid-cols-2">{report.skills.map((skill) => <article key={skill.skill} className="rounded-2xl border border-amber-100 bg-white p-5"><div className="flex items-center justify-between gap-3"><h3 className="font-black">{skill.label}</h3><strong className="shrink-0 text-amber-700">{skill.earned}/{skill.possible} 分</strong></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-amber-100"><div className="h-full rounded-full bg-amber-500" style={{ width: `${skill.earned / skill.possible * 100}%` }} /></div><p className="mt-3 text-xs font-semibold text-slate-500">已完成 {skill.completed}/{skill.total} 题</p></article>)}</div></section>
        <section className="mt-8" aria-labelledby="greeting-review-title"><h2 id="greeting-review-title" className="text-xl font-black">下次一起巩固</h2>{report.review.length ? <div className="mt-4 space-y-3">{report.review.map((question) => <article key={question.id} className="rounded-2xl border border-slate-100 bg-white p-4"><span className="text-xs font-black text-amber-700">{question.kind === "oral" ? "口头交流" : "字母拼词"} · {session.attempts[question.id].score} 分</span>{question.kind === "spelling" ? <><h3 lang="en" className="mt-2 text-2xl font-black">{question.word}</h3><p className="mt-1 font-semibold text-slate-500">{question.meaningZh}</p></> : <><h3 className="mt-2 font-black">{question.instructionZh}</h3>{question.promptEn && <p className="mt-2 text-sm font-semibold text-slate-500"><span lang="en">{question.promptEn}</span>（{question.translationZh}）</p>}<p className="mt-2 font-bold text-emerald-800"><span lang="en">{personalizeGreeting(question.examples[0].en, session.studentName)}</span><span className="mt-1 block text-sm">{personalizeGreeting(question.examples[0].zh, session.studentName)}</span></p></>}</article>)}</div> : <p className="mt-4 rounded-2xl bg-emerald-50 p-5 font-semibold text-emerald-800">{session.completedAt ? "这次每道题都独立完成了！下次可以试着主动和家人打招呼。" : "目前还没有需要巩固的已答题目，继续挑战吧。"}</p>}</section>
        <div className="mt-8 flex flex-wrap justify-center gap-3">{!session.completedAt && <Link href={`/greetings/play/?session=${encodeURIComponent(session.id)}`} className="game-button inline-flex items-center gap-2 bg-amber-600 px-6 text-white">继续挑战<ArrowRight className="size-4" /></Link>}<button type="button" onClick={restart} className="game-button flex items-center gap-2 bg-amber-600 px-6 text-white"><RotateCcw className="size-4" />重新挑战</button><Link href="/greetings/" className="game-button inline-flex items-center bg-slate-100 px-6">返回入口</Link></div>
      </section>
    </main>
  </div>;
}
