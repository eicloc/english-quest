#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const US_TAGS = new Set(["us", "general-american", "ga"]);
const UK_TAGS = new Set(["uk", "received-pronunciation", "rp"]);
const OTHER_REGION_TAGS = new Set([
  "australia", "australian", "canada", "canadian", "ireland", "irish", "new-zealand",
  "scotland", "scottish", "south-africa", "southern-us", "wales", "welsh",
]);
const BLOCKED_TAGS = new Set(["archaic", "dated", "historical", "nonstandard", "obsolete"]);
const FREE_LICENSE = /^(?:cc0|public domain|cc[- ]by(?:[- ]sa)?(?:[- ]\d(?:\.\d)?)?|gfdl)/i;
const COMMONS_UPLOAD_HOST = "upload.wikimedia.org";
const COMMONS_API = "https://commons.wikimedia.org/w/api.php";

export function normalizeTag(tag) {
  return String(tag).trim().toLowerCase().replace(/[\s_]+/g, "-");
}

export function selectAccentRecording(items, accent) {
  const candidates = [];
  for (const item of items) {
    for (const sound of item?.sounds ?? []) {
      const candidate = scoreSound(sound, accent, item.word);
      if (candidate) candidates.push(candidate);
    }
  }
  candidates.sort((left, right) => right.score - left.score || left.audio.localeCompare(right.audio));
  return candidates[0];
}

export function isFreeLicense(license) {
  return FREE_LICENSE.test(String(license).trim());
}

function scoreSound(sound, accent, word) {
  if (!sound || typeof sound.audio !== "string") return undefined;
  if (!audioNameMatchesWord(sound.audio, word)) return undefined;
  if (accent === "en-US" && /^en-uk[-_]/i.test(sound.audio)) return undefined;
  if (accent === "en-GB" && /^en-us[-_]/i.test(sound.audio)) return undefined;
  const tags = new Set((sound.tags ?? []).map(normalizeTag));
  if ([...tags].some((tag) => BLOCKED_TAGS.has(tag) || OTHER_REGION_TAGS.has(tag))) return undefined;
  const oppositeTags = accent === "en-US" ? UK_TAGS : US_TAGS;
  if ([...tags].some((tag) => oppositeTags.has(tag))) return undefined;

  const strongTags = accent === "en-US" ? ["general-american", "ga"] : ["received-pronunciation", "rp"];
  const broadTag = accent === "en-US" ? "us" : "uk";
  const filenamePattern = accent === "en-US" ? /^en-us[-_]/i : /^en-uk[-_]/i;
  let score = 0;
  if (strongTags.some((tag) => tags.has(tag))) score = 300;
  else if (tags.has(broadTag)) score = 200;
  else if (filenamePattern.test(sound.audio)) score = 100;
  if (!score) return undefined;

  const mp3 = validAudioUrl(sound.mp3_url, ".mp3");
  const ogg = validAudioUrl(sound.ogg_url, ".ogg");
  if (!mp3 && !ogg) return undefined;
  return {
    audio: sound.audio,
    url: mp3 ?? ogg,
    format: mp3 ? "audio/mpeg" : "audio/ogg",
    score: score + (mp3 ? 10 : 0),
  };
}

function audioNameMatchesWord(audioName, word) {
  const base = decodeURIComponent(String(audioName)).replace(/\.(?:ogg|oga|wav|mp3)$/i, "").toLowerCase();
  const target = normalizeAudioTerm(word);
  if (!target) return false;
  const localePrefix = base.match(/^en-(?:us|uk)[-_](.+)$/i);
  if (localePrefix) return normalizeAudioTerm(localePrefix[1].replace(/[-_](?:male|female|[0-9]+)$/i, "")) === target;
  const normalizedBase = normalizeAudioTerm(base);
  return normalizedBase === target || normalizedBase.endsWith(` ${target}`);
}

function normalizeAudioTerm(value) {
  return String(value)
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9']+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function validAudioUrl(value, expectedSuffix) {
  if (typeof value !== "string") return undefined;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== COMMONS_UPLOAD_HOST) return undefined;
    if (!url.pathname.toLowerCase().includes(expectedSuffix)) return undefined;
    return url.href;
  } catch {
    return undefined;
  }
}

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 2) parsed[values[index]?.replace(/^--/, "")] = values[index + 1];
  return parsed;
}

async function fetchJsonlWord(word) {
  const first = word.slice(0, 1).toLowerCase();
  const firstTwo = word.slice(0, 2).toLowerCase();
  const url = `https://kaikki.org/dictionary/English/meaning/${encodeURIComponent(first)}/${encodeURIComponent(firstTwo)}/${encodeURIComponent(word)}.jsonl`;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { "user-agent": "english-quest-pronunciation-import/1.0" } });
      if (response.status === 404) return { items: [], failed: false };
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const text = await response.text();
      const items = text.split(/\r?\n/).filter(Boolean).flatMap((line) => {
        try {
          const item = JSON.parse(line);
          return item.lang_code === "en" && String(item.word).toLowerCase() === word ? [item] : [];
        } catch {
          return [];
        }
      });
      return { items, failed: false };
    } catch (error) {
      if (attempt === 2) {
        console.error(`Failed ${word}: ${error instanceof Error ? error.message : error}`);
        return { items: [], failed: true };
      }
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 500 * (attempt + 1)));
    }
  }
  return { items: [], failed: true };
}

