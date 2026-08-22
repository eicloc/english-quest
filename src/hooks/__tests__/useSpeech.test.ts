import { describe, expect, it } from "vitest";
import { pickEnglishVoice, prepareEnglishSpeech } from "@/hooks/useSpeech";

describe("English speech preparation", () => {
  it("uses the reduced article sound inside a sentence", () => {
    expect(prepareEnglishSpeech("I have a red ball.")).toBe("I have uh red ball.");
    expect(prepareEnglishSpeech("My mother is a teacher.")).toBe("My mother is uh teacher.");
  });

  it("does not rewrite a word or phonics cue", () => {
    expect(prepareEnglishSpeech("a", "word")).toBe("a");
    expect(prepareEnglishSpeech("apple", "word")).toBe("apple");
  });

  it("selects a voice matching the explicitly requested accent", () => {
    const american = { lang: "en-US", name: "American", localService: true } as SpeechSynthesisVoice;
    const british = { lang: "en-GB", name: "British", localService: true } as SpeechSynthesisVoice;
    expect(pickEnglishVoice([british, american], "en-US")).toBe(american);
    expect(pickEnglishVoice([american, british], "en-GB")).toBe(british);
  });

  it("never substitutes the opposite English accent", () => {
    const american = { lang: "en-US", name: "American", localService: true } as SpeechSynthesisVoice;
    const british = { lang: "en-GB", name: "British", localService: true } as SpeechSynthesisVoice;
    expect(pickEnglishVoice([british], "en-US")).toBeNull();
    expect(pickEnglishVoice([american], "en-GB")).toBeNull();
  });
});
