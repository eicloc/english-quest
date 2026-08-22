"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { Check, ImageOff, X } from "lucide-react";
import { useState } from "react";
import type { QuestionOption } from "@/features/assessment/types";
import { withBasePath } from "@/lib/base-path";
import { AnswerPronunciation } from "./AnswerPronunciation";

type PictureChoiceGridProps = {
  options: QuestionOption[];
  selectedOptionIds?: string[];
  correctOptionId: string;
  answerRevealed?: boolean;
  answerFinalized?: boolean;
  hideTextUntilAnswer?: boolean;
  disabled?: boolean;
  reducedMotion?: boolean;
  onSelect: (optionId: string) => void;
};

export function PictureChoiceGrid({ options, selectedOptionIds = [], correctOptionId, answerRevealed = false, answerFinalized = false, hideTextUntilAnswer = false, disabled = false, reducedMotion = false, onSelect }: PictureChoiceGridProps) {
  const columns = options.length === 4 ? "grid-cols-2 sm:grid-cols-4" : "sm:grid-cols-3";
  const selectedOptionId = selectedOptionIds.at(-1);
  return (
    <div className={`mx-auto grid w-full max-w-4xl gap-3 ${columns}`} role="group" aria-label="答案选项">
      {options.map((option, index) => {
        const selected = selectedOptionId === option.id;
        const showCorrect = (answerRevealed || answerFinalized) && option.id === correctOptionId;
        const showIncorrect = selected && option.id !== correctOptionId;
        const showOptionText = !hideTextUntilAnswer || answerRevealed || answerFinalized || selected;
        const showPronunciation = Boolean(option.pronunciationWord && (selected || showCorrect));
        return (
          <motion.button
            key={option.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(option.id)}
            aria-label={hideTextUntilAnswer && !showOptionText ? `图片选项 ${index + 1}` : option.alt}
            aria-pressed={selected}
            initial={false}
            animate={reducedMotion ? undefined : showIncorrect ? { x: [0, -7, 7, -4, 4, 0], scale: 1 } : { x: 0, scale: selected ? 1.025 : 1 }}
            whileHover={!disabled && !reducedMotion ? { y: -4, scale: 1.015 } : undefined}
            whileTap={!disabled && !reducedMotion ? { scale: 0.96 } : undefined}
            transition={{ duration: showIncorrect ? 0.35 : 0.18 }}
            className={`game-button relative min-h-32 overflow-hidden border-2 p-4 sm:min-h-40 ${showCorrect ? "border-emerald-400 bg-emerald-50 ring-4 ring-emerald-100" : showIncorrect ? "border-rose-300 bg-rose-50 ring-4 ring-rose-100" : selected ? "border-amber-300 bg-amber-50 ring-4 ring-amber-100" : "border-slate-100 bg-white hover:border-blue-200 hover:bg-blue-50"} disabled:cursor-default`}
          >
            <AnimatePresence>
              {showCorrect && <motion.span initial={reducedMotion ? false : { scale: 0, rotate: -25 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} className="absolute right-2 top-2 z-20 grid size-7 place-items-center rounded-full bg-emerald-500 text-white"><Check className="size-4" /></motion.span>}
              {showIncorrect && <motion.span initial={reducedMotion ? false : { scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute right-2 top-2 z-20 grid size-7 place-items-center rounded-full bg-rose-500 text-white"><X className="size-4" /></motion.span>}
            </AnimatePresence>
            <OptionVisual option={option} reducedMotion={reducedMotion} />
            {showOptionText && option.label && <motion.strong initial={hideTextUntilAnswer && !reducedMotion ? { opacity: 0, y: 4 } : false} animate={{ opacity: 1, y: 0 }} className="mt-3 block whitespace-pre-line text-sm sm:text-base">{option.label}</motion.strong>}
            {showOptionText && option.zh && <span className="mt-1 block text-xs font-bold text-slate-400">{option.zh}</span>}
            {showPronunciation && option.pronunciationWord && <AnswerPronunciation word={option.pronunciationWord} correct={showCorrect} />}
          </motion.button>
        );
      })}
    </div>
  );
}

function OptionVisual({ option, reducedMotion }: { option: QuestionOption; reducedMotion: boolean }) {
  const [failed, setFailed] = useState(false);
  if (option.illustration) return <CatTableIllustration relation={option.illustration} reducedMotion={reducedMotion} />;
  if (option.imageSrc && !failed) return <span className="relative mx-auto block size-20 overflow-hidden rounded-2xl sm:size-24"><Image src={withBasePath(option.imageSrc)} alt={option.alt} fill sizes="96px" className="object-contain" onError={() => setFailed(true)} /></span>;
  if (option.emoji) return <motion.span initial={false} animate={reducedMotion ? undefined : { scale: [1, 1.04, 1] }} transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 1.4 }} className="block whitespace-pre-line text-4xl leading-tight sm:text-5xl" aria-hidden="true">{option.emoji}</motion.span>;
  return <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-slate-100 text-slate-400"><ImageOff className="size-7" /></span>;
}

function CatTableIllustration({ relation, reducedMotion }: { relation: NonNullable<QuestionOption["illustration"]>; reducedMotion: boolean }) {
  const catPosition = relation === "cat-under-table" ? "left-1/2 top-10 -translate-x-1/2" : relation === "cat-on-table" ? "left-1/2 top-0 -translate-x-1/2" : "bottom-1 left-1";
  const tablePosition = relation === "cat-under-table" ? "inset-x-2 top-3" : relation === "cat-on-table" ? "inset-x-2 top-14" : "right-0 top-4 w-[68%]";
  return (
    <span className="relative mx-auto block h-24 w-32" aria-hidden="true" data-illustration={relation}>
      <span className={`absolute h-3 ${tablePosition}`}>
        <span className="absolute inset-0 rounded-md bg-amber-700 shadow-sm" />
        <span className="absolute left-2 top-2 h-14 w-2 rounded-b bg-amber-800" />
        <span className="absolute right-2 top-2 h-14 w-2 rounded-b bg-amber-800" />
      </span>
      <motion.span animate={reducedMotion ? undefined : { y: [0, -3, 0], rotate: [0, -2, 0, 2, 0] }} transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 0.8 }} className={`absolute z-10 text-4xl drop-shadow-sm ${catPosition}`}>🐱</motion.span>
    </span>
  );
}
