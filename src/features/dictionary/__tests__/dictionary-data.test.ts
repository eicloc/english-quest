import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { questions } from "@/content/questions";
import { getQuestPronunciation } from "@/content/quest-pronunciations";
import { scenes } from "@/content/scenes";
import type { DictionaryIndex, DictionaryPronunciationManifest, DictionaryShard } from "@/features/dictionary/types";

const dictionaryRoot = resolve(process.cwd(), "public/content/dictionary");
const index = readJson<DictionaryIndex>("index.json");
const entries = [..."abcdefghijklmnopqrstuvwxyz"]
  .flatMap((letter) => readJson<DictionaryShard>(`shards/${letter}.json`).entries)
  .concat(readJson<DictionaryShard>("shards/other.json").entries);

describe("generated NGSL dictionary", () => {
  it("contains the fixed NGSL 1.2 set exactly once across seven bands", () => {
    expect(index.schemaVersion).toBe(1);
    expect(index.ngslCount).toBe(2809);
    expect(index.count).toBe(2813);
    expect(index.items).toHaveLength(2813);
    expect(entries).toHaveLength(2813);
    expect(new Set(entries.map((entry) => entry.word)).size).toBe(2813);
    expect(entries.filter((entry) => entry.ngslRank > 0).every((entry) => entry.band >= 1 && entry.band <= 7)).toBe(true);
    expect(index.bands.map((item) => item.count)).toEqual([400, 400, 400, 400, 400, 400, 409]);
    expect(entries.find((entry) => entry.word === "apple")).toMatchObject({ ngslRank: 0, band: 0 });
  });

  it("covers equal, different and one-sided IPA plus optional content", () => {
    expect(entries.some((entry) => entry.ipaUS && entry.ipaUS === entry.ipaUK)).toBe(true);
    expect(entries.some((entry) => entry.ipaUS && entry.ipaUK && entry.ipaUS !== entry.ipaUK)).toBe(true);
    expect(entries.some((entry) => !entry.ipaUS && entry.ipaUK)).toBe(true);
    expect(entries.some((entry) => entry.partsOfSpeech.length > 1)).toBe(true);
    expect(entries.some((entry) => entry.phrases.length === 0)).toBe(true);
    expect(entries.some((entry) => entry.example === null)).toBe(true);
    const examples = entries.flatMap((entry) => entry.example ? [entry.example] : []);
    expect(examples.every((example) => {
      const wordCount = example.en.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g)?.length ?? 0;
      return wordCount >= 4 && wordCount <= 12 && !/\t|https?:|www\./i.test(`${example.en} ${example.zh}`) && /[\u3400-\u9fff]/u.test(example.zh);
    })).toBe(true);
  });

  it("records source versions, hashes and licenses", () => {
    const manifest = readJson<{ schemaVersion: number; sources: { id: string; sha256: string; license: string }[] }>("sources.json");
    expect(manifest.schemaVersion).toBe(1);
    expect(manifest.sources.map((source) => source.id)).toEqual(expect.arrayContaining(["ngsl-1.2", "project-supplemental", "wiktextract", "wiktextract-supplemental-pronunciations", "ecdict", "tatoeba-english", "tatoeba-chinese", "tatoeba-links"]));
    expect(manifest.sources.every((source) => /^[a-f0-9]{64}$/.test(source.sha256) && source.license.length > 0)).toBe(true);
  });

  it("ships freely licensed exact-accent Wikimedia pronunciation metadata", () => {
    const audio = readJson<DictionaryPronunciationManifest>("pronunciation-audio.json");
    expect(audio.schemaVersion).toBe(1);
    expect(Object.keys(audio.entries).length).toBeGreaterThan(0);
    expect(Object.keys(audio.entries).every((word) => index.items.some((item) => item.word === word))).toBe(true);
    const recordings = Object.values(audio.entries).flatMap((entry) => Object.entries(entry));
    expect(recordings.some(([accent]) => accent === "en-US")).toBe(true);
    expect(recordings.some(([accent]) => accent === "en-GB")).toBe(true);
    expect(recordings.every(([accent, recording]) => {
      if (!recording) return false;
      const oppositePrefix = accent === "en-US" ? /\/en-uk[-_]/i : /\/en-us[-_]/i;
      return recording.url.startsWith("https://upload.wikimedia.org/")
        && recording.sourceUrl.startsWith("https://commons.wikimedia.org/")
        && recording.licenseUrl.startsWith("https://")
        && recording.author.length > 0
        && recording.license.length > 0
        && !oppositePrefix.test(recording.url);
    })).toBe(true);
  });

  it("bundles pronunciation metadata for every automatic answer target", () => {
    const optionTargets = questions.flatMap((question) => "options" in question ? question.options : []);
    const hotspotTargets = scenes.flatMap((scene) => scene.hotspots);
    expect(optionTargets.every((option) => Boolean(option.pronunciationWord))).toBe(true);
    expect(hotspotTargets.every((hotspot) => Boolean(hotspot.pronunciationWord))).toBe(true);
    const optionWords = optionTargets.map((option) => option.pronunciationWord).filter((word): word is string => Boolean(word));
    const hotspotWords = hotspotTargets.map((hotspot) => hotspot.pronunciationWord).filter((word): word is string => Boolean(word));
    expect(optionWords.length).toBeGreaterThan(0);
    expect(hotspotWords.length).toBeGreaterThan(0);
    expect([...optionWords, ...hotspotWords].every((word) => getQuestPronunciation(word) !== undefined)).toBe(true);
  });
});

function readJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(resolve(dictionaryRoot, relativePath), "utf8")) as T;
}
