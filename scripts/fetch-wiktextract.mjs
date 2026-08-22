#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const args = parseArgs(process.argv.slice(2));
if (!args.ngsl || !args.out) throw new Error("Usage: node scripts/fetch-wiktextract.mjs --ngsl <csv> --out <jsonl> [--concurrency 12] [--limit 2809]");
const concurrency = Math.max(1, Number(args.concurrency ?? 12));
const limit = Number(args.limit ?? Number.POSITIVE_INFINITY);
const words = parseNgsl(await readFile(resolve(args.ngsl), "utf8")).slice(0, limit);
const results = Array.from({ length: words.length }, () => []);
let cursor = 0;
let completed = 0;
let missing = 0;

await Promise.all(Array.from({ length: Math.min(concurrency, words.length) }, async () => {
  while (cursor < words.length) {
    const index = cursor;
    cursor += 1;
    const word = words[index];
    const items = await fetchWord(word);
    if (!items.length) missing += 1;
    results[index] = items;
    completed += 1;
    if (completed % 100 === 0 || completed === words.length) console.log(`Wiktextract ${completed}/${words.length} (missing ${missing})`);
  }
}));

await writeFile(resolve(args.out), `${results.flat().map((item) => JSON.stringify(item)).join("\n")}\n`, "utf8");

async function fetchWord(word) {
  const first = word.slice(0, 1).toLowerCase();
  const firstTwo = word.slice(0, 2).toLowerCase();
  const url = `https://kaikki.org/dictionary/English/meaning/${encodeURIComponent(first)}/${encodeURIComponent(firstTwo)}/${encodeURIComponent(word)}.jsonl`;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { "user-agent": "english-quest-dictionary-import/1.0" } });
      if (response.status === 404) return [];
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const text = await response.text();
      return text.split(/\r?\n/).filter(Boolean).flatMap((line) => {
        try {
          const item = JSON.parse(line);
          return item.lang_code === "en" && String(item.word).toLowerCase() === word ? [item] : [];
        } catch {
          return [];
        }
      });
    } catch (error) {
      if (attempt === 2) {
        console.error(`Failed ${word}: ${error instanceof Error ? error.message : error}`);
        return [];
      }
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 750 * (attempt + 1)));
    }
  }
  return [];
}

function parseNgsl(text) {
  return text.split(/\r?\n/).slice(1).map((line) => line.split(",", 1)[0].trim().toLowerCase()).filter(Boolean);
}

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 2) parsed[values[index]?.replace(/^--/, "")] = values[index + 1];
  return parsed;
}
