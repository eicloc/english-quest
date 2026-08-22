"use client";

import type { ComponentType } from "react";
import { sceneById } from "@/content/scenes";
import type { AssessmentQuestion, AssessmentSettings, ManualScore, QuestionAttempt, QuestionType, WordReadingScores } from "@/features/assessment/types";
import { AnswerPronunciation } from "./AnswerPronunciation";
import { ManualScoreButtons } from "./ManualScoreButtons";
import { PhonicsCard } from "./PhonicsCard";
import { PictureChoiceGrid } from "./PictureChoiceGrid";
import { SceneViewer } from "./SceneViewer";
import { WordReadingCard } from "./WordReadingCard";

type RendererProps = {
  question: AssessmentQuestion;
  attempt?: QuestionAttempt;
  settings: AssessmentSettings;
  interactionLocked?: boolean;
  onAutoSelect: (optionId: string) => void;
  onSceneSelect: (hotspotId: string) => void;
  onBlankScene: () => void;
  onManualScore: (score: ManualScore) => void;
  onWordScore: (field: keyof WordReadingScores, score: ManualScore) => void;
  onReveal: () => void;
};

function OralRenderer({ question, attempt, onManualScore }: RendererProps) {
  if (question.type !== "oral-manual") return null;
  return <div className="mx-auto max-w-xl text-left"><p className="mb-5 text-center font-bold text-slate-500">Listen, think, and answer in your own way.</p><ManualScoreButtons value={attempt?.manualScore} onChange={onManualScore} /></div>;
}

function ChoiceRenderer({ question, attempt, settings, interactionLocked, onAutoSelect }: RendererProps) {
  if (question.type !== "audio-image-choice" && question.type !== "single-choice" && question.type !== "sentence-choice") return null;
  const scene = question.sceneId ? sceneById[question.sceneId] : undefined;
  const answerRevealed = Boolean(attempt?.answerRevealed || (attempt?.completedAt && !attempt.isCorrect));
  return <div className="space-y-5">{scene && <SceneViewer scene={scene} disabled debug={false} targetHotspotId={undefined} onSelect={() => undefined} onBlank={() => undefined} />}<PictureChoiceGrid options={question.options} selectedOptionIds={attempt?.selectedOptionIds} correctOptionId={question.correctOptionId} answerRevealed={answerRevealed} answerFinalized={Boolean(attempt?.completedAt)} hideTextUntilAnswer={question.type !== "single-choice"} disabled={Boolean(attempt?.completedAt || interactionLocked)} reducedMotion={settings.reducedMotion} onSelect={onAutoSelect} /></div>;
}

function SceneRenderer({ question, attempt, settings, interactionLocked, onSceneSelect, onBlankScene }: RendererProps) {
  if (question.type !== "scene-hotspot") return null;
  const scene = sceneById[question.sceneId];
  if (!scene) return <div className="rounded-2xl bg-amber-50 p-6 font-bold text-amber-800">场景素材暂时不可用，请老师跳过本题。</div>;
  const selectedHotspotId = attempt?.selectedOptionIds.at(-1);
  const selectedHotspot = scene.hotspots.find((hotspot) => hotspot.id === selectedHotspotId);
  const correctHotspot = scene.hotspots.find((hotspot) => hotspot.id === question.hotspotId);
  const answerFinalized = Boolean(attempt?.completedAt || attempt?.answerRevealed);
  const showSeparateCorrect = answerFinalized && selectedHotspot?.id !== correctHotspot?.id;
  return <div><SceneViewer scene={scene} debug={settings.hotspotDebug} disabled={Boolean(attempt?.completedAt || interactionLocked)} targetHotspotId={question.hotspotId} selectedHotspotId={selectedHotspotId} answerRevealed={answerFinalized} onSelect={onSceneSelect} onBlank={onBlankScene} />{(selectedHotspot?.pronunciationWord || (showSeparateCorrect && correctHotspot?.pronunciationWord)) && <div className="mx-auto mt-4 grid max-w-xl gap-2 sm:grid-cols-2">{selectedHotspot?.pronunciationWord && <AnswerPronunciation word={selectedHotspot.pronunciationWord} correct={answerFinalized && selectedHotspot.id === correctHotspot?.id} />}{showSeparateCorrect && correctHotspot?.pronunciationWord && <AnswerPronunciation word={correctHotspot.pronunciationWord} correct />}</div>}</div>;
}

function WordRenderer({ question, attempt, settings, onWordScore, onReveal }: RendererProps) {
  if (question.type !== "word-reading-manual") return null;
  return <WordReadingCard word={question.word} scores={attempt?.wordScores} answerRevealed={Boolean(attempt?.answerRevealed)} soundEnabled={settings.soundEnabled} onScore={onWordScore} onReveal={onReveal} />;
}

function PhonicsRenderer({ question, attempt, settings, onManualScore, onReveal }: RendererProps) {
  if (question.type !== "phonics-manual") return null;
  return <PhonicsCard word={question.word} isPseudoWord={question.isPseudoWord} score={attempt?.manualScore} soundEnabled={settings.soundEnabled} answerRevealed={Boolean(attempt?.answerRevealed)} onScore={onManualScore} onReveal={onReveal} />;
}

const questionRenderers: Record<QuestionType, ComponentType<RendererProps>> = {
  "oral-manual": OralRenderer,
  "audio-image-choice": ChoiceRenderer,
  "scene-hotspot": SceneRenderer,
  "single-choice": ChoiceRenderer,
  "word-reading-manual": WordRenderer,
  "phonics-manual": PhonicsRenderer,
  "sentence-choice": ChoiceRenderer,
};

export function QuestionRenderer(props: RendererProps) {
  const Renderer = questionRenderers[props.question.type];
  return <Renderer {...props} />;
}
