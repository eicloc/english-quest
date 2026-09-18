import sourceData from "./source-data.json";
import type { SentenceFamily, SentenceTraining } from "@/features/sentence-battle/types";

export const sentenceFamilies: SentenceFamily[] = ["Is", "Are", "Can", "Do", "Does"];

export const sentenceTrainings: SentenceTraining[] = sourceData.map((source) => ({
  id: source.id,
  family: source.family as SentenceFamily,
  title: source.title,
  sourceFile: source.sourceFile,
  kind: "a" in source.items[0] ? "answer-choice" : "question-sort",
  questions: source.items.map((item, index) => {
    const sentence = "q" in item ? item.q : item.sentence;
    const answer = "a" in item ? item.a : undefined;
    const hint = sentence.match(/\s*\((yes|no)\)\s*$/i);
    return {
      id: `${source.id}-${index + 1}`,
      question: sentence.replace(/\s*\((yes|no)\)\s*$/i, ""),
      emoji: item.emoji,
      answer,
      polarity: answer ? (answer.startsWith("Yes") ? "yes" : "no") : hint ? (hint[1].toLowerCase() as "yes" | "no") : undefined,
    };
  }),
}));

export function findSentenceTraining(id: string | null) {
  return sentenceTrainings.find((training) => training.id === id);
}
