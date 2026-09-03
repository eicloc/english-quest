"use client";

import { motion } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";
import type { GrammarStageDefinition } from "@/features/grammar/types";

export function GrammarStageCompleteDialog({ stage, percentage, finalStage, reducedMotion, onContinue }: { stage: GrammarStageDefinition; percentage: number; finalStage: boolean; reducedMotion: boolean; onContinue: () => void }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/30 p-4 backdrop-blur-sm"><motion.section role="dialog" aria-modal="true" aria-labelledby="grammar-stage-complete" initial={reducedMotion ? false : { opacity: 0, y: 20, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="paper-panel w-full max-w-lg rounded-[32px] p-8 text-center"><div className="mx-auto grid size-24 place-items-center rounded-full text-6xl" style={{ backgroundColor: stage.accent }}>{stage.icon}</div><span className={`mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black ${percentage >= 80 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}><Star className="size-4 fill-current" />{percentage >= 80 ? "本关已掌握" : "已完成 · 之后再来巩固"}</span><h2 id="grammar-stage-complete" className="mt-4 text-3xl font-black">{stage.titleZh}完成！</h2><p className="mt-2 text-lg font-bold text-slate-500">本关掌握度 {percentage}%</p><button type="button" onClick={onContinue} className="game-button mt-7 inline-flex items-center gap-2 bg-violet-600 px-7 text-white shadow-[0_7px_0_#6D28D9]">{finalStage ? "整理冒险结果" : "返回地图，继续出发"}<ArrowRight className="size-5" /></button></motion.section></div>;
}
