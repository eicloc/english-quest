import { describe, expect, it } from "vitest";
import { cleanGeneratedSamples } from "@/features/speech/audio-processing";

describe("generated speech cleanup", () => {
  it("drops empty and inaudible model output", () => {
    expect(cleanGeneratedSamples(new Float32Array(), 1000)).toHaveLength(0);
    expect(cleanGeneratedSamples(new Float32Array(100).fill(0.001), 1000)).toHaveLength(0);
  });

  it("removes low-energy leading and trailing noise with fixed padding", () => {
    const input = new Float32Array(500).fill(0.001);
    input.fill(0.5, 100, 200);
    const cleaned = cleanGeneratedSamples(input, 1000);
    expect(cleaned).toHaveLength(240);
    expect(cleaned[20]).toBeCloseTo(0.5);
    expect(Math.abs(cleaned.at(-1) ?? 1)).toBeLessThan(0.001);
  });

  it("keeps a quieter final consonant attached to the main word", () => {
    const input = new Float32Array(400);
    input.fill(0.5, 80, 150);
    input.fill(0.05, 150, 220);
    const cleaned = cleanGeneratedSamples(input, 1000);
    expect(cleaned.some((value) => Math.abs(value - 0.05) < 0.0001)).toBe(true);
    expect(cleaned.length).toBeGreaterThanOrEqual(280);
  });

  it("keeps very short words and fades both exposed edges", () => {
    const input = new Float32Array(20).fill(0.4);
    const cleaned = cleanGeneratedSamples(input, 1000);
    expect(cleaned).toHaveLength(20);
    expect(cleaned[0]).toBeCloseTo(0.08);
    expect(cleaned[4]).toBeCloseTo(0.4);
    expect(cleaned.at(-1)).toBeCloseTo(0.08);
  });
});
