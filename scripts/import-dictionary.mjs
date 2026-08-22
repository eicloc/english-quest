#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { resolve } from "node:path";

const SCHEMA_VERSION = 1;
const EXPECTED_NGSL_COUNT = 2809;
const args = parseArgs(process.argv.slice(2));
const ngslPath = requiredPath("ngsl");
const ecdictPath = optionalPath("ecdict");
const supplementalPath = optionalPath("supplemental");
const supplementalPronunciationsPath = optionalPath("supplemental-pronunciations");
const wiktextractPath = optionalPath("wiktextract");
const tatoebaEnglishPath = optionalPath("tatoeba-english");
const tatoebaChinesePath = optionalPath("tatoeba-chinese");
const tatoebaLinksPath = optionalPath("tatoeba-links");
const outputPath = resolve(args.out ?? "public/content/dictionary");
const sourceDate = args["source-date"] ?? "2026-08-15";

const ngslRows = parseCsv(await readFile(ngslPath, "utf8"));
const ngslHeaders = ngslRows.shift();
if (!ngslHeaders || ngslHeaders[0] !== "Lemma") throw new Error("NGSL CSV 表头不符合预期");

const entries = ngslRows
  .filter((row) => row[0]?.trim())
  .map((row) => {
    const word = normalizeWord(row[0]);
    const ngslRank = Number(row[1]);
    return {
      word,
      ngslRank,
      band: Math.min(7, Math.ceil(ngslRank / 400)),
      partsOfSpeech: [],
      definitionsEn: [],
      definitionsZh: [],
      ipaUS: null,
      ipaUK: null,
      phrases: [],
      example: null,
      sources: ["ngsl-1.2"],
    };
  })
  .sort((a, b) => a.ngslRank - b.ngslRank || a.word.localeCompare(b.word));

if (entries.length !== EXPECTED_NGSL_COUNT) throw new Error(`NGSL 词数应为 ${EXPECTED_NGSL_COUNT}，实际为 ${entries.length}`);
const words = new Set(entries.map((entry) => entry.word));
if (words.size !== entries.length) throw new Error("NGSL 中存在重复词条");
if (supplementalPath) {
  const supplementalWords = (await readFile(supplementalPath, "utf8")).split(/\r?\n/).map(normalizeWord).filter(Boolean);
  for (const word of unique(supplementalWords)) {
    if (words.has(word)) continue;
    entries.push({ word, ngslRank: 0, band: 0, partsOfSpeech: [], definitionsEn: [], definitionsZh: [], ipaUS: null, ipaUK: null, phrases: [], example: null, sources: ["project-supplemental"] });
    words.add(word);
  }
}
const entryByWord = new Map(entries.map((entry) => [entry.word, entry]));

if (ecdictPath) await enrichFromEcdict(ecdictPath, entryByWord, words);
if (wiktextractPath) await enrichFromWiktextract(wiktextractPath, entryByWord, words);
if (supplementalPronunciationsPath) await enrichFromSupplementalPronunciations(supplementalPronunciationsPath, entryByWord);
if (tatoebaEnglishPath && tatoebaChinesePath && tatoebaLinksPath) {
  await enrichFromTatoeba(tatoebaEnglishPath, tatoebaChinesePath, tatoebaLinksPath, entryByWord, words);
}

for (const entry of entries) {
  entry.partsOfSpeech = unique(entry.partsOfSpeech).slice(0, 6);
  entry.definitionsEn = cleanMeanings(entry.definitionsEn);
  entry.definitionsZh = cleanMeanings(entry.definitionsZh);
  entry.phrases = entry.phrases
    .sort((a, b) => Number(b.source === "wiktextract") - Number(a.source === "wiktextract") || a.rank - b.rank || a.text.localeCompare(b.text))
    .filter((phrase, index, all) => all.findIndex((candidate) => candidate.text === phrase.text) === index)
    .slice(0, 3)
    .map((phrase) => ({ text: phrase.text, translationZh: phrase.translationZh, source: phrase.source }));
  entry.sources = unique(entry.sources).sort();
}

