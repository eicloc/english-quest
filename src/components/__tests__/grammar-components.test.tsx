import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GrammarQuestionRenderer } from "@/components/grammar/GrammarQuestionRenderer";
import { grammarQuestionById } from "@/content/grammar/questions";

describe("grammar question interactions", () => {
  it("submits a selected gap answer", () => {
    const question = grammarQuestionById["be-i-am"];
    const onSubmit = vi.fn();
    render(<GrammarQuestionRenderer question={question} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole("button", { name: "am" }));
    expect(onSubmit).toHaveBeenCalledWith({ type: "choice-gap", answer: "am" });
  });

  it("builds and submits a sentence by tapping tokens", () => {
    const question = grammarQuestionById["be-sort-ready"];
    const onSubmit = vi.fn();
    render(<GrammarQuestionRenderer question={question} onSubmit={onSubmit} />);
    for (const token of ["I", "am", "ready."]) fireEvent.click(screen.getByRole("button", { name: new RegExp(`${token.replace(".", "\\.")}$`) }));
    fireEvent.click(screen.getByRole("button", { name: "检查答案" }));
    expect(onSubmit).toHaveBeenCalledWith({ type: "sentence-sort", tokens: ["I", "am", "ready."] });
  });

  it("connects and submits all matching pairs", () => {
    const question = grammarQuestionById["pronoun-match-person"];
    if (question.type !== "pair-match") throw new Error("expected pair match");
    const onSubmit = vi.fn();
    render(<GrammarQuestionRenderer question={question} onSubmit={onSubmit} />);
    question.leftItems.forEach((left, index) => {
      fireEvent.click(screen.getByRole("button", { name: left.label }));
      fireEvent.click(screen.getByRole("button", { name: question.rightItems[index].label }));
    });
    fireEvent.click(screen.getByRole("button", { name: "检查答案" }));
    expect(onSubmit).toHaveBeenCalledWith({ type: "pair-match", pairs: question.correctPairs });
  });

  it("assigns category cards using the click fallback", () => {
    const question = grammarQuestionById["pronoun-category-number"];
    if (question.type !== "category-sort") throw new Error("expected category sort");
    const onSubmit = vi.fn();
    render(<GrammarQuestionRenderer question={question} onSubmit={onSubmit} />);
    question.items.forEach((item) => {
      const category = question.categories.find((candidate) => candidate.id === question.correctCategories[item.id])!;
      fireEvent.click(screen.getByRole("button", { name: item.label }));
      fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${category.label}`) }));
    });
    fireEvent.click(screen.getByRole("button", { name: "检查答案" }));
    expect(onSubmit).toHaveBeenCalledWith({ type: "category-sort", categories: question.correctCategories });
  });
});
