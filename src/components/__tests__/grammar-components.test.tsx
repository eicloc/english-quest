import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GrammarQuestionRenderer } from "@/components/grammar/GrammarQuestionRenderer";
import { grammarQuestionById, grammarQuestions } from "@/content/grammar/questions";

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
    const leftGroup = screen.getByRole("group", { name: "左侧词卡" });
    const rightGroup = screen.getByRole("group", { name: "右侧词卡" });
    const rightLabels = within(rightGroup).getAllByRole("button").map((button) => button.textContent);

    question.leftItems.forEach((left, index) => {
      const correctRight = question.rightItems.find((item) => item.id === question.correctPairs[left.id])!;
      expect(rightLabels[index]).not.toBe(correctRight.label);
      fireEvent.click(within(leftGroup).getByRole("button", { name: left.label }));
      fireEvent.click(within(rightGroup).getByRole("button", { name: correctRight.label }));
    });
    fireEvent.click(screen.getByRole("button", { name: "检查答案" }));
    expect(onSubmit).toHaveBeenCalledWith({ type: "pair-match", pairs: question.correctPairs });
  });

  it("keeps every matching question's correct answers off the same row", () => {
    const matchingQuestions = grammarQuestions.filter((question) => question.type === "pair-match");
    expect(matchingQuestions).toHaveLength(20);

    for (const question of matchingQuestions) {
      const view = render(<GrammarQuestionRenderer question={question} onSubmit={vi.fn()} />);
      const rightLabels = within(screen.getByRole("group", { name: "右侧词卡" })).getAllByRole("button").map((button) => button.textContent);
      question.leftItems.forEach((left, index) => {
        const correctRight = question.rightItems.find((item) => item.id === question.correctPairs[left.id])!;
        expect(rightLabels[index]).not.toBe(correctRight.label);
      });
      view.unmount();
    }
  });

  it("keeps the shuffled matching order stable until the question is entered again", () => {
    const question = grammarQuestionById["plural-match-regular"];
    if (question.type !== "pair-match") throw new Error("expected pair match");
    const random = vi.spyOn(Math, "random");
    const view = render(<GrammarQuestionRenderer question={question} onSubmit={vi.fn()} />);
    const getRightOrder = () => within(screen.getByRole("group", { name: "右侧词卡" })).getAllByRole("button").map((button) => button.textContent);
    const firstOrder = getRightOrder();
    const callsAfterEntry = random.mock.calls.length;

    view.rerender(<GrammarQuestionRenderer question={question} onSubmit={vi.fn()} />);
    expect(getRightOrder()).toEqual(firstOrder);
    expect(random).toHaveBeenCalledTimes(callsAfterEntry);

    const firstLeft = question.leftItems[0];
    const firstRight = question.rightItems.find((item) => item.id === question.correctPairs[firstLeft.id])!;
    fireEvent.click(within(screen.getByRole("group", { name: "左侧词卡" })).getByRole("button", { name: firstLeft.label }));
    fireEvent.click(within(screen.getByRole("group", { name: "右侧词卡" })).getByRole("button", { name: firstRight.label }));
    fireEvent.click(screen.getByRole("button", { name: "重配" }));
    expect(getRightOrder()).toEqual(firstOrder);

    view.unmount();
    render(<GrammarQuestionRenderer question={question} onSubmit={vi.fn()} />);
    expect(random.mock.calls.length).toBeGreaterThan(callsAfterEntry);
    random.mockRestore();
  });

  it("shows semantic scene art only for questions configured with a visual", () => {
    const illustrated = grammarQuestionById["be-i-am"];
    const plain = grammarQuestionById["be-you-are"];
    const view = render(<GrammarQuestionRenderer question={illustrated} onSubmit={vi.fn()} />);
    expect(screen.getByRole("img", { name: "一个开心的小朋友" })).toBeInTheDocument();

    view.rerender(<GrammarQuestionRenderer question={plain} onSubmit={vi.fn()} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
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