await mkdir(resolve(outputPath, "shards"), { recursive: true });
const letters = [..."abcdefghijklmnopqrstuvwxyz"];
const index = {
  schemaVersion: SCHEMA_VERSION,
  ngslCount: EXPECTED_NGSL_COUNT,
  count: entries.length,
  bands: Array.from({ length: 7 }, (_, offset) => ({ band: offset + 1, count: entries.filter((entry) => entry.band === offset + 1).length })),
  items: entries.map(({ word, ngslRank, band }) => ({ word, ngslRank, band, shard: shardFor(word) })),
};
await writeJson(resolve(outputPath, "index.json"), index);
for (const letter of letters) {
  await writeJson(resolve(outputPath, "shards", `${letter}.json`), { schemaVersion: SCHEMA_VERSION, letter, entries: entries.filter((entry) => shardFor(entry.word) === letter) });
}
await writeJson(resolve(outputPath, "shards", "other.json"), { schemaVersion: SCHEMA_VERSION, letter: "other", entries: entries.filter((entry) => shardFor(entry.word) === "other") });

const sourceFiles = [
  await sourceRecord("ngsl-1.2", ngslPath, "New General Service List 1.2", "NGSL 1.2 (April 2023); HF snapshot 9cb67787cd750360da7836cb9dafbefe1f7ab67c", "CC BY-SA 4.0", "https://www.newgeneralservicelist.com/new-general-service-list"),
  ...(supplementalPath ? [await sourceRecord("project-supplemental", supplementalPath, "English Quest library-only supplemental words", "repository snapshot", "Project data; application license", "data/dictionary-supplemental.txt")] : []),
  ...(supplementalPronunciationsPath ? [await sourceRecord("wiktextract-supplemental-pronunciations", supplementalPronunciationsPath, "Wiktionary pronunciation snapshot for supplemental terms", "Kaikki per-word snapshot accessed 2026-08-22", "CC BY-SA 4.0 and GFDL", "data/dictionary-supplemental-pronunciations.json")] : []),
  ...(ecdictPath ? [await sourceRecord("ecdict", ecdictPath, "ECDICT", "master snapshot accessed 2026-08-22", "MIT; mixed upstream provenance requires review before commercial release", "https://github.com/skywind3000/ECDICT")] : []),
  ...(wiktextractPath ? [await sourceRecord("wiktextract", wiktextractPath, "Wiktionary via Wiktextract", "Kaikki per-word snapshot accessed 2026-08-22", "CC BY-SA 4.0 and GFDL", "https://kaikki.org/dictionary/English/")] : []),
  ...(tatoebaEnglishPath ? [await sourceRecord("tatoeba-english", tatoebaEnglishPath, "Tatoeba English sentences", `export ${sourceDate}`, "CC BY 2.0 FR", "https://tatoeba.org/en/downloads")] : []),
  ...(tatoebaChinesePath ? [await sourceRecord("tatoeba-chinese", tatoebaChinesePath, "Tatoeba Chinese sentences", `export ${sourceDate}`, "CC BY 2.0 FR", "https://tatoeba.org/en/downloads")] : []),
  ...(tatoebaLinksPath ? [await sourceRecord("tatoeba-links", tatoebaLinksPath, "Tatoeba English-Chinese links", `export ${sourceDate}`, "CC BY 2.0 FR", "https://tatoeba.org/en/downloads")] : []),
];
await writeJson(resolve(outputPath, "sources.json"), { schemaVersion: SCHEMA_VERSION, sourceDate, generatedBy: "scripts/import-dictionary.mjs", sources: sourceFiles });

console.log(`Generated ${entries.length} dictionary entries in ${outputPath}`);
console.log(`Definitions (zh/en): ${entries.filter((entry) => entry.definitionsZh.length).length}/${entries.filter((entry) => entry.definitionsEn.length).length}`);
console.log(`IPA (US/UK): ${entries.filter((entry) => entry.ipaUS).length}/${entries.filter((entry) => entry.ipaUK).length}`);
console.log(`Examples/phrases: ${entries.filter((entry) => entry.example).length}/${entries.filter((entry) => entry.phrases.length).length}`);

