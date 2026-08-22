"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BookOpenCheck, ChevronRight, Gamepad2, GraduationCap, History, Library, Play, Sparkles, Trash2, Volume2, VolumeX, WandSparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { avatars } from "@/content/vocabulary";
import { useAssessment } from "@/features/assessment/assessment-context";
import { createSession } from "@/features/assessment/session";
import type { Mode } from "@/features/assessment/types";
import { AppHeader } from "@/components/ui/AppHeader";

export function WelcomeScreen() {
  const router = useRouter();
  const { data, dispatch, hydrated, storageAvailable } = useAssessment();
  const [studentName, setStudentName] = useState("");
  const [avatarId, setAvatarId] = useState("dog");
  const [mode, setMode] = useState<Mode>("teacher-led");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prefersReducedMotion = useReducedMotion();
  const [reducedMotionPreference, setReducedMotionPreference] = useState<boolean | null>(null);
  const reducedMotion = reducedMotionPreference ?? Boolean(prefersReducedMotion);
  const [showHistory, setShowHistory] = useState(false);

  const activeSession = useMemo(() => data.sessions.find((session) => session.id === data.activeSessionId && session.status !== "completed"), [data.activeSessionId, data.sessions]);
  const completedSessions = data.sessions.filter((session) => session.status === "completed");

  function startAdventure() {
    const session = createSession({ studentName, avatarId, mode, soundEnabled, reducedMotion });
    dispatch({ type: "CREATE_SESSION", session });
    router.push(`/quest/?session=${encodeURIComponent(session.id)}`);
  }

  if (!hydrated) return <main className="grid min-h-screen place-items-center text-center"><div><span className="mb-4 inline-block animate-bounce text-6xl" aria-hidden="true">🏝️</span><p className="font-extrabold text-slate-600">正在打开冒险地图…</p></div></main>;

  return (
    <div className={reducedMotion ? "reduced-motion min-h-screen" : "min-h-screen"}>
      <AppHeader actions={<div className="flex items-center gap-2"><button type="button" onClick={() => router.push("/words/")} className="game-button flex min-h-12 items-center gap-2 border border-blue-100 bg-white px-4 text-sm text-slate-700 shadow-sm hover:bg-blue-50"><Library className="size-5" /><span className="hidden sm:inline">词汇宝库</span></button><button type="button" onClick={() => setShowHistory((value) => !value)} className="game-button flex min-h-12 items-center gap-2 border border-blue-100 bg-white px-4 text-sm text-slate-700 shadow-sm hover:bg-blue-50"><History className="size-5" /><span className="hidden sm:inline">历史记录</span>{completedSessions.length > 0 && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs">{completedSessions.length}</span>}</button></div>} />
      <main className="mx-auto grid w-full max-w-[1280px] gap-8 px-4 pb-12 pt-3 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8 lg:pt-8">
        <section className="relative px-2 py-4 text-center lg:text-left">
          <motion.div initial={reducedMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
            <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-extrabold text-[#356FD1] shadow-sm ring-1 ring-blue-100"><WandSparkles className="size-4" />A gentle English adventure</span>
            <h1 className="text-5xl font-black leading-[0.98] tracking-[-0.045em] text-[#24324A] sm:text-6xl xl:text-7xl">Ready for an<span className="mt-2 block text-[#4F8EF7]">English adventure?</span></h1>
            <p className="mt-6 text-xl font-bold text-slate-600 sm:text-2xl">准备好开始英语冒险了吗？</p>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-500 lg:mx-0">听一听、找一找、读一读。没有倒计时，也没有失败，只有一步一步发现自己的英语超能力。</p>
          </motion.div>
          <div className="mx-auto mt-8 flex max-w-md items-end justify-center gap-4 lg:mx-0 lg:justify-start" aria-hidden="true">{[["🌲", "bg-[#CFF3C5]", "h-28"], ["🏫", "bg-[#DFF3FF]", "h-36"], ["🌉", "bg-[#FFD4E5]", "h-24"], ["🎁", "bg-[#FFF0B8]", "h-32"]].map(([emoji, color, height], index) => <motion.div key={emoji} animate={reducedMotion ? undefined : { y: [0, index % 2 ? -7 : -4, 0] }} transition={{ duration: 2.8 + index * 0.25, repeat: Infinity }} className={`grid ${height} w-20 place-items-center rounded-[28px] ${color} text-4xl shadow-sm sm:w-24`}>{emoji}</motion.div>)}</div>
        </section>
        <motion.section initial={reducedMotion ? false : { opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="paper-panel rounded-[32px] p-5 sm:p-7" aria-labelledby="setup-title">
          <div className="mb-6 flex items-center justify-between"><div><p className="text-sm font-black uppercase tracking-[0.16em] text-[#4F8EF7]">Your passport</p><h2 id="setup-title" className="mt-1 text-2xl font-black">领取冒险通行证</h2></div><span className="grid size-12 place-items-center rounded-2xl bg-[#FFF0B8] text-2xl" aria-hidden="true">✨</span></div>
          {!storageAvailable && <div role="status" className="mb-5 rounded-2xl bg-amber-50 p-3 text-sm font-bold text-amber-800">当前浏览器无法保存记录，本次冒险仍可继续，但刷新后可能丢失进度。</div>}
          {activeSession && <div className="mb-6 flex flex-col gap-3 rounded-2xl bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-black text-[#356FD1]">{activeSession.studentName} 的冒险还在继续</p><p className="mt-1 text-sm text-slate-500">可以从上次停下的地方接着玩。</p></div><button type="button" onClick={() => { dispatch({ type: "RESUME_SESSION", sessionId: activeSession.id }); router.push(`/quest/?session=${encodeURIComponent(activeSession.id)}`); }} className="game-button flex items-center justify-center gap-2 bg-white px-4 text-[#356FD1] shadow-sm ring-1 ring-blue-100"><Play className="size-4 fill-current" />继续闯关</button></div>}
          <label className="block text-sm font-black text-slate-700" htmlFor="student-name">小勇士叫什么名字？</label>
          <div className="relative mt-2"><input id="student-name" value={studentName} maxLength={12} onChange={(event) => setStudentName(event.target.value)} placeholder="不填也可以，我们会叫你小勇士" className="h-14 w-full rounded-2xl border-2 border-slate-100 bg-white px-4 pr-16 font-bold text-slate-800 shadow-inner transition focus:border-blue-300" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">{studentName.length}/12</span></div>
          <fieldset className="mt-6"><legend className="text-sm font-black text-slate-700">选择你的探险伙伴</legend><div className="mt-3 grid grid-cols-4 gap-2 sm:gap-3">{avatars.map((avatar) => { const selected = avatar.id === avatarId; return <button type="button" key={avatar.id} aria-pressed={selected} aria-label={avatar.label} onClick={() => setAvatarId(avatar.id)} className={`game-button grid min-h-20 place-items-center border-2 text-3xl sm:min-h-24 sm:text-4xl ${selected ? "border-[#4F8EF7] shadow-md ring-4 ring-blue-100" : "border-transparent hover:border-blue-100"}`} style={{ backgroundColor: avatar.color }}><span aria-hidden="true">{avatar.emoji}</span><span className="text-[11px] font-black text-slate-600 sm:text-xs">{avatar.label}</span></button>; })}</div></fieldset>
          <fieldset className="mt-6"><legend className="text-sm font-black text-slate-700">谁来掌舵？</legend><div className="mt-3 grid gap-3 sm:grid-cols-2"><ModeCard selected={mode === "teacher-led"} onClick={() => setMode("teacher-led")} icon={<GraduationCap />} title="老师带我闯关" description="完整7关 · 可人工评分" /><ModeCard selected={mode === "self-play"} onClick={() => setMode("self-play")} icon={<Gamepad2 />} title="我自己来挑战" description="自动题 · 轻松自主玩" /></div></fieldset>
          <div className="mt-6 flex flex-wrap gap-3"><ToggleChip active={soundEnabled} onClick={() => setSoundEnabled((value) => !value)}>{soundEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}{soundEnabled ? "声音开启" : "声音关闭"}</ToggleChip><ToggleChip active={reducedMotion} onClick={() => setReducedMotionPreference(!reducedMotion)}><BookOpenCheck className="size-4" />减少动画</ToggleChip></div>
          <button type="button" onClick={startAdventure} className="game-button primary-button mt-7 flex w-full items-center justify-center gap-3 px-6 text-lg"><Sparkles className="size-5" />开始英语冒险<ChevronRight className="size-5" /></button>
        </motion.section>
      </main>
      <AnimatePresence>{showHistory && <motion.div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/25 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.target === event.currentTarget && setShowHistory(false)}><motion.section role="dialog" aria-modal="true" aria-labelledby="history-title" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="paper-panel max-h-[82vh] w-full max-w-xl overflow-auto rounded-[28px] p-6"><div className="flex items-center justify-between"><h2 id="history-title" className="text-2xl font-black">冒险记录</h2><button type="button" onClick={() => setShowHistory(false)} className="rounded-xl px-3 py-2 font-bold text-slate-500 hover:bg-slate-100">关闭</button></div><div className="mt-5 space-y-3">{completedSessions.length === 0 ? <div className="rounded-2xl bg-blue-50 p-8 text-center text-slate-500">完成一次冒险后，记录会出现在这里。</div> : completedSessions.map((session) => { const avatar = avatars.find((item) => item.id === session.avatarId); return <button type="button" key={session.id} onClick={() => router.push(`/report/?session=${encodeURIComponent(session.id)}`)} className="flex w-full items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 text-left transition hover:border-blue-200 hover:bg-blue-50"><span className="text-3xl">{avatar?.emoji ?? "⭐"}</span><span className="min-w-0 flex-1"><strong className="block truncate">{session.studentName}</strong><span className="text-sm text-slate-500">{new Date(session.createdAt).toLocaleDateString("zh-CN")}</span></span><ChevronRight className="size-5 text-slate-400" /></button>; })}</div>{completedSessions.length > 0 && <button type="button" onClick={() => { if (window.confirm("清除已完成的历史记录？当前进行中的冒险会保留。")) dispatch({ type: "CLEAR_HISTORY" }); }} className="mt-5 flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-500 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="size-4" />清除历史记录</button>}</motion.section></motion.div>}</AnimatePresence>
    </div>
  );
}

function ModeCard({ selected, onClick, icon, title, description }: { selected: boolean; onClick: () => void; icon: React.ReactNode; title: string; description: string }) {
  return <button type="button" aria-pressed={selected} onClick={onClick} className={`game-button flex min-h-24 items-center gap-3 border-2 p-4 text-left ${selected ? "border-[#4F8EF7] bg-blue-50 ring-4 ring-blue-100" : "border-slate-100 bg-white hover:border-blue-100"}`}><span className={`grid size-11 shrink-0 place-items-center rounded-xl ${selected ? "bg-[#4F8EF7] text-white" : "bg-slate-100 text-slate-500"}`}>{icon}</span><span><strong className="block text-sm">{title}</strong><span className="mt-1 block text-xs font-semibold text-slate-500">{description}</span></span></button>;
}

function ToggleChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={`flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-extrabold transition ${active ? "bg-[#24324A] text-white" : "bg-slate-100 text-slate-500"}`}>{children}</button>;
}
