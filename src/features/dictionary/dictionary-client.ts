import { withBasePath } from "@/lib/base-path";
import type { DictionaryEntry, DictionaryIndex, DictionaryPronunciationManifest, DictionaryShard } from "./types";

let indexPromise: Promise<DictionaryIndex> | undefined;
let pronunciationPromise: Promise<DictionaryPronunciationManifest> | undefined;
const shardPromises = new Map<string, Promise<DictionaryShard>>();

export function loadDictionaryIndex() {
  indexPromise ??= fetchJson<DictionaryIndex>("/content/dictionary/index.json");
  return indexPromise;
}

export function loadDictionaryShard(letter: string) {
  const shard = /^[a-z]$/i.test(letter) ? letter.toLowerCase() : "other";
  const existing = shardPromises.get(shard);
  if (existing) return existing;
  const request = fetchJson<DictionaryShard>(`/content/dictionary/shards/${shard}.json`);
  shardPromises.set(shard, request);
  return request;
}

export function loadDictionaryPronunciations() {
  pronunciationPromise ??= fetchJson<DictionaryPronunciationManifest>("/content/dictionary/pronunciation-audio.json");
  return pronunciationPromise;
}

export async function loadPronunciationAudio(word: string) {
  const normalized = word.trim().toLowerCase();
  if (!normalized) return undefined;
  const manifest = await loadDictionaryPronunciations();
  return manifest.entries[normalized];
}

export async function loadDictionaryEntry(word: string): Promise<DictionaryEntry | undefined> {
  const normalized = word.trim().toLowerCase();
  if (!normalized) return undefined;
  const index = await loadDictionaryIndex();
  const item = index.items.find((candidate) => candidate.word === normalized);
  if (!item) return undefined;
  const shard = await loadDictionaryShard(item.shard);
  return shard.entries.find((candidate) => candidate.word === normalized);
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(withBasePath(path));
  if (!response.ok) throw new Error(`词库加载失败（${response.status}）`);
  return response.json() as Promise<T>;
}
