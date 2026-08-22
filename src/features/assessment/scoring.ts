import { questions, questionById } from "@/content/questions";
import type {
  AssessmentQuestion,
  AssessmentReport,
  AssessmentSession,
  QuestionAttempt,
  SkillDimension,
  SkillResult,
} from "./types";

export const skillLabels: Record<SkillDimension, string> = {
  listening: "听力理解",
  vocabulary: "基础词汇",
  speaking: "主动表达",
  sceneComprehension: "场景理解",
  wordRecognition: "单词认读",
  phonics: "自然拼读",
  sentenceComprehension: "句子理解",
};

export function scoreAutomatic(isCorrect: boolean, attemptNumber: number): 0 | 1 | 2 {
  if (!isCorrect) return 0;
  return attemptNumber <= 1 ? 2 : 1;
}

export function scoreAttempt(attempt: QuestionAttempt, question: AssessmentQuestion): number {
  if (attempt.skipped) return 0;
  if (question.type === "word-reading-manual") {
    return (attempt.wordScores?.pronunciation ?? 0) + (attempt.wordScores?.meaning ?? 0);
  }
  if (question.type === "oral-manual" || question.type === "phonics-manual") {
    return attempt.manualScore ?? 0;
  }
  if (attempt.answerRevealed) return 0;
  return scoreAutomatic(Boolean(attempt.isCorrect), attempt.attempts);
}

export function maxQuestionScore(question: AssessmentQuestion): number {
  return question.type === "word-reading-manual" ? 4 : 2;
}

export function getTotalStars(session: AssessmentSession): number {
  return session.attempts.reduce((sum, attempt) => {
    const question = questionById[attempt.questionId];
    return question ? sum + scoreAttempt(attempt, question) : sum;
  }, 0);
}

function getLevel(percentage: number | undefined): SkillResult["level"] {
  if (percentage === undefined) return "数据不足";
  if (percentage >= 85) return "基础较好";
  if (percentage >= 65) return "具备基础";
  if (percentage >= 40) return "需要巩固";
  return "建议从启蒙开始";
}

export function calculateSkillResults(session: AssessmentSession): SkillResult[] {
  const skills = Object.keys(skillLabels) as SkillDimension[];
  return skills.map((skill) => {
    const evidence = session.attempts.filter((attempt) => {
      const question = questionById[attempt.questionId];
      return question?.skill === skill && Boolean(attempt.completedAt || attempt.skipped);
    });
    const earned = evidence.reduce((sum, attempt) => {
      const question = questionById[attempt.questionId];
      return question ? sum + scoreAttempt(attempt, question) : sum;
    }, 0);
    const possible = evidence.reduce((sum, attempt) => {
      const question = questionById[attempt.questionId];
      return question ? sum + maxQuestionScore(question) : sum;
    }, 0);
    const percentage = possible > 0 ? Math.round((earned / possible) * 100) : undefined;
    return {
      skill,
      earned,
      possible,
      percentage,
      level: getLevel(percentage),
      evidenceQuestionIds: evidence.map((attempt) => attempt.questionId),
    };
  });
}

function resultOf(results: SkillResult[], skill: SkillDimension) {
  return results.find((result) => result.skill === skill)?.percentage;
}

export function buildRecommendations(results: SkillResult[]): string[] {
  const recommendations: string[] = [];
  const listening = resultOf(results, "listening");
  const vocabulary = resultOf(results, "vocabulary");
  const speaking = resultOf(results, "speaking");
  const reading = resultOf(results, "wordRecognition");
  const phonics = resultOf(results, "phonics");
  const sentence = resultOf(results, "sentenceComprehension");

  if (listening !== undefined && listening < 60) recommendations.push("多进行“听单词点图片”和简短课堂指令训练，每次5分钟即可。");
  if (vocabulary !== undefined && vocabulary < 60) recommendations.push("先巩固动物、水果、颜色、数字和学习用品等高频主题词。");
  if (reading !== undefined && reading < 60 && (listening ?? 0) >= 60) recommendations.push("孩子听得懂但看到单词不够稳定，建议加强音形对应和高频词认读。");
  if (phonics !== undefined && phonics < 60) recommendations.push("从字母音和简单CVC单词开始，每次练习5～8个，并逐步尝试假词。");
  if (sentence !== undefined && sentence < 60 && (vocabulary ?? reading ?? 0) >= 60) recommendations.push("孩子可能认识单词但组合句意较慢，建议增加简单句型和看图阅读。");
  if (speaking !== undefined && speaking < 60) recommendations.push("先允许孩子用单词和短语回答，再自然过渡到完整短句。");
  if (recommendations.length === 0) recommendations.push("继续保持轻松输入，每周用图片、儿歌和短句复习已掌握内容。");
  return recommendations;
}

export function buildReport(session: AssessmentSession): AssessmentReport {
  const completedAttempts = session.attempts.filter((attempt) => attempt.completedAt || attempt.skipped);
  const automaticAttempts = completedAttempts.filter((attempt) => {
    const type = questionById[attempt.questionId]?.type;
    return type === "audio-image-choice" || type === "scene-hotspot" || type === "single-choice" || type === "sentence-choice";
  });
  const firstTryCorrect = automaticAttempts.filter((attempt) => attempt.isCorrect && attempt.attempts === 1).length;
  const endTime = session.completedAt ? new Date(session.completedAt).getTime() : Date.now();
  const skillResults = calculateSkillResults(session);
  const unstableWords = completedAttempts
    .filter((attempt) => {
      const question = questionById[attempt.questionId];
      return question && scoreAttempt(attempt, question) < maxQuestionScore(question);
    })
    .map((attempt) => {
      const question = questionById[attempt.questionId];
      if (!question) return attempt.questionId;
      if (question.type === "word-reading-manual" || question.type === "phonics-manual") return question.word;
      return question.promptEn;
    });

  return {
    totalStars: getTotalStars(session),
    durationMs: Math.max(0, endTime - new Date(session.createdAt).getTime()),
    completedCount: completedAttempts.length,
    firstTryAccuracy: automaticAttempts.length ? Math.round((firstTryCorrect / automaticAttempts.length) * 100) : 0,
    hintCount: completedAttempts.filter((attempt) => attempt.hintUsed).length,
    skippedCount: completedAttempts.filter((attempt) => attempt.skipped).length,
    skillResults,
    recommendations: buildRecommendations(skillResults),
    unstableWords: Array.from(new Set(unstableWords)).slice(0, 12),
  };
}

export function getQuestionCountForMode(mode: AssessmentSession["mode"]) {
  return questions.filter((question) => question.enabledInModes.includes(mode)).length;
}
