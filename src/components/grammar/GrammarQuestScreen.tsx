"use client";

import { ArrowLeft, ArrowRight, Home, Map, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AdventureProgress } from "@/components/assessment/AdventureProgress";
import { AudioPromptButton } from "@/components/assessment/AudioPromptButton";
import { AppHeader } from "@/components/ui/AppHeader";
import { grammarQuestionById } from "@/content/grammar/questions";
import { grammarStageById, grammarStages } from "@/content/grammar/stages";
import { avatars } from "@/content/vocabulary";
import { evaluateGrammarResponse } from "@/features/grammar/evaluator";
import { useGrammar } from "@/features/grammar/grammar-context";
import { buildReviewOrder, scoreGrammarAttempt } from "@/features/grammar/scoring";
import { getNextGrammarStageId, resetGrammarSession } from "@/features/grammar/session";
import type { GrammarAttempt, GrammarResponse } from "@/features/grammar/types";
import { useSpeech } from "@/hooks/useSpeech";
import { GrammarQuestionRenderer } from "./GrammarQuestionRenderer";
import { GrammarStageCompleteDialog } from "./GrammarStageCompleteDialog";
import { GrammarStageMap } from "./GrammarStageMap";

export function GrammarQuestScreen({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const { data, dispatch, hydrated } = useGrammar();
  const session = data.sessions.find((item) => item.id === sessionId);
  const [showMap, setShowMap] = useState(true);
  const [stageComplete, setStageComplete] = useState(false);
  const { playSuccessTone, playErrorTone, stop } = useSpeech(session?.settings.soundEnabled ?? false);

  useEffect(() => () => stop(), [stop]);

  const questionIds = session ? (session.inReview ? session.reviewOrder : session.questionOrder[session.currentStageId] ?? []) : [];
  const questionIndex = session?.inReview ? session.reviewIndex : session?.currentQuestionIndex ?? 0;
  const question = grammarQuestionById[questionIds[questionIndex]];
  const attempt = session ? (session.inReview ? session.reviewAttempts : session.attempts).find((item) => item.questionId === question?.id) : undefined;
  const totalMain = useMemo(() => session ? Object.values(session.questionOrder).flat().length : 0, [session]);
  const completedMain = session?.attempts.filter((item) => item.completedAt).length ?? 0;
  const completedReview = session?.reviewAttempts.filter((item) => item.completedAt).length ?? 0;
  const total = totalMain + (session?.reviewOrder.length ?? 0);
  const stars = session ? [...session.attempts, ...session.reviewAttempts].reduce((sum, item) => sum + scoreGrammarAttempt(item), 0) : 0;
  const streak = session ? getGrammarStreak(session.inReview ? session.reviewAttempts : session.attempts) : 0;

  if (!hydrated) return <main className="grid min-h-screen place-items-center font-black">正在寻找语法星球…</main>;
  if (!session) return <MissingGrammarSession onHome={() => router.push("/grammar/")} />;
  const currentSession = session;
  const stage = grammarStageById[currentSession.currentStageId];
  const stageAttempts = currentSession.attempts.filter((item) => currentSession.questionOrder[currentSession.currentStageId]?.includes(item.questionId) && item.completedAt);
  const stagePercentage = stageAttempts.length ? Math.round(stageAttempts.reduce((sum, item) => sum + scoreGrammarAttempt(item), 0) / (stageAttempts.length * 2) * 100) : 0;

  function selectStage(stageId: string) {
    stop();
    dispatch({ type: "START_STAGE", sessionId, stageId });
    setShowMap(false);
    setStageComplete(false);
  }

  function submit(response: GrammarResponse) {
    if (!question || attempt?.completedAt) return;
    const correct = evaluateGrammarResponse(question, response);
    if (correct) void playSuccessTone(); else void playErrorTone();
    dispatch({ type: "SUBMIT_RESPONSE", sessionId, questionId: question.id, response, review: currentSession.inReview });
  }

  function next() {
    if (!attempt?.completedAt) return;
    stop();
    if (questionIndex < questionIds.length - 1) dispatch({ type: "NEXT_QUESTION", sessionId, review: currentSession.inReview });
    else if (currentSession.inReview) finishAdventure();
    else setStageComplete(true);
  }

  function previous() {
    stop();
    dispatch({ type: "PREVIOUS_QUESTION", sessionId, review: currentSession.inReview });
  }

  function completeStage() {
    const nextStageId = getNextGrammarStageId(currentSession.currentStageId);
    dispatch({ type: "COMPLETE_STAGE", sessionId, stageId: currentSession.currentStageId, nextStageId });
    setStageComplete(false);
    if (nextStageId) {
      setShowMap(true);
      return;
    }
    const reviewOrder = buildReviewOrder(currentSession);
    if (reviewOrder.length) {
      dispatch({ type: "BEGIN_REVIEW", sessionId, questionIds: reviewOrder });
      setShowMap(false);
    } else finishAdventure();
  }

  function finishAdventure() {
    dispatch({ type: "COMPLETE_SESSION", sessionId });
    router.push(`/grammar/report/?session=${encodeURIComponent(sessionId)}`);
  }

  function restart() {
    if (!window.confirm("重新开始会清除本次语法答题记录，并重新抽题。确定吗？")) return;
    const reset = resetGrammarSession(currentSession);
    dispatch({ type: "RESET_SESSION", sessionId, reset });
    router.replace(`/grammar/quest/?session=${encodeURIComponent(reset.id)}`);
    setShowMap(true);
  }

  return <div className={currentSession.settings.reducedMotion ? "reduced-motion min-h-screen" : "min-h-screen"}>
    <AppHeader actions={<div className="flex items-center gap-2"><button type="button" onClick={restart} title="重新开始" className="grid size-10 place-items-center rounded-full bg-white text-slate-500 shadow-sm"><RotateCcw className="size-4" /></button><span className="hidden rounded-full bg-white px-3 py-2 text-sm font-black text-slate-600 shadow-sm sm:block">{avatars.find((item) => item.id === currentSession.avatarId)?.emoji} {currentSession.studentName}</span></div>} />
    <div className="mx-auto w-full max-w-[1400px] px-4 pb-24 sm:px-6 lg:px-8">
      <AdventureProgress completed={completedMain + completedReview} total={total || totalMain} stars={stars} streak={streak} />
      <div className="mt-5">{showMap && !currentSession.inReview ? <GrammarStageMap session={currentSession} onSelect={selectStage} /> : <main className="paper-panel flex min-h-[72vh] flex-col rounded-[32px] p-4 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3"><button type="button" onClick={() => { if (currentSession.inReview) { dispatch({ type: "PAUSE_SESSION", sessionId }); router.push("/grammar/"); } else setShowMap(true); }} className="game-button flex min-h-11 items-center gap-2 bg-slate-100 px-4 text-sm">{currentSession.inReview ? <Home className="size-4" /> : <Map className="size-4" />}{currentSession.inReview ? "暂停复习" : "地图"}</button><span className="rounded-full px-4 py-2 text-sm font-black" style={{ backgroundColor: currentSession.inReview ? "#FFF0B8" : stage?.accent }}>{currentSession.inReview ? "⛽ 错题加油站" : `${stage?.icon} ${stage?.titleZh}`}</span></div>
        {question ? <div className="m-auto w-full max-w-5xl py-5 text-center"><p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600">{currentSession.inReview ? "Review" : "Question"} {questionIndex + 1} / {questionIds.length}</p><h1 className="mt-3 text-2xl font-black text-slate-600 sm:text-3xl">{question.promptEn}</h1><p className="mt-2 text-base font-bold text-slate-500">{question.promptZh}</p><div className="mt-7"><GrammarQuestionRenderer key={`${question.id}-${currentSession.inReview ? "review" : "main"}`} question={question} attempt={attempt} onSubmit={submit} /></div>{attempt?.completedAt && question.audioText && <div className="mt-5"><p className="mb-2 text-sm font-black text-slate-400">听一听正确句子</p><AudioPromptButton text={question.audioText} enabled={currentSession.settings.soundEnabled} /></div>}</div> : <div className="m-auto text-center"><p className="text-6xl">🧭</p><h1 className="mt-4 text-3xl font-black">这一题暂时找不到</h1><button type="button" onClick={() => setShowMap(true)} className="game-button mt-5 bg-violet-600 px-6 text-white">返回地图</button></div>}
        {question && <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4"><button type="button" disabled={questionIndex === 0} onClick={previous} className="game-button flex min-h-12 items-center gap-2 bg-slate-100 px-5 text-sm disabled:opacity-40"><ArrowLeft className="size-4" />上一题</button><button type="button" disabled={!attempt?.completedAt} onClick={next} className="game-button flex min-h-12 items-center gap-2 bg-violet-600 px-6 text-sm text-white shadow-sm disabled:opacity-40">{questionIndex >= questionIds.length - 1 ? currentSession.inReview ? "完成冒险" : "完成本关" : "下一题"}<ArrowRight className="size-4" /></button></div>}
      </main>}</div>
    </div>
    {stageComplete && stage && <GrammarStageCompleteDialog stage={stage} percentage={stagePercentage} finalStage={grammarStages.at(-1)?.id === stage.id} reducedMotion={currentSession.settings.reducedMotion} onContinue={completeStage} />}
  </div>;
}

function getGrammarStreak(attempts: GrammarAttempt[]) {
  let streak = 0;
  for (let index = attempts.length - 1; index >= 0; index -= 1) {
    if (!attempts[index].completedAt || !attempts[index].firstTryCorrect) break;
    streak += 1;
  }
  return streak;
}

function MissingGrammarSession({ onHome }: { onHome: () => void }) {
  return <main className="grid min-h-screen place-items-center p-4"><section className="paper-panel max-w-md rounded-[30px] p-8 text-center"><span className="text-6xl">🪐</span><h1 className="mt-5 text-3xl font-black">没有找到这次语法冒险</h1><p className="mt-3 font-semibold text-slate-500">记录可能已被清除，或者链接来自另一个浏览器。</p><button type="button" onClick={onHome} className="game-button mt-6 inline-flex items-center gap-2 bg-violet-600 px-6 text-white"><ArrowLeft className="size-5" />返回语法星球</button></section></main>;
}
