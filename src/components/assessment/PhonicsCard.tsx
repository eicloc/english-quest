"use client";

import { motion } from "framer-motion";
import { Eye, FlaskConical } from "lucide-react";
import { useState } from "react";
import type { ManualScore } from "@/features/assessment/types";
import { DualAccentAudioButtons } from "@/components/speech/DualAccentAudioButtons";
import { DualIpa } from "@/components/dictionary/DualIpa";
import { ManualScoreButtons } from "./ManualScoreButtons";

// Exemplar words avoid the extra schwa in synthetic cues such as "buh" and
// keep short vowels in an unambiguous phonics context.
const phonicsExamples: Record<string, string> = {
  a: "apple",
  b: "ball",
  c: "cat",
  d: "dog",
  e: "egg",
  g: "goat",
  h: "hat",
  i: "insect",
  l: "leg",
  m: "map",
  o: "octopus",
  p: "pig",
  s: "sun",
  t: "top",
};

export function PhonicsCard({ word, isPseudoWord, score, soundEnabled, answerRevealed, onScore, onReveal }: { word: string; isPseudoWord: boolean; score?: ManualScore; soundEnabled: boolean; answerRevealed: boolean; onScore: (score: ManualScore) => void; onReveal: () => void }) {
  const [activeLetter, setActiveLetter] = useState<string>();
  const activeExample = activeLetter ? phonicsExamples[activeLetter.split("-")[0]] : undefined;
  return (
    <div className="mx-auto max-w-2xl">
      {isPseudoWord && <div className="mb-5 rounded-2xl bg-[#E9DEFF] p-4 font-black text-violet-800"><FlaskConical className="mr-2 inline size-5" />These are magic words!<span className="mt-1 block text-sm">这些是魔法单词，不需要中文意思。</span></div>}
      <div className="flex justify-center gap-3">{word.split("").map((letter, index) => {
        const example = phonicsExamples[letter] ?? letter;
        const active = activeLetter === `${letter}-${index}`;
        return <motion.button key={`${letter}-${index}`} type="button" whileTap={{ scale: 0.92 }} animate={{ y: active ? -5 : 0, scale: active ? 1.05 : 1 }} onClick={() => setActiveLetter(`${letter}-${index}`)} className={`game-button grid size-20 place-items-center bg-white text-5xl font-black lowercase shadow-lg ring-2 sm:size-24 sm:text-6xl ${active ? "ring-amber-300" : "ring-blue-100"}`} aria-label={`选择 ${letter} 的发音示例 ${example}`}>{letter}</motion.button>;
      })}</div>
      {activeExample && <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} role="status" className="mt-4"><p className="mb-2 text-sm font-black text-[#356FD1]">听单词开头的声音：{activeExample}</p><DualIpa word={activeExample} compact /><div className="mt-3"><DualAccentAudioButtons text={activeExample} enabled={soundEnabled} purpose="phonics" rate={0.68} compact /></div></motion.div>}
      <div className="mt-6">{!answerRevealed ? <button type="button" onClick={onReveal} className="game-button inline-flex items-center gap-2 bg-blue-50 px-5 text-[#356FD1]"><Eye className="size-5" />显示完整读音</button> : <><DualIpa word={word} /><div className="mt-3"><DualAccentAudioButtons text={word} enabled={soundEnabled} purpose="phonics" rate={0.68} /></div></>}</div>
      <div className="mx-auto mt-7 max-w-xl text-left"><ManualScoreButtons value={score} onChange={onScore} /></div>
    </div>
  );
}