async function enrichFromEcdict(path, dictionary, targetWords) {
  const text = await readFile(path, "utf8");
  let headers;
  const phraseCandidates = new Map();
  parseCsv(text, (row) => {
    if (!headers) {
      headers = row;
      return;
    }
    const item = Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""]));
    const headword = normalizeWord(item.word);
    const entry = dictionary.get(headword);
    if (entry) {
      entry.definitionsEn.push(...splitMeanings(item.definition));
      entry.definitionsZh.push(...splitMeanings(item.translation));
      entry.partsOfSpeech.push(...extractPartsOfSpeech(item.pos, item.translation, item.definition));
      entry.sources.push("ecdict");
      return;
    }

    if (!isSafePhrase(headword, item.translation)) return;
    const tokens = new Set(headword.match(/[a-z]+(?:'[a-z]+)?/g) ?? []);
    const matched = [...tokens].filter((token) => targetWords.has(token));
    if (!matched.length) return;
    const rank = bestRank(item.frq, item.bnc);
    for (const target of matched) {
      const list = phraseCandidates.get(target) ?? [];
      list.push({ text: headword, translationZh: cleanInline(item.translation), rank, source: "ecdict" });
      list.sort((a, b) => a.rank - b.rank || a.text.localeCompare(b.text));
      phraseCandidates.set(target, list.slice(0, 15));
    }
  });

  for (const [word, phrases] of phraseCandidates) {
    const entry = dictionary.get(word);
    if (entry) entry.phrases.push(...phrases);
  }
}

