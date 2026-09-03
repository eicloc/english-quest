import { grammarQuestionById } from "@/content/grammar/questions";
import { getGrammarAnswerText, getGrammarResponseText } from "./evaluator";
import type { GrammarAttempt, GrammarReport, GrammarSession, GrammarSkill, GrammarSkillResult } from "./types";

export const grammarSkillLabels: Record<GrammarSkill, string> = {
  pronouns: "人称与数量",
  beAgreement: "Be 动词搭配",
  nounNumber: "名词单复数",
  demonstratives: "指示词",
  thereBe: "There be 句型",
  haveHas: "Have/Has",
  thirdPersonVerbs: "第三人称单数",
  negatives: "否定句",
  questions: "疑问句",
};

export function scoreGrammarAttempt(attempt: GrammarAttempt | undefined): 0 | 1 | 2 {
  if (!attempt?.isCorrect) return 0;
  return attempt.attempts <= 1 ? 2 : 1;
}

export function buildReviewOrder(session: GrammarSession, limit = 12) {
  const position = new Map(Object.values(session.questionOrder).flat().map((id, index) => [id, index]));
  return session.attempts
    .filter((attempt) => attempt.completedAt && !attempt.firstTryCorrect)
    .sort((a, b) => scoreGrammarAttempt(a) - scoreGrammarAttempt(b) || (position.get(a.questionId) ?? 0) - (position.get(b.questionId) ?? 0))
    .map((attempt) => attempt.questionId)
    .slice(0, limit);
}

function statusFor(percentage: number | undefined): GrammarSkillResult["status"] {
  if (percentage === undefined) return "暂无数据";
  if (percentage >= 80) return "已掌握";
  if (percentage >= 60) return "继续练习";
  return "重点巩固";
}

export function buildGrammarReport(session: GrammarSession): GrammarReport {
  const completed = session.attempts.filter((attempt) => attempt.completedAt);
  const skills = Object.keys(grammarSkillLabels) as GrammarSkill[];
  const skillResults = skills.map((skill) => {
    const evidence = completed.filter((attempt) => grammarQuestionById[attempt.questionId]?.skill === skill);
    const earned = evidence.reduce((sum, attempt) => sum + scoreGrammarAttempt(attempt), 0);
    const possible = evidence.length * 2;
    const percentage = possible ? Math.round((earned / possible) * 100) : undefined;
    return { skill, earned, possible, percentage, status: statusFor(percentage), evidenceQuestionIds: evidence.map((attempt) => attempt.questionId) };
  });
  const reviewCompleted = session.reviewAttempts.filter((attempt) => attempt.completedAt);
  const mistakes = completed.filter((attempt) => !attempt.firstTryCorrect).flatMap((attempt) => {
    const question = grammarQuestionById[attempt.questionId];
    return question ? [{ questionId: question.id, prompt: question.type === "choice-gap" ? question.stem : question.promptZh, response: getGrammarResponseText(question, attempt.responses[0]), answer: getGrammarAnswerText(question), explanation: question.explanationZh }] : [];
  }).slice(0, 12);

  return {
    totalStars: [...completed, ...reviewCompleted].reduce((sum, attempt) => sum + scoreGrammarAttempt(attempt), 0),
    completedCount: completed.length,
    firstTryAccuracy: completed.length ? Math.round((completed.filter((attempt) => attempt.firstTryCorrect).length / completed.length) * 100) : 0,
    finalAccuracy: completed.length ? Math.round((completed.filter((attempt) => attempt.isCorrect).length / completed.length) * 100) : 0,
    reviewAccuracy: reviewCompleted.length ? Math.round((reviewCompleted.filter((attempt) => attempt.isCorrect).length / reviewCompleted.length) * 100) : undefined,
    skillResults,
    weakRules: skillResults.filter((result) => result.percentage !== undefined && result.percentage < 80).sort((a, b) => (a.percentage ?? 0) - (b.percentage ?? 0)).map((result) => grammarSkillLabels[result.skill]),
    mistakes,
  };
}
