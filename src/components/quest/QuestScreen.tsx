"use client";

import { ArrowLeft, ArrowRight, Map, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { questionById } from "@/content/questions";
import { stageById } from "@/content/stages";
import { avatars } from "@/content/vocabulary";
import { AdventureProgress } from "@/components/assessment/AdventureProgress";
import { FeedbackOverlay, type FeedbackState } from "@/components/assessment/FeedbackOverlay";
import { QuestionRenderer } from "@/components/assessment/QuestionRenderer";
import { QuestionShell } from "@/components/assessment/QuestionShell";
import { StageCompleteDialog } from "@/components/assessment/StageCompleteDialog";
import { StageMap } from "@/components/assessment/StageMap";
import { AppHeader } from "@/components/ui/AppHeader";
import { TeacherControlPanel } from "@/components/teacher/TeacherControlPanel";
import { useAssessment } from "@/features/assessment/assessment-context";
import { getNextPlayableStageId, resetSession } from "@/features/assessment/session";
import { getTotalStars, maxQuestionScore, scoreAttempt } from "@/features/assessment/scoring";
import type { AssessmentSession, ManualScore, WordReadingScores } from "@/features/assessment/types";
import { useSpeech } from "@/hooks/useSpeech";

const successMessages = ["Great job!", "Awesome!", "You got it!", "太棒了！"];

export function QuestScreen({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const { data, dispatch, hydrated } = useAssessment();
  const session = data.sessions.find((item) => item.id === sessionId);
  const [showMap, setShowMap] = useState(true);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [stageComplete, setStageComplete] = useState(false);
  const [inputLocked, setInputLocked] = useState(false);
  const feedbackTimeoutRef = useRef<number | undefined>(undefined);
  const { speak, stop, playSuccessTone, playErrorTone } = useSpeech(session?.settings.soundEnabled ?? false);

  const questionIds = session?.questionOrder[session.currentStageId] ?? [];
  const questionId = questionIds[session?.currentQuestionIndex ?? 0];
  const question = questionId ? questionById[questionId] : undefined;
  const attempt = session?.attempts.find((item) => item.questionId === questionId);
  const stage = session ? stageById[session.currentStageId] : undefined;
  const avatar = avatars.find((item) => item.id === session?.avatarId);
  const totalQuestions = useMemo(() => session ? Object.values(session.questionOrder).flat().length : 0, [session]);
  const answered = session?.attempts.filter((item) => item.completedAt || item.skipped).length ?? 0;
  const streak = session ? getStreak(session) : 0;

  useEffect(() => () => {
    if (feedbackTimeoutRef.current) window.clearTimeout(feedbackTimeoutRef.current);
    stop();
  }, [stop]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, [contenteditable='true']") || showMap || stageComplete || !session) return;
      if (event.code === "Space" && question?.audioText) { event.preventDefault(); void speak(question.audioText, { accent: "en-US", purpose: "sentence" }); }
      if (event.key.toLowerCase() === "h" && question) {
        dispatch({ type: "TOGGLE_SETTING", sessionId, setting: "hintVisible" });
        if (!session.settings.hintVisible) dispatch({ type: "USE_HINT", sessionId, questionId: question.id });
      }
      if (event.key === "ArrowLeft" && session.currentQuestionIndex > 0) {
        stop();
        clearTimedFeedback();
        dispatch({ type: "PREVIOUS_QUESTION", sessionId });
      }
      if (event.key === "ArrowRight") {
        if (attempt?.completedAt || attempt?.skipped) {
          stop();
          clearTimedFeedback();
          if (session.currentQuestionIndex >= questionIds.length - 1) setStageComplete(true);
          else dispatch({ type: "NEXT_QUESTION", sessionId });
        }
      }
      if ((question?.type === "oral-manual" || question?.type === "phonics-manual") && ["1", "2", "3"].includes(event.key)) {
        const score = (Number(event.key) - 1) as ManualScore;
        dispatch({ type: "SUBMIT_MANUAL_SCORE", sessionId, questionId: question.id, score });
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [attempt?.completedAt, attempt?.skipped, dispatch, question, questionIds.length, session, sessionId, showMap, speak, stageComplete, stop]);

  if (!hydrated) return <main className="grid min-h-screen place-items-center font-black">正在找到这次冒险…</main>;
  if (!session) return <MissingSession onHome={() => router.push("/")} />;
  const currentSession = session;

  function selectStage(stageId: string) {
    stop();
    dispatch({ type: "START_STAGE", sessionId, stageId });
    setShowMap(false);
    setStageComplete(false);
  }

  function submitAutomatic(optionId: string, correct: boolean) {
    if (!question || inputLocked || attempt?.completedAt) return;
    const attemptNumber = (attempt?.attempts ?? 0) + 1;
    stop();
    if (correct) void playSuccessTone();
    else void playErrorTone();
    dispatch({ type: "SUBMIT_AUTO_ANSWER", sessionId, questionId: question.id, optionId, correct });
    if (correct) {
      const title = successMessages[Math.floor(Math.random() * successMessages.length)];
      showTimedFeedback({ kind: "correct", title, message: attemptNumber === 1 ? "一下就找到了，获得2颗星！" : "再看一次就找到了，获得1颗星！" }, 1800);
    } else if (attemptNumber < 2) {
      showTimedFeedback({ kind: "retry", title: "Nice try!", message: "Let’s look again. 再找一找吧！" }, 1300);
    } else {
      showTimedFeedback({ kind: "revealed", title: "Good exploring!", message: "一起看看正确答案，继续向前吧。" }, 1800);
    }
  }

  function showTimedFeedback(nextFeedback: NonNullable<FeedbackState>, duration: number) {
    clearTimedFeedback();
    setInputLocked(true);
    setFeedback(nextFeedback);
    feedbackTimeoutRef.current = window.setTimeout(() => {
      feedbackTimeoutRef.current = undefined;
      setFeedback(null);
      setInputLocked(false);
    }, duration);
  }

  function clearTimedFeedback() {
    if (feedbackTimeoutRef.current) window.clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = undefined;
    setFeedback(null);
    setInputLocked(false);
  }

  function goPrevious() {
    stop();
    clearTimedFeedback();
    dispatch({ type: "PREVIOUS_QUESTION", sessionId });
  }

  function openMap() {
    stop();
    clearTimedFeedback();
    setShowMap(true);
  }

  function goNext() {
    stop();
    clearTimedFeedback();
    if (!question) { setStageComplete(true); return; }
    if (!attempt?.completedAt && !attempt?.skipped) {
      const shouldSkip = window.confirm("本题还未完成。继续后会按“跳过”记录0分，确定吗？");
      if (!shouldSkip) return;
      dispatch({ type: "SKIP_QUESTION", sessionId, questionId: question.id });
    }
    if (currentSession.currentQuestionIndex >= questionIds.length - 1) setStageComplete(true);
    else dispatch({ type: "NEXT_QUESTION", sessionId });
  }

  function completeCurrentStage() {
    const nextStageId = getNextPlayableStageId(currentSession, currentSession.currentStageId);
    dispatch({ type: "COMPLETE_STAGE", sessionId, stageId: currentSession.currentStageId, nextStageId });
    setStageComplete(false);
    if (nextStageId) setShowMap(true);
    else {
      dispatch({ type: "COMPLETE_SESSION", sessionId });
      router.push(`/report/?session=${encodeURIComponent(sessionId)}`);
    }
  }

  function revealAnswer() {
    if (!question) return;
    stop();
    dispatch({ type: "REVEAL_ANSWER", sessionId, questionId: question.id });
    showTimedFeedback({ kind: "revealed", title: "Let’s learn together!", message: "答案已经显示，本题不会扣星。" }, 1800);
  }

  function pauseSession() {
    dispatch({ type: "PAUSE_SESSION", sessionId });
    router.push("/");
  }

  function finishSession() {
    if (!window.confirm("现在结束本次摸底并生成报告吗？未作答题目不会计入能力分。")) return;
    dispatch({ type: "COMPLETE_SESSION", sessionId });
    router.push(`/report/?session=${encodeURIComponent(sessionId)}`);
  }

  function restartCurrentSession() {
    if (!window.confirm("重新开始会清除本次答题记录，确定吗？")) return;
    const reset = resetSession(currentSession);
    dispatch({ type: "RESET_SESSION", sessionId, reset });
    router.replace(`/quest/?session=${encodeURIComponent(reset.id)}`);
  }

  const finalStage = !getNextPlayableStageId(session, session.currentStageId);
  const isManualDisplay = question?.type === "word-reading-manual" || question?.type === "phonics-manual";

  return (
    <div className={session.settings.reducedMotion ? "reduced-motion min-h-screen" : "min-h-screen"}>
      <AppHeader actions={<div className="flex items-center gap-2"><button type="button" onClick={restartCurrentSession} title="重新开始" className="no-print grid size-10 place-items-center rounded-full bg-white text-slate-500 shadow-sm"><RotateCcw className="size-4" /></button><span className="hidden rounded-full bg-white px-3 py-2 text-sm font-black text-slate-600 shadow-sm sm:block">{avatar?.emoji} {session.studentName}</span></div>} />
      <div className="mx-auto w-full max-w-[1400px] px-4 pb-32 sm:px-6 lg:px-8 lg:pb-10">
        <AdventureProgress completed={answered} total={totalQuestions} stars={getTotalStars(session)} streak={streak} />
        <div className="mt-5">
          {showMap ? <StageMap session={session} onSelect={selectStage} /> : (
            <main className={`grid gap-5 ${session.mode === "teacher-led" ? "lg:grid-cols-[minmax(0,1fr)_300px]" : ""}`}>
              <section className="paper-panel flex min-h-[66vh] flex-col rounded-[32px] p-4 sm:p-7">
                <div className="flex items-center justify-between gap-3"><button type="button" onClick={openMap} className="game-button flex min-h-11 items-center gap-2 bg-slate-100 px-4 text-sm"><Map className="size-4" />地图</button><span className="rounded-full px-4 py-2 text-sm font-black" style={{ backgroundColor: stage?.accent }}>{stage?.icon} {stage?.titleZh}</span></div>
                {!question ? (
                  <div className="m-auto max-w-xl py-10 text-center"><span className="text-7xl" aria-hidden="true">👋</span><h1 className="mt-6 text-4xl font-black sm:text-5xl">Hello, {session.studentName}!</h1><p className="mt-4 text-xl font-bold text-slate-500">Wave hello, take a deep breath, and let’s begin!</p><button type="button" onClick={() => setStageComplete(true)} className="game-button primary-button mt-8 inline-flex items-center gap-2 px-7">完成热身 <ArrowRight className="size-5" /></button></div>
                ) : isManualDisplay ? (
                  <div className="m-auto w-full max-w-5xl py-4 text-center"><p className="text-xs font-black uppercase tracking-[0.18em] text-[#4F8EF7]">Question {session.currentQuestionIndex + 1} / {questionIds.length}</p><h1 className="mt-3 text-2xl font-black text-slate-500">{question.type === "word-reading-manual" ? "Read this magic word" : question.isPseudoWord ? "Magic word challenge" : "Blend the sounds"}</h1><p className="mt-2 font-bold text-slate-400">{session.settings.hintVisible ? question.promptZh : "先让孩子尝试，再使用播放答案。"}</p><div className="mt-6"><QuestionRenderer question={question} attempt={attempt} settings={session.settings} interactionLocked={inputLocked} onAutoSelect={() => undefined} onSceneSelect={() => undefined} onBlankScene={() => undefined} onManualScore={(score) => dispatch({ type: "SUBMIT_MANUAL_SCORE", sessionId, questionId: question.id, score })} onWordScore={(field, score) => dispatch({ type: "SUBMIT_WORD_SCORE", sessionId, questionId: question.id, field, score })} onReveal={revealAnswer} /></div></div>
                ) : (
                  <QuestionShell questionNumber={session.currentQuestionIndex + 1} totalQuestions={questionIds.length} promptEn={question.promptEn} promptZh={question.promptZh} audioText={question.audioText} soundEnabled={session.settings.soundEnabled} hintVisible={session.settings.hintVisible}>
                    <QuestionRenderer question={question} attempt={attempt} settings={session.settings} interactionLocked={inputLocked} onAutoSelect={(optionId) => submitAutomatic(optionId, (question.type === "audio-image-choice" || question.type === "single-choice" || question.type === "sentence-choice") && optionId === question.correctOptionId)} onSceneSelect={(hotspotId) => submitAutomatic(hotspotId, question.type === "scene-hotspot" && hotspotId === question.hotspotId)} onBlankScene={() => submitAutomatic("__blank__", false)} onManualScore={(score) => dispatch({ type: "SUBMIT_MANUAL_SCORE", sessionId, questionId: question.id, score })} onWordScore={(field: keyof WordReadingScores, score: ManualScore) => dispatch({ type: "SUBMIT_WORD_SCORE", sessionId, questionId: question.id, field, score })} onReveal={revealAnswer} />
                  </QuestionShell>
                )}
                {question && <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4"><button type="button" disabled={session.currentQuestionIndex === 0} onClick={goPrevious} className="game-button flex min-h-12 items-center gap-2 bg-slate-100 px-5 text-sm disabled:opacity-40"><ArrowLeft className="size-4" />上一题</button><button type="button" onClick={goNext} className="game-button primary-button flex min-h-12 items-center gap-2 px-6 text-sm">{session.currentQuestionIndex >= questionIds.length - 1 ? "完成本关" : "下一题"}<ArrowRight className="size-4" /></button></div>}
              </section>
              {session.mode === "teacher-led" && <TeacherControlPanel session={session} question={question} attempt={attempt} questionNumber={session.currentQuestionIndex + 1} totalQuestions={questionIds.length} onPrevious={goPrevious} onNext={goNext} onSkip={() => question && dispatch({ type: "SKIP_QUESTION", sessionId, questionId: question.id })} onRetry={() => { clearTimedFeedback(); if (question) dispatch({ type: "RETRY_QUESTION", sessionId, questionId: question.id }); }} onReplay={(accent) => question?.audioText && void speak(question.audioText, { accent, purpose: "sentence" })} onToggleHint={() => { dispatch({ type: "TOGGLE_SETTING", sessionId, setting: "hintVisible" }); if (question && !session.settings.hintVisible) dispatch({ type: "USE_HINT", sessionId, questionId: question.id }); }} onReveal={revealAnswer} onToggleDebug={() => dispatch({ type: "TOGGLE_SETTING", sessionId, setting: "hotspotDebug" })} onToggleSound={() => dispatch({ type: "TOGGLE_SETTING", sessionId, setting: "soundEnabled" })} onToggleMotion={() => dispatch({ type: "TOGGLE_SETTING", sessionId, setting: "reducedMotion" })} onPause={pauseSession} onMap={openMap} onEnd={finishSession} onNote={(note) => question && dispatch({ type: "ADD_NOTE", sessionId, questionId: question.id, note })} onManualScore={(score) => question && dispatch({ type: "SUBMIT_MANUAL_SCORE", sessionId, questionId: question.id, score })} />}
            </main>
          )}
        </div>
      </div>
      <FeedbackOverlay feedback={feedback} reducedMotion={session.settings.reducedMotion} />
      {stageComplete && stage && <StageCompleteDialog stage={stage} reducedMotion={session.settings.reducedMotion} finalStage={finalStage} onContinue={completeCurrentStage} />}
    </div>
  );
}

function getStreak(session: AssessmentSession) {
  const completed = [...session.attempts].filter((attempt) => attempt.completedAt).sort((a, b) => new Date(a.completedAt ?? 0).getTime() - new Date(b.completedAt ?? 0).getTime());
  let streak = 0;
  for (let index = completed.length - 1; index >= 0; index -= 1) {
    const attempt = completed[index];
    const question = questionById[attempt.questionId];
    if (!question || scoreAttempt(attempt, question) < maxQuestionScore(question)) break;
    streak += 1;
  }
  return streak;
}

function MissingSession({ onHome }: { onHome: () => void }) {
  return <main className="grid min-h-screen place-items-center p-4"><section className="paper-panel max-w-lg rounded-[32px] p-8 text-center"><span className="text-6xl">🧭</span><h1 className="mt-5 text-3xl font-black">没有找到这次冒险</h1><p className="mt-3 text-slate-500">记录可能已被清除，或者这个链接不属于当前浏览器。</p><button type="button" onClick={onHome} className="game-button primary-button mt-6 inline-flex items-center gap-2 px-6"><ArrowLeft className="size-5" />返回欢迎页</button></section></main>;
}
