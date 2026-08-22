import type { ReactNode } from "react";
import { AudioPromptButton } from "./AudioPromptButton";

export function QuestionShell({ questionNumber, totalQuestions, promptEn, promptZh, audioText, soundEnabled, hintVisible, children }: { questionNumber: number; totalQuestions: number; promptEn: string; promptZh?: string; audioText?: string; soundEnabled: boolean; hintVisible: boolean; children: ReactNode }) {
  return (
    <div className="m-auto w-full max-w-5xl py-5 text-center">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#4F8EF7]">Question {questionNumber} / {totalQuestions}</p>
      <h1 className="mx-auto mt-4 max-w-4xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">{promptEn}</h1>
      {hintVisible && promptZh && <p className="mt-3 text-lg font-bold text-slate-500">{promptZh}</p>}
      {audioText && <div className="mt-5"><AudioPromptButton text={audioText} enabled={soundEnabled} /></div>}
      <div className="mt-7">{children}</div>
    </div>
  );
}
