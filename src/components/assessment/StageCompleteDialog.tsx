"use client";

import { motion } from "framer-motion";
import { ArrowRight, Award } from "lucide-react";
import type { StageDefinition } from "@/features/assessment/types";

export function StageCompleteDialog({ stage, reducedMotion, finalStage, onContinue }: { stage: StageDefinition; reducedMotion: boolean; finalStage: boolean; onContinue: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/30 p-4 backdrop-blur-sm"><motion.section role="dialog" aria-modal="true" aria-labelledby="stage-complete-title" initial={reducedMotion ? false : { opacity: 0, y: 24, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="paper-panel w-full max-w-lg rounded-[32px] p-8 text-center"><motion.div animate={reducedMotion ? undefined : { rotate: [0, -7, 7, 0], scale: [1, 1.08, 1] }} className="mx-auto grid size-24 place-items-center rounded-full text-6xl" style={{ backgroundColor: stage.accent }}>{stage.icon}</motion.div><span className="mt-5 inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-black text-amber-700"><Award className="size-4" />参与徽章已获得</span><h2 id="stage-complete-title" className="mt-4 text-3xl font-black">Stage complete!</h2><p className="mt-2 text-lg font-bold text-slate-500">{stage.titleZh}完成啦，每一次尝试都很棒！</p><button type="button" onClick={onContinue} className="game-button primary-button mt-7 inline-flex items-center gap-2 px-7">{finalStage ? "打开冒险宝箱" : "返回地图，继续出发"}<ArrowRight className="size-5" /></button></motion.section></div>
  );
}