async function fetchCommonsMetadata(audioNames) {
  const metadata = new Map();
  for (let offset = 0; offset < audioNames.length; offset += 50) {
    const names = audioNames.slice(offset, offset + 50);
    const query = new URLSearchParams({
      action: "query",
      format: "json",
      formatversion: "2",
      origin: "*",
      redirects: "1",
      prop: "imageinfo",
      iiprop: "extmetadata",
      inprop: "url",
      titles: names.map((name) => `File:${name}`).join("|"),
    });
    const response = await fetchWithRetries(`${COMMONS_API}?${query}`);
    const aliases = new Map();
    for (const item of [...(response.query?.normalized ?? []), ...(response.query?.redirects ?? [])]) {
      aliases.set(String(item.from).toLowerCase(), String(item.to).toLowerCase());
    }
    for (const page of response.query?.pages ?? []) {
      if (page.missing || !page.imageinfo?.[0]) continue;
      const ext = page.imageinfo[0].extmetadata ?? {};
      const license = plainText(ext.LicenseShortName?.value);
      const licenseUrl = safeHttps(ext.LicenseUrl?.value) ?? publicDomainLicenseUrl(license);
      const author = plainText(ext.Artist?.value || ext.Credit?.value);
      if (!author || !license || !licenseUrl || !isFreeLicense(license)) continue;
      metadata.set(String(page.title).toLowerCase(), {
        sourceUrl: safeHttps(page.fullurl) ?? `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title).replace(/%20/g, "_")}`,
        author,
        license,
        licenseUrl,
      });
    }
    for (const [from, to] of aliases) {
      const resolved = metadata.get(to);
      if (resolved) metadata.set(from, resolved);
    }
    console.log(`Commons metadata ${Math.min(offset + names.length, audioNames.length)}/${audioNames.length}`);
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 750));
  }
  return metadata;
}

async function fetchWithRetries(url) {
  let lastError;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { "user-agent": "english-quest-pronunciation-import/1.0" } });
      if (response.status === 429) {
        const retryAfter = Number(response.headers.get("retry-after"));
        await new Promise((resolveDelay) => setTimeout(resolveDelay, Number.isFinite(retryAfter) ? retryAfter * 1000 : 5000 * (attempt + 1)));
        continue;
      }
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < 4) await new Promise((resolveDelay) => setTimeout(resolveDelay, 1500 * (attempt + 1)));
    }
  }
  throw lastError ?? new Error("Wikimedia Commons rate limit did not clear");
}

function safeHttps(value) {
  if (typeof value !== "string") return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function publicDomainLicenseUrl(license) {
  return /^public domain$/i.test(license) ? "https://creativecommons.org/publicdomain/mark/1.0/" : undefined;
}

function plainText(value) {
  if (typeof value !== "string") return "";
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const indexPath = resolve(args.index ?? "public/content/dictionary/index.json");
  const outputPath = resolve(args.out ?? "public/content/dictionary/pronunciation-audio.json");
  const concurrency = Math.max(1, Math.min(24, Number(args.concurrency ?? 12)));
  const sourceDate = args["source-date"] ?? new Date().toISOString().slice(0, 10);
  const index = JSON.parse(await readFile(indexPath, "utf8"));
  const limit = args.limit ? Math.max(1, Number(args.limit)) : Number.POSITIVE_INFINITY;
  const words = index.items.map((item) => String(item.word).trim().toLowerCase()).filter(Boolean).slice(0, limit);
  const selected = new Map();
  let cursor = 0;
  let completed = 0;
  let failures = 0;

  await Promise.all(Array.from({ length: Math.min(concurrency, words.length) }, async () => {
    while (cursor < words.length) {
      const word = words[cursor];
      cursor += 1;
      const result = await fetchJsonlWord(word);
      if (result.failed) failures += 1;
      const us = selectAccentRecording(result.items, "en-US");
      const uk = selectAccentRecording(result.items, "en-GB");
      if (us || uk) selected.set(word, { ...(us ? { "en-US": us } : {}), ...(uk ? { "en-GB": uk } : {}) });
      completed += 1;
      if (completed % 100 === 0 || completed === words.length) console.log(`Pronunciations ${completed}/${words.length} (request failures ${failures})`);
    }
  }));

  if (failures > Math.max(10, words.length * 0.05)) throw new Error(`Too many Kaikki request failures: ${failures}/${words.length}`);
  const audioNames = [...new Set([...selected.values()].flatMap((entry) => Object.values(entry).map((item) => item.audio)))].sort();
  const metadata = await fetchCommonsMetadata(audioNames);
  const entries = {};
  for (const word of words) {
    const candidates = selected.get(word);
    if (!candidates) continue;
    const recordings = {};
    for (const accent of ["en-US", "en-GB"]) {
      const candidate = candidates[accent];
      if (!candidate) continue;
      const credits = metadata.get(`file:${candidate.audio}`.toLowerCase());
      if (!credits) continue;
      recordings[accent] = { url: candidate.url, format: candidate.format, ...credits };
    }
    if (Object.keys(recordings).length) entries[word] = recordings;
  }

  const manifest = { schemaVersion: 1, sourceDate, entries };
  await writeFile(outputPath, `${JSON.stringify(manifest)}\n`, "utf8");
  const recordingCount = Object.values(entries).reduce((count, entry) => count + Object.keys(entry).length, 0);
  console.log(`Generated ${Object.keys(entries).length} words / ${recordingCount} recordings in ${outputPath}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main();
}