async function enrichFromWiktextract(path, dictionary, targetWords) {
  const input = createInterface({ input: createReadStream(path, "utf8"), crlfDelay: Infinity });
  for await (const line of input) {
    if (!line.trim()) continue;
    let item;
    try { item = JSON.parse(line); } catch { continue; }
    if (item.lang_code !== "en" || typeof item.word !== "string") continue;
    const headword = normalizeWord(item.word);
    const entry = dictionary.get(headword);
    const blocked = hasBlockedTags(item.tags) || (item.senses ?? []).some((sense) => hasBlockedTags(sense.tags));
    if (blocked) continue;
    if (entry) {
      const sharedIpa = [];
      let ipaUS;
      let ipaUK;
      for (const sound of item.sounds ?? []) {
        if (typeof sound.ipa !== "string" || !sound.ipa.startsWith("/")) continue;
        const tags = (sound.tags ?? []).map((tag) => String(tag).toLowerCase());
        if (!ipaUS && tags.some((tag) => ["general-american", "us", "ga"].includes(tag))) ipaUS = normalizePhonemicIpa(sound.ipa);
        if (!ipaUK && tags.some((tag) => ["received-pronunciation", "uk", "rp"].includes(tag))) ipaUK = normalizePhonemicIpa(sound.ipa);
        if (!tags.length) sharedIpa.push(normalizePhonemicIpa(sound.ipa));
      }
      const commonIpa = sharedIpa.find(Boolean);
      if (ipaUS) entry.ipaUS = ipaUS;
      else if (!entry.ipaUS && commonIpa) entry.ipaUS = commonIpa;
      if (ipaUK) entry.ipaUK = ipaUK;
      else if (!entry.ipaUK && commonIpa) entry.ipaUK = commonIpa;
      if (item.pos && item.pos !== "unknown") entry.partsOfSpeech.push(item.pos);
      for (const sense of item.senses ?? []) entry.definitionsEn.push(...(sense.glosses ?? []));
      entry.sources.push("wiktextract");
      continue;
    }
    if (!isSafePhrase(headword, "可靠")) continue;
    const zh = chineseTranslation(item);
    if (!zh) continue;
    const tokens = new Set(headword.match(/[a-z]+(?:'[a-z]+)?/g) ?? []);
    for (const target of [...tokens].filter((token) => targetWords.has(token))) {
      dictionary.get(target)?.phrases.push({ text: headword, translationZh: zh, rank: 500000, source: "wiktextract" });
    }
  }
}

async function enrichFromSupplementalPronunciations(path, dictionary) {
  const data = JSON.parse(await readFile(path, "utf8"));
  if (data.schemaVersion !== 1 || !Array.isArray(data.entries)) throw new Error("补充音标文件格式无效");
  for (const item of data.entries) {
    const entry = dictionary.get(normalizeWord(item.word));
    if (!entry) continue;
    entry.ipaUS = normalizePhonemicIpa(item.ipaUS) ?? entry.ipaUS;
    entry.ipaUK = normalizePhonemicIpa(item.ipaUK) ?? entry.ipaUK;
    entry.sources.push("wiktextract");
  }
}

async function enrichFromTatoeba(englishPath, chinesePath, linksPath, dictionary, targetWords) {
  const links = [];
  const englishIds = new Set();
  const chineseIds = new Set();
  const input = createInterface({ input: createReadStream(linksPath, "utf8"), crlfDelay: Infinity });
  for await (const line of input) {
    const [englishId, chineseId] = line.split("\t");
    if (!englishId || !chineseId) continue;
    links.push([englishId, chineseId]);
    englishIds.add(englishId);
    chineseIds.add(chineseId);
  }
  const [english, chinese] = await Promise.all([loadSelectedSentences(englishPath, englishIds), loadSelectedSentences(chinesePath, chineseIds)]);
  const candidates = new Map();
  for (const [englishId, chineseId] of links) {
    const en = english.get(englishId);
    const zh = chinese.get(chineseId);
    if (!en || !zh || !isSafeSentence(en, zh)) continue;
    const tokenList = en.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) ?? [];
    const score = Math.abs(tokenList.length - 8) * 10 + Number(englishId) / 1e9;
    for (const word of new Set(tokenList)) {
      if (!targetWords.has(word)) continue;
      const current = candidates.get(word);
      if (!current || score < current.score) candidates.set(word, { en, zh, id: englishId, score });
    }
  }
  for (const [word, example] of candidates) {
    const entry = dictionary.get(word);
    if (!entry) continue;
    entry.example = { en: example.en, zh: example.zh, source: "tatoeba", sourceId: example.id };
    entry.sources.push("tatoeba");
  }
}

async function loadSelectedSentences(path, wantedIds) {
  const result = new Map();
  const input = createInterface({ input: createReadStream(path, "utf8"), crlfDelay: Infinity });
  for await (const line of input) {
    const columns = line.split("\t");
    const id = columns[0];
    if (!id || !wantedIds.has(id)) continue;
    const textStart = /^[a-z]{3}$/i.test(columns[1] ?? "") ? 2 : 1;
    result.set(id, columns.slice(textStart).join("\t").trim());
  }
  return result;
}

function isSafeSentence(en, zh) {
  const tokens = en.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) ?? [];
  if (tokens.length < 4 || tokens.length > 12 || !/[\u3400-\u9fff]/u.test(zh)) return false;
  const text = `${en} ${zh}`;
  if (/https?:|www\.|@\w|\.(?:com|org|net)\b/i.test(text)) return false;
  if (/\b(?:sex|porn|nude|naked|rape|kill|murder|gun|weapon|blood|suicide|terrorist|racist|slut|fuck|shit)\b|色情|裸体|强奸|谋杀|自杀|恐怖分子|种族歧视/u.test(text)) return false;
  if (/\b(?:Tom|Mary|John|Alice|Bob|Mike|Linda|Kate|Jane|Jack|Peter|David|George|Susan|Sami|Boston|Tokyo|London|Paris)\b/.test(en)) return false;
  return !tokens.slice(1).some((token) => /^[A-Z][a-z]{2,}$/.test(token) && token !== "English");
}

function isSafePhrase(headword, translation) {
  const tokens = headword.match(/[a-z]+(?:'[a-z]+)?/g) ?? [];
  if (tokens.length < 2 || tokens.length > 5 || !/[\u3400-\u9fff]/u.test(translation)) return false;
  return !/\b(?:obsolete|archaic|slang|offensive|vulgar|derogatory|sex|porn|rape|murder|suicide)\b|过时|古语|俚语|冒犯|粗俗|色情|强奸|谋杀|自杀/i.test(`${headword} ${translation}`);
}

function hasBlockedTags(tags = []) {
  return tags.some((tag) => /obsolete|archaic|slang|offensive|vulgar|derogatory|dated/i.test(String(tag)));
}

function chineseTranslation(item) {
  const translations = [
    ...(item.translations ?? []),
    ...(item.senses ?? []).flatMap((sense) => sense.translations ?? []),
  ];
  const match = translations.find((translation) => ["zh", "cmn"].includes(translation.code) && /[\u3400-\u9fff]/u.test(translation.word ?? ""));
  return match ? cleanInline(match.word) : undefined;
}

function splitMeanings(value = "") {
  return value.replaceAll("\\n", "\n").split(/\r?\n|(?<=\S);(?=\s*[a-z\u3400-\u9fff])/iu).map(cleanInline).filter(Boolean);
}

function cleanMeanings(values) {
  return unique(values.map((value) => cleanInline(value).replace(/^\[(?:网络|Web)\]\s*/i, "")).filter((value) => value && value.length <= 280)).slice(0, 3);
}

function cleanInline(value = "") {
  return String(value).replaceAll("\\n", "；").replace(/\s+/g, " ").trim().slice(0, 320);
}

function extractPartsOfSpeech(pos = "", ...definitions) {
  const values = [];
  const normalized = `${pos} ${definitions.join(" ")}`.toLowerCase();
  const map = [[/\bn\.|\bnoun\b/, "noun"], [/\bvt?\.|\bvi\.|\bverb\b/, "verb"], [/\badj\.|\ba\.|\badjective\b/, "adjective"], [/\badv\.|\badverb\b/, "adverb"], [/\bprep\.|\bpreposition\b/, "preposition"], [/\bpron\.|\bpronoun\b/, "pronoun"], [/\bconj\.|\bconjunction\b/, "conjunction"], [/\bdet\.|\bdeterminer\b/, "determiner"], [/\bnum\.|\bnumeral\b/, "numeral"], [/\binterj\.|\bexclamation\b/, "interjection"]];
  for (const [pattern, name] of map) if (pattern.test(normalized)) values.push(name);
  for (const match of pos.matchAll(/(?:^|\/)([a-z]+):/gi)) values.push(match[1].toLowerCase());
  return values;
}

function normalizePhonemicIpa(value) {
  const match = value.match(/^\/([^/]+)\//);
  return match ? `/${match[1]}/` : null;
}

function bestRank(...values) {
  const numbers = values.map(Number).filter((value) => Number.isFinite(value) && value > 0);
  return numbers.length ? Math.min(...numbers) : 999999;
}

function normalizeWord(value = "") {
  return String(value).normalize("NFKC").trim().toLowerCase();
}

function shardFor(word) {
  const letter = word[0];
  return letter && /[a-z]/.test(letter) ? letter : "other";
}

function unique(values) {
  return [...new Set(values)];
}

function parseCsv(text, onRow) {
  const rows = onRow ? undefined : [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index <= text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') { field += '"'; index += 1; }
      else if (char === '"') quoted = false;
      else if (char === undefined) break;
      else field += char;
      continue;
    }
    if (char === '"' && field === "") quoted = true;
    else if (char === ",") { row.push(field); field = ""; }
    else if (char === "\n" || char === undefined) {
      row.push(field.replace(/\r$/, ""));
      if (row.some(Boolean)) {
        if (onRow) onRow(row);
        else rows.push(row);
      }
      row = [];
      field = "";
    } else field += char;
  }
  return rows;
}

async function sourceRecord(id, path, title, version, license, url) {
  const content = await readFile(path);
  return { id, title, version, sha256: createHash("sha256").update(content).digest("hex"), license, url };
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value)}\n`, "utf8");
}

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const key = values[index];
    if (!key.startsWith("--")) continue;
    parsed[key.slice(2)] = values[index + 1];
    index += 1;
  }
  return parsed;
}

function requiredPath(name) {
  const path = optionalPath(name);
  if (!path) throw new Error(`缺少必填参数 --${name}`);
  return path;
}

function optionalPath(name) {
  return args[name] ? resolve(args[name]) : undefined;
}
