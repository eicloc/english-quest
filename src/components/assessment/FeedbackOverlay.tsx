"use client";

import { AnimatePresence, motion } from "framer-motion";

export type FeedbackState = { kind: "correct" | "retry" | "revealed"; title: string; message: string } | null;

export function FeedbackOverlay({ feedback, reducedMotion }: { feedback: FeedbackState; reducedMotion: boolean }) {
  return (
    <AnimatePresence>{feedback && <motion.div role="status" aria-live="polite" initial={reducedMotion ? false : { opacity: 0, scale: 0.85, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94 }} className={`pointer-events-none fixed left-1/2 top-24 z-50 w-[min(90vw,420px)] -translate-x-1/2 rounded-[24px] border-2 bg-white p-5 text-center shadow-2xl ${feedback.kind === "correct" ? "border-emerald-200" : feedback.kind === "retry" ? "border-amber-200" : "border-blue-200"}`}><span className="text-4xl" aria-hidden="true">{feedback.kind === "correct" ? "⭐" : feedback.kind === "retry" ? "🌱" : "💡"}</span><strong className="mt-2 block text-xl">{feedback.title}</strong><span className="mt-1 block text-sm font-bold text-slate-500">{feedback.message}</span></motion.div>}</AnimatePresence>
  );
}
