"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/ui/AppHeader";
import { FeedbackOverlay, type FeedbackState } from "@/components/assessment/FeedbackOverlay";
import { practiceCollections, practiceQuests } from "@/content/unit-practice";
import { buildPracticeReport, isPracticeCorrect, practiceCompletedCount } from "@/features/unit-practice/engine";
import { usePractice } from "@/features/unit-practice/practice-context";
import { useSpeech } from "@/hooks/useSpeech";
import type { PracticeInput } from "@/features/unit-practice/types";
import { PracticeQuestion } from "./PracticeQuestion";

export function PracticePlayScreen({ sessionId }: { sessionId: string }) {
  const { collection, data, dispatch, hydrated, storageAvailable } = usePractice();
  const config = practiceCollections[collection], session = data.sessions.find((s) => s.id === sessionId), router = useRouter();
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const { stop, playSuccessTone, playErrorTone } = useSpeech(session?.soundEnabled ?? false);
  useEffect(() => () => stop(), [stop]);
  useEffect(() => { if (!feedback) return; const timer = window.setTimeout(() => setFeedback(null), 1600); return () => window.clearTimeout(timer); }, [feedback]);
  if (!hydrated) return <main className="grid min-h-screen place-items-center font-black">正在读取挑战进度…</main>;
  if (!session) return <MissingPracticeSession />;
  if (session.completedAt) return <div><AppHeader /><main className="paper-panel mx-auto max-w-lg rounded-[32px] p-8 text-center"><h1 className="text-3xl font-black">这次挑战已经完成啦！</h1><Link href={`${config.route}/report/?session=${encodeURIComponent(session.id)}`} className="game-button mt-6 inline-flex items-center bg-amber-700 px-6 text-white">查看挑战结果</Link></main></div>;
  const quest = practiceQuests[session.questId], question = quest.questions[session.currentIndex], attempt = session.attempts[question.id];
  const stage = quest.stages.find((s) => s.id === question.stage)!;
  const inStage = quest.questions.filter((q) => q.stage === question.stage), stageIndex = inStage.findIndex((q) => q.id === question.id);
  const completed = practiceCompletedCount(session), total = quest.questions.length, report = buildPracticeReport(session);
  const canNext = attempt.score !== undefined, last = session.currentIndex === total - 1;
  function input(value: PracticeInput) {
    dispatch({ type: "ANSWER", sessionId, questionId: question.id, input: value, at: new Date().toISOString() });
    if (value.type === "SCORE") {
      setFeedback({ kind: value.score === 2 ? "correct" : "revealed", title: value.score === 2 ? "独立完成，真棒！" : "已记录这次表现", message: `本题记录 ${value.score} 分` });
      if (value.score > 0) void playSuccessTone();
    } else if (value.type === "SUBMIT" && attempt.kind !== "oral" && attempt.status === "pending" && attempt.selected.length === attempt.order.length) {
      const correct = isPracticeCorrect(question, attempt.selected);
      setFeedback({ kind: correct ? "correct" : "retry", title: correct ? "答对啦！" : "再调整一下顺序", message: correct ? `获得 ${attempt.submissions === 0 ? 2 : 1} 分` : "点击上方卡片可以撤回。" });
      if (correct) void playSuccessTone(); else void playErrorTone();
    }
  }
  function navigate(direction: "previous" | "next") {
    stop(); setFeedback(null);
    dispatch({ type: "NAVIGATE", sessionId, direction, at: new Date().toISOString() });
    if (direction === "next" && last && canNext) router.push(`${config.route}/report/?session=${encodeURIComponent(sessionId)}`);
  }
  return <div className="min-h-screen"><AppHeader actions={<Link href={`${config.route}/`} onClick={() => stop()} className="game-button flex items-center gap-2 bg-white px-4 text-sm shadow-sm"><ArrowLeft className="size-4" />返回入口</Link>} />
    <main className="mx-auto max-w-5xl px-4 pb-10 sm:px-6">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="font-black text-amber-800">{session.studentName} · {quest.title}</p><p className="mt-1 text-xs font-semibold text-slate-500">已完成 {completed}/{total} 题 · 自动保存进度</p></div><div className="flex items-center gap-3"><span className="rounded-full bg-amber-100 px-4 py-2 font-black text-amber-800">⭐ {report.earned} / {report.possible}</span><button type="button" aria-label={session.soundEnabled ? "关闭声音" : "开启声音"} aria-pressed={session.soundEnabled} onClick={() => { stop(); dispatch({ type: "TOGGLE_SOUND", sessionId }); }} className="game-button grid w-14 place-items-center bg-white shadow-sm">{session.soundEnabled ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}</button></div></header>
      {!storageAvailable && <p role="status" className="mb-4 rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-800">当前浏览器无法保存记录，刷新后进度可能丢失。</p>}
      <div role="progressbar" aria-label="总挑战进度" aria-valuemin={0} aria-valuemax={total} aria-valuenow={completed} className="mb-5 h-3 overflow-hidden rounded-full bg-amber-100"><div className="h-full rounded-full bg-amber-500 transition-[width]" style={{ width: `${completed / total * 100}%` }} /></div>
      <section className="paper-panel rounded-[32px] p-4 sm:p-8"><div className="mb-7 flex flex-wrap items-center justify-between gap-3"><span className="rounded-full bg-amber-50 px-4 py-2 text-sm font-black text-amber-800">{stage.emoji} {stage.title}</span><span className="text-xs font-black text-slate-400">第 {session.currentIndex + 1} / {total} 题 · 本环节 {stageIndex + 1}/{inStage.length}</span></div>
        <div className="mx-auto max-w-3xl text-center"><PracticeQuestion key={question.id} question={question} attempt={attempt} studentName={session.studentName} soundEnabled={session.soundEnabled} onInput={input} /></div>
        <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-100 pt-5"><button type="button" disabled={session.currentIndex === 0} onClick={() => navigate("previous")} className="game-button flex items-center gap-2 bg-slate-100 px-4 text-sm disabled:opacity-40"><ArrowLeft className="size-4" />上一题</button><button type="button" disabled={!canNext} onClick={() => navigate("next")} className="game-button flex items-center gap-2 bg-amber-700 px-5 text-white disabled:opacity-40">{last ? "查看挑战结果" : "下一题"}<ArrowRight className="size-4" /></button></div>
      </section>
    </main><FeedbackOverlay feedback={feedback} reducedMotion /></div>;
}
export function MissingPracticeSession() {
  const { collection } = usePractice(), config = practiceCollections[collection];
  return <div><AppHeader /><main className="paper-panel mx-auto max-w-xl rounded-[32px] p-8 text-center"><h1 className="text-2xl font-black">这次挑战记录暂时找不到</h1><p className="mt-3 font-semibold text-slate-500">回到入口，选择想练习的关卡吧。</p><Link href={`${config.route}/`} className="game-button mt-6 inline-flex items-center bg-amber-700 px-6 text-white">返回挑战入口</Link></main></div>;
}
