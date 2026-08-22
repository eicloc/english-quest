"use client";

import { motion } from "framer-motion";
import { Award, Star } from "lucide-react";
import { stageById } from "@/content/stages";
import { avatars } from "@/content/vocabulary";
import type { AssessmentReport, AssessmentSession } from "@/features/assessment/types";

export function StudentRewardView({ session, report }: { session: AssessmentSession; report: AssessmentReport }) {
  const avatar = avatars.find((item) => item.id === session.avatarId);
  const encouragement = report.firstTryAccuracy >= 75 ? ["Great listening!", "你的英语小耳朵很厉害！"] : report.completedCount >= 15 ? ["You were brave today!", "今天你勇敢地完成了英语冒险！"] : ["Keep exploring!", "继续探索，你会越来越棒！"];
  return (
    <section className="print-panel paper-panel relative overflow-hidden rounded-[36px] p-6 text-center sm:p-10" aria-labelledby="reward-title">
      <div className="absolute -left-10 -top-10 size-44 rounded-full bg-[#DFF3FF]" /><div className="absolute -bottom-16 -right-10 size-52 rounded-full bg-[#FFF0B8]" />
      <div className="relative">
        <motion.div animate={session.settings.reducedMotion ? undefined : { y: [0, -8, 0], rotate: [0, 2, -2, 0] }} transition={{ duration: 3, repeat: Infinity }} className="mx-auto grid size-32 place-items-center rounded-full bg-white text-7xl shadow-xl ring-8 ring-[#FFF0B8]" aria-label={avatar?.label}>{avatar?.emoji ?? "⭐"}</motion.div>
        <p className="mt-7 text-sm font-black uppercase tracking-[0.2em] text-[#4F8EF7]">Adventure complete!</p>
        <h1 id="reward-title" className="mt-2 text-4xl font-black sm:text-6xl">英语冒险完成啦！</h1>
        <p className="mt-4 text-xl font-bold text-slate-500">{session.studentName}，你找到了今天的冒险宝箱</p>
        <motion.div initial={session.settings.reducedMotion ? false : { scale: 0.7 }} animate={{ scale: 1 }} className="mx-auto mt-7 flex w-fit items-center gap-3 rounded-[24px] bg-[#24324A] px-7 py-4 text-white shadow-xl"><Star className="size-8 fill-[#FFD86B] text-[#FFD86B]" /><span className="text-4xl font-black">{report.totalStars}</span><span className="text-sm font-bold text-blue-100">颗<br />冒险星</span></motion.div>
        <div className="mx-auto mt-8 flex max-w-4xl flex-wrap justify-center gap-3">{session.badges.map((stageId) => { const stage = stageById[stageId]; if (!stage) return null; return <div key={stageId} className="min-w-28 rounded-2xl border border-white bg-white/80 p-3 shadow-sm"><span className="text-3xl">{stage.icon}</span><strong className="mt-1 block text-xs">{stage.titleZh}</strong><span className="mt-1 flex items-center justify-center gap-1 text-[11px] font-bold text-amber-600"><Award className="size-3" />参与徽章</span></div>; })}</div>
        <div className="mx-auto mt-8 max-w-xl rounded-3xl bg-emerald-50 p-6"><strong className="text-2xl text-emerald-800">{encouragement[0]}</strong><p className="mt-2 font-bold text-emerald-700">{encouragement[1]}</p></div>
      </div>
    </section>
  );
}
