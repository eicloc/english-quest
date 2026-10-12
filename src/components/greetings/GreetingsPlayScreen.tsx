"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Star, Volume2, VolumeX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/ui/AppHeader";
import { FeedbackOverlay, type FeedbackState } from "@/components/assessment/FeedbackOverlay";
import { greetingQuestions, greetingStages } from "@/content/greetings/questions";
import { buildGreetingReport, greetingCompletedCount, isGreetingAttemptComplete, isSpellingCorrect } from "@/features/greetings/engine";
import { useGreetings } from "@/features/greetings/greetings-context";
import { useSpeech } from "@/hooks/useSpeech";
import type { GreetingQuestionAction } from "@/features/greetings/types";
import { GreetingQuestion } from "./GreetingQuestion";

export function GreetingsPlayScreen({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const { data, dispatch, hydrated, storageAvailable } = useGreetings();
  const session = data.sessions.find((item) => item.id === sessionId);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const { stop, playSuccessTone, playErrorTone } = useSpeech(session?.soundEnabled ?? false);

  useEffect(() => () => stop(), [stop]);
  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 1600);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  if (!hydrated) return <main className="grid min-h-screen place-items-center font-black">正在读取挑战进度…</main>;
  if (!session) return <MissingGreetingSession />;
  if (session.completedAt) return <div className="min-h-screen"><AppHeader /><main className="paper-panel mx-auto max-w-xl rounded-[32px] p-8 text-center"><p className="text-6xl" aria-hidden="true">🌟</p><h1 className="mt-5 text-3xl font-black">这次挑战已经完成啦！</h1><Link href={`/greetings/report/?session=${encodeURIComponent(session.id)}`} className="game-button mt-6 inline-flex items-center bg-amber-600 px-6 text-white">查看挑战结果</Link></main></div>;

  const question = greetingQuestions[session.currentIndex];
  const attempt = session.attempts[question.id];
  const stage = greetingStages.find((item) => item.id === question.stage)!;
  const stageQuestions = greetingQuestions.filter((item) => item.stage === question.stage);
  const stageIndex = stageQuestions.findIndex((item) => item.id === question.id);
  const completed = greetingCompletedCount(session);
  const canNext = isGreetingAttemptComplete(attempt);
  const last = session.currentIndex === greetingQuestions.length - 1;

  function answer(action: GreetingQuestionAction) {
    if (!session) return;
    dispatch({ type: "ANSWER", sessionId, questionId: question.id, action, at: new Date().toISOString() });
    if (action.type === "SCORE_ORAL") {
      setFeedback({ kind: action.score === 2 ? "correct" : "revealed", title: action.score === 2 ? "独立完成，真棒！" : action.score === 1 ? "在提示下完成啦！" : "记下了，我们继续探索", message: `本题记录 ${action.score} 分` });
      if (action.score > 0) void playSuccessTone();
    } else if (action.type === "SUBMIT_SPELLING" && question.kind === "spelling" && attempt.kind === "spelling" && attempt.status === "pending" && attempt.selected.length === question.word.length) {
      const correct = isSpellingCorrect(question, attempt.selected);
      setFeedback({ kind: correct ? "correct" : "retry", title: correct ? "拼对啦！" : "再调整一下顺序", message: correct ? `获得 ${attempt.submissions === 0 ? 2 : 1} 分` : "点击上方字母可以撤回，再试一试。" });
      if (correct) void playSuccessTone();
      else void playErrorTone();
    }
  }

  function navigate(direction: "previous" | "next") {
    stop();
    setFeedback(null);
    dispatch({ type: "NAVIGATE", sessionId, direction, at: new Date().toISOString() });
    if (direction === "next" && last && canNext) router.push(`/greetings/report/?session=${encodeURIComponent(sessionId)}`);
  }

  return <div className="min-h-screen">
    <AppHeader actions={<Link href="/greetings/" onClick={() => stop()} className="game-button flex items-center gap-2 bg-white px-4 text-sm shadow-sm"><ArrowLeft className="size-4" />返回入口</Link>} />
    <main className="mx-auto max-w-5xl px-4 pb-10 sm:px-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-sm font-black text-amber-700">{session.studentName} 的交朋友挑战</p><p className="mt-1 text-xs font-semibold text-slate-500">已完成 {completed}/26 题 · 自动保存进度</p></div>
        <div className="flex items-center gap-3"><span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-4 py-2 font-black text-amber-800"><Star className="size-4 fill-current" />{buildGreetingReport(session).earned} / 52</span><button type="button" aria-label={session.soundEnabled ? "关闭声音" : "开启声音"} aria-pressed={session.soundEnabled} onClick={() => { stop(); dispatch({ type: "TOGGLE_SOUND", sessionId }); }} className="game-button grid w-14 place-items-center bg-white shadow-sm">{session.soundEnabled ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}</button></div>
      </div>
      {!storageAvailable && <p role="status" className="mb-4 rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-800">当前浏览器无法保存记录，刷新后进度可能丢失。</p>}
      <div role="progressbar" aria-label="总挑战进度" aria-valuemin={0} aria-valuemax={26} aria-valuenow={completed} className="mb-5 h-3 overflow-hidden rounded-full bg-amber-100"><div className="h-full rounded-full bg-amber-500 transition-[width]" style={{ width: `${completed / 26 * 100}%` }} /></div>
      <section className="paper-panel rounded-[32px] p-4 sm:p-8">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3"><span className="rounded-full bg-amber-50 px-4 py-2 text-sm font-black text-amber-800">{stage.emoji} {stage.title}</span><span className="text-xs font-black text-slate-400">第 {session.currentIndex + 1} / 26 题 · 本环节 {stageIndex + 1}/{stageQuestions.length}</span></div>
        <div className="mx-auto max-w-3xl text-center"><GreetingQuestion key={question.id} question={question} attempt={attempt} studentName={session.studentName} soundEnabled={session.soundEnabled} onAction={answer} /></div>
        <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
          <button type="button" disabled={session.currentIndex === 0} onClick={() => navigate("previous")} className="game-button flex items-center gap-2 bg-slate-100 px-4 text-sm disabled:opacity-40"><ArrowLeft className="size-4" />上一题</button>
          <button type="button" disabled={!canNext} onClick={() => navigate("next")} className="game-button flex items-center gap-2 bg-amber-600 px-5 text-white hover:bg-amber-700 disabled:opacity-40">{last ? "查看挑战结果" : "下一题"}<ArrowRight className="size-4" /></button>
        </div>
      </section>
    </main>
    <FeedbackOverlay feedback={feedback} reducedMotion />
  </div>;
}

export function MissingGreetingSession() {
  return <div className="min-h-screen"><AppHeader /><main className="paper-panel mx-auto max-w-xl rounded-[32px] p-8 text-center"><p className="text-6xl" aria-hidden="true">🧭</p><h1 className="mt-5 text-2xl font-black">这次挑战记录暂时找不到</h1><p className="mt-3 font-semibold text-slate-500">回到入口，开始一次新的交朋友挑战吧。</p><Link href="/greetings/" className="game-button mt-6 inline-flex items-center bg-amber-600 px-6 text-white">返回问候交朋友</Link></main></div>;
}
