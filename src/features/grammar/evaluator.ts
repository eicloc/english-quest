import type { GrammarQuestion, GrammarResponse } from "./types";

function sameRecord(actual: Record<string, string>, expected: Record<string, string>) {
  const keys = Object.keys(expected);
  return keys.length === Object.keys(actual).length && keys.every((key) => actual[key] === expected[key]);
}

export function evaluateGrammarResponse(question: GrammarQuestion, response: GrammarResponse): boolean {
  if (question.type !== response.type) return false;
  switch (question.type) {
    case "choice-gap":
      return response.type === "choice-gap" && response.answer === question.correctAnswer;
    case "sentence-sort":
      return response.type === "sentence-sort" && response.tokens.length === question.correctOrder.length && response.tokens.every((token, index) => token === question.correctOrder[index]);
    case "pair-match":
      return response.type === "pair-match" && sameRecord(response.pairs, question.correctPairs);
    case "category-sort":
      return response.type === "category-sort" && sameRecord(response.categories, question.correctCategories);
  }
}

export function getGrammarAnswerText(question: GrammarQuestion): string {
  switch (question.type) {
    case "choice-gap":
      return question.stem.replace("___", question.correctAnswer);
    case "sentence-sort":
      return question.correctOrder.join(" ");
    case "pair-match":
      return question.leftItems.map((left) => `${left.label} → ${question.rightItems.find((right) => right.id === question.correctPairs[left.id])?.label ?? ""}`).join("；");
    case "category-sort":
      return question.categories.map((category) => `${category.label}：${question.items.filter((item) => question.correctCategories[item.id] === category.id).map((item) => item.label).join("、")}`).join("；");
  }
}

export function getGrammarResponseText(question: GrammarQuestion, response: GrammarResponse | undefined): string {
  if (!response || question.type !== response.type) return "未作答";
  switch (response.type) {
    case "choice-gap":
      return question.type === "choice-gap" ? question.stem.replace("___", response.answer) : response.answer;
    case "sentence-sort":
      return response.tokens.join(" ") || "未排列";
    case "pair-match":
      return question.type === "pair-match" ? question.leftItems.map((left) => `${left.label} → ${question.rightItems.find((right) => right.id === response.pairs[left.id])?.label ?? "?"}`).join("；") : "配对答案";
    case "category-sort":
      return question.type === "category-sort" ? question.categories.map((category) => `${category.label}：${question.items.filter((item) => response.categories[item.id] === category.id).map((item) => item.label).join("、") || "—"}`).join("；") : "分类答案";
  }
}
