import type { Accent, PronunciationRecording } from "@/features/speech/speech-common";

export type DictionaryPhrase = {
  text: string;
  translationZh: string;
  source: "wiktextract" | "ecdict";
};

export type DictionaryExample = {
  en: string;
  zh: string;
  source: "tatoeba";
  sourceId: string;
};

export type DictionaryEntry = {
  word: string;
  ngslRank: number;
  band: number;
  partsOfSpeech: string[];
  definitionsEn: string[];
  definitionsZh: string[];
  ipaUS: string | null;
  ipaUK: string | null;
  phrases: DictionaryPhrase[];
  example: DictionaryExample | null;
  sources: string[];
};

export type DictionaryIndexItem = Pick<DictionaryEntry, "word" | "ngslRank" | "band"> & { shard: string };
export type DictionaryIndex = { schemaVersion: number; ngslCount: number; count: number; bands: { band: number; count: number }[]; items: DictionaryIndexItem[] };
export type DictionaryShard = { schemaVersion: number; letter: string; entries: DictionaryEntry[] };
export type DictionaryPronunciationAudio = Partial<Record<Accent, PronunciationRecording>>;
export type DictionaryPronunciationManifest = {
  schemaVersion: 1;
  sourceDate: string;
  entries: Record<string, DictionaryPronunciationAudio>;
};
