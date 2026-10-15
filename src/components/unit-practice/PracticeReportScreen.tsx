"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/ui/AppHeader";
import { practiceCollections, practiceQuests } from "@/content/unit-practice";
import { personalizeGreeting } from "@/content/greetings/questions";
import { buildPracticeReport, createPracticeSession } from "@/features/unit-practice/engine";
import { usePractice } from "@/features/unit-practice/practice-context";
import { MissingPracticeSession } from "./PracticePlayScreen";

export function PracticeReportScreen({ sessionId }: { sessionId: string }) {
  const { collection, data, dispatch, hydrated } = usePractice(), router = useRouter();
  const config = practiceCollections[collection], session = data.sessions.find((s) => s.id === sessionId);
  if (!hydrated) return <main className="grid min-h-screen place-items-center font-black">正在整理挑战结果…</main>;
  if (!session) return <MissingPracticeSession />;
  const quest = practiceQuests[session.questId], report = buildPracticeReport(session);
  function restart() {
    if (!session) return;
    const next = createPracticeSession(session.questId, session.studentName, session.soundEnabled);
    dispatch({ type: "START", session: next }); router.push(`${config.route}/play/?session=${encodeURIComponent(next.id)}`);
  }
  return <div className="min-h-screen"><AppHeader actions={<Link href={`${config.route}/`} className="game-button inline-flex items-center bg-white px-4 text-sm shadow-sm">返回挑战入口</Link>} /><main className="mx-auto max-w-5xl px-4 pb-12 sm:px-6"><section className="paper-panel rounded-[32px] p-5 sm:p-8">
    <header className="text-center"><span className="text-6xl" aria-hidden="true">🌟</span><h1 className="mt-5 text-3xl font-black">{session.studentName}，{session.completedAt ? "挑战完成啦！" : "挑战还在继续"}</h1><p className="mt-3 font-black text-amber-800">{quest.title}</p><p className="mt-2 text-sm font-semibold text-slate-500">已完成 {report.completed}/{quest.questions.length} 题 · {new Date(session.createdAt).toLocaleString("zh-CN")}</p><p className="mx-auto mt-6 inline-flex items-center rounded-[24px] bg-amber-100 px-8 py-5 text-amber-900"><strong className="text-4xl">⭐ {report.earned}<span className="ml-2 text-xl">/ {report.possible} 分</span></strong></p><p className="mt-4 text-sm font-semibold text-slate-500">愿意开口、认真尝试，就是一次进步。</p></header>
    <section className="mt-8" aria-labelledby="practice-skills"><h2 id="practice-skills" className="text-xl font-black">这次的表现</h2><div className="mt-4 grid gap-4 sm:grid-cols-2">{report.skills.map((skill) => <article key={skill.skill} className="rounded-2xl border border-amber-100 bg-white p-5"><div className="flex items-center justify-between gap-3"><h3 className="font-black">{skill.label}</h3><strong className="text-amber-700">{skill.earned}/{skill.possible} 分</strong></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-amber-100"><div className="h-full rounded-full bg-amber-500" style={{ width: `${skill.possible ? skill.earned / skill.possible * 100 : 0}%` }} /></div><p className="mt-3 text-xs font-semibold text-slate-500">已完成 {skill.completed}/{skill.total} 题</p></article>)}</div></section>
    <section className="mt-8" aria-labelledby="practice-review"><h2 id="practice-review" className="text-xl font-black">下次一起巩固</h2>{report.review.length ? <div className="mt-4 space-y-3">{report.review.map((q) => <article key={q.id} className="rounded-2xl border border-slate-100 bg-white p-4"><span className="text-xs font-black text-amber-800">{q.kind === "oral" ? "口头交流" : q.kind === "spelling" ? "字母拼词" : "句子排序"} · {session.attempts[q.id].score} 分</span>{q.kind === "oral" ? <><h3 className="mt-2 font-black">{q.instructionZh}</h3><p className="mt-3 font-bold text-emerald-800" lang="en">{personalizeGreeting(q.examples[0].en, session.studentName)}</p><p className="mt-1 font-semibold text-slate-500">{personalizeGreeting(q.examples[0].zh, session.studentName)}</p></> : <><h3 className="mt-2 text-2xl font-black" lang="en">{q.kind === "spelling" ? q.word : q.tokens.join(" ")}</h3><p className="mt-1 font-semibold text-slate-500">{q.kind === "spelling" ? q.meaningZh : q.translationZh}</p></>}</article>)}</div> : <p className="mt-4 rounded-2xl bg-emerald-50 p-5 font-semibold text-emerald-800">{session.completedAt ? "这次每道题都独立完成了！可以和家人换角色再说一说。" : "目前还没有需要巩固的已答题目，继续挑战吧。"}</p>}</section>
    <div className="mt-8 flex flex-wrap justify-center gap-3">{!session.completedAt && <Link href={`${config.route}/play/?session=${encodeURIComponent(session.id)}`} className="game-button inline-flex items-center bg-amber-700 px-6 text-white">继续挑战</Link>}<button type="button" onClick={restart} className="game-button flex items-center gap-2 bg-amber-700 px-6 text-white"><RotateCcw className="size-4" />重新挑战</button><Link href={`${config.route}/`} className="game-button inline-flex items-center bg-slate-100 px-6">{collection === "school" ? "选择另一关" : "返回复习入口"}</Link></div>
  </section></main></div>;
}
