"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ChevronRight, History, Play, Sparkles, Trash2, Volume2, VolumeX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/ui/AppHeader";
import { avatars } from "@/content/vocabulary";
import { useGrammar } from "@/features/grammar/grammar-context";
import { createGrammarSession } from "@/features/grammar/session";

export function GrammarWelcomeScreen() {
  const router = useRouter();
  const { data, dispatch, hydrated, storageAvailable } = useGrammar();
  const [studentName, setStudentName] = useState("");
  const [avatarId, setAvatarId] = useState("rabbit");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prefersReducedMotion = useReducedMotion();
  const [motionPreference, setMotionPreference] = useState<boolean | null>(null);
  const reducedMotion = motionPreference ?? Boolean(prefersReducedMotion);
  const [showHistory, setShowHistory] = useState(false);
  const activeSession = useMemo(() => data.sessions.find((session) => session.id === data.activeSessionId && session.status !== "completed"), [data]);
  const completedSessions = data.sessions.filter((session) => session.status === "completed");

  function start() {
    const session = createGrammarSession({ studentName, avatarId, soundEnabled, reducedMotion });
    dispatch({ type: "CREATE_SESSION", session });
    router.push(`/grammar/quest/?session=${encodeURIComponent(session.id)}`);
  }

  if (!hydrated) return <main className="grid min-h-screen place-items-center font-black text-slate-600">正在启动语法飞船…</main>;

  return (
    <div className={reducedMotion ? "reduced-motion min-h-screen" : "min-h-screen"}>
      <AppHeader actions={<div className="flex gap-2"><button type="button" onClick={() => router.push("/")} className="game-button flex min-h-11 items-center gap-2 bg-white px-4 text-sm shadow-sm"><ArrowLeft className="size-4" /><span className="hidden sm:inline">选择板块</span></button><button type="button" onClick={() => setShowHistory(true)} className="game-button flex min-h-11 items-center gap-2 bg-white px-4 text-sm shadow-sm"><History className="size-4" /><span className="hidden sm:inline">语法记录</span>{completedSessions.length > 0 && <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs">{completedSessions.length}</span>}</button></div>} />
      <main className="mx-auto grid w-full max-w-6xl gap-7 px-4 pb-12 pt-3 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:px-8 lg:pt-8">
        <section className="text-center lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-2 text-sm font-black text-violet-700"><Sparkles className="size-4" />Grammar Galaxy</span>
          <h1 className="mt-5 text-5xl font-black leading-none tracking-[-0.05em] sm:text-6xl">语法星球<br /><span className="text-violet-600">准备起飞！</span></h1>
          <p className="mx-auto mt-5 max-w-lg text-lg font-bold leading-8 text-slate-500 lg:mx-0">每关抽取 8 道题。选一选、排一排、配一配，把单复数和人称变化真正弄明白。</p>
          <div className="mt-7 flex justify-center gap-3 text-4xl lg:justify-start" aria-hidden="true"><span className="rounded-2xl bg-[#DFF3FF] p-4">I am</span><span className="rounded-2xl bg-[#FFD4E5] p-4">🪐</span><span className="rounded-2xl bg-[#CFF3C5] p-4">They are</span></div>
        </section>

        <motion.section initial={reducedMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="paper-panel rounded-[32px] p-5 sm:p-7" aria-labelledby="grammar-setup-title">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-violet-600">Grammar passport</p>
          <h2 id="grammar-setup-title" className="mt-1 text-2xl font-black">领取语法通行证</h2>
          {!storageAvailable && <p role="status" className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm font-bold text-amber-800">当前浏览器无法保存记录，刷新后进度可能丢失。</p>}
          {activeSession && <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-violet-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><strong className="text-violet-700">{activeSession.studentName} 的语法冒险还在继续</strong><p className="mt-1 text-sm font-semibold text-slate-500">已完成 {activeSession.completedStageIds.length}/10 关</p></div><button type="button" onClick={() => { dispatch({ type: "RESUME_SESSION", sessionId: activeSession.id }); router.push(`/grammar/quest/?session=${encodeURIComponent(activeSession.id)}`); }} className="game-button flex min-h-11 items-center justify-center gap-2 bg-white px-4 text-sm text-violet-700 shadow-sm"><Play className="size-4 fill-current" />继续闯关</button></div>}

          <label htmlFor="grammar-student-name" className="mt-5 block text-sm font-black">小勇士叫什么名字？</label>
          <div className="relative mt-2"><input id="grammar-student-name" value={studentName} maxLength={12} onChange={(event) => setStudentName(event.target.value)} placeholder="不填也可以" className="h-14 w-full rounded-2xl border-2 border-slate-100 bg-white px-4 pr-14 font-bold focus:border-violet-300" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">{studentName.length}/12</span></div>
          <fieldset className="mt-5"><legend className="text-sm font-black">选择探险伙伴</legend><div className="mt-3 grid grid-cols-4 gap-2">{avatars.map((avatar) => { const selected = avatar.id === avatarId; return <button type="button" key={avatar.id} aria-pressed={selected} aria-label={avatar.label} onClick={() => setAvatarId(avatar.id)} className={`game-button grid min-h-20 place-items-center border-2 text-3xl ${selected ? "border-violet-500 ring-4 ring-violet-100" : "border-transparent"}`} style={{ backgroundColor: avatar.color }}><span>{avatar.emoji}</span><span className="text-xs font-black text-slate-600">{avatar.label}</span></button>; })}</div></fieldset>
          <div className="mt-5 flex flex-wrap gap-3"><button type="button" aria-pressed={soundEnabled} onClick={() => setSoundEnabled((value) => !value)} className={`flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-black ${soundEnabled ? "bg-[#24324A] text-white" : "bg-slate-100 text-slate-500"}`}>{soundEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}{soundEnabled ? "声音开启" : "声音关闭"}</button><button type="button" aria-pressed={reducedMotion} onClick={() => setMotionPreference(!reducedMotion)} className={`min-h-11 rounded-full px-4 text-sm font-black ${reducedMotion ? "bg-[#24324A] text-white" : "bg-slate-100 text-slate-500"}`}>减少动画</button></div>
          <button type="button" onClick={start} className="game-button mt-6 flex w-full items-center justify-center gap-3 bg-violet-600 px-6 text-lg text-white shadow-[0_8px_0_#6D28D9] hover:bg-violet-700">开始语法冒险<ChevronRight className="size-5" /></button>
        </motion.section>
      </main>

      <AnimatePresence>{showHistory && <motion.div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/25 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.target === event.currentTarget && setShowHistory(false)}><motion.section role="dialog" aria-modal="true" aria-labelledby="grammar-history-title" className="paper-panel max-h-[82vh] w-full max-w-xl overflow-auto rounded-[28px] p-6" initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}><div className="flex items-center justify-between"><h2 id="grammar-history-title" className="text-2xl font-black">语法冒险记录</h2><button type="button" onClick={() => setShowHistory(false)} className="rounded-xl px-3 py-2 font-bold text-slate-500">关闭</button></div><div className="mt-5 space-y-3">{completedSessions.length ? completedSessions.map((session) => <button type="button" key={session.id} onClick={() => router.push(`/grammar/report/?session=${encodeURIComponent(session.id)}`)} className="flex w-full items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 text-left hover:bg-violet-50"><span className="text-3xl">{avatars.find((avatar) => avatar.id === session.avatarId)?.emoji ?? "⭐"}</span><span className="flex-1"><strong className="block">{session.studentName}</strong><span className="text-sm font-semibold text-slate-500">{new Date(session.createdAt).toLocaleDateString("zh-CN")}</span></span><ChevronRight className="size-5 text-slate-400" /></button>) : <p className="rounded-2xl bg-violet-50 p-8 text-center font-semibold text-slate-500">完成一次语法冒险后，记录会出现在这里。</p>}</div>{completedSessions.length > 0 && <button type="button" onClick={() => { if (window.confirm("清除已完成的语法记录？进行中的冒险会保留。")) dispatch({ type: "CLEAR_HISTORY" }); }} className="mt-5 flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-500 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="size-4" />清除语法历史</button>}</motion.section></motion.div>}</AnimatePresence>
    </div>
  );
}
