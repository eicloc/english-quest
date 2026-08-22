"use client";

import { BookOpen, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/ui/AppHeader";
import { DualAccentAudioButtons } from "@/components/speech/DualAccentAudioButtons";
import { loadDictionaryEntry, loadDictionaryIndex, loadPronunciationAudio } from "@/features/dictionary/dictionary-client";
import type { DictionaryEntry, DictionaryIndex, DictionaryPronunciationAudio } from "@/features/dictionary/types";
import { withBasePath } from "@/lib/base-path";

const PAGE_SIZE = 40;
const partOfSpeechLabels: Record<string, string> = { noun: "名词", verb: "动词", adjective: "形容词", adverb: "副词", pronoun: "代词", preposition: "介词", conjunction: "连词", determiner: "限定词", numeral: "数词", interjection: "感叹词", n: "名词", v: "动词", a: "形容词", adv: "副词", prep: "介词", conj: "连词", pron: "代词" };

export function WordsScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const requestedBand = Number(searchParams.get("band") ?? 0);
  const band = requestedBand >= 1 && requestedBand <= 7 ? requestedBand : 0;
  const requestedPage = Number(searchParams.get("page") ?? 1);
  const page = Number.isFinite(requestedPage) ? Math.max(1, Math.floor(requestedPage)) : 1;
  const selectedWord = searchParams.get("word") ?? "";
  const [index, setIndex] = useState<DictionaryIndex>();
  const [detail, setDetail] = useState<{ word: string; entry?: DictionaryEntry; pronunciations?: DictionaryPronunciationAudio }>({ word: "" });
  const [error, setError] = useState<string>();

  useEffect(() => {
    void loadDictionaryIndex().then(setIndex).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "词库加载失败"));
  }, []);
  useEffect(() => {
    let active = true;
    if (!selectedWord) return;
    void Promise.all([
      loadDictionaryEntry(selectedWord),
      loadPronunciationAudio(selectedWord).catch(() => undefined),
    ]).then(([result, pronunciations]) => {
      if (active) setDetail({ word: selectedWord, entry: result, pronunciations });
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "词条加载失败");
    });
    return () => { active = false; };
  }, [selectedWord]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return index?.items.filter((item) => (!band || item.band === band) && (!normalized || item.word.includes(normalized))) ?? [];
  }, [band, index, query]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const detailLoading = Boolean(selectedWord) && detail.word !== selectedWord;
  const entry = detail.word === selectedWord ? detail.entry : undefined;

  function navigate(changes: Record<string, string | number | undefined>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === undefined || value === "" || value === 0) next.delete(key);
      else next.set(key, String(value));
    }
    router.replace(`/words/${next.size ? `?${next.toString()}` : ""}`);
  }

  return (
    <div className="min-h-screen">
      <AppHeader actions={<a href={withBasePath("/content/dictionary/sources.json")} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-500 shadow-sm">数据来源</a>} />
      <main className="mx-auto w-full max-w-[1400px] px-4 pb-12 sm:px-6 lg:px-8">
        <section className="mb-6 rounded-[28px] bg-[#24324A] p-6 text-white shadow-xl sm:p-8">
          <div className="flex items-center gap-3"><span className="grid size-12 place-items-center rounded-2xl bg-[#FFD86B] text-[#24324A]"><BookOpen /></span><div><p className="text-xs font-black uppercase tracking-[0.18em] text-blue-200">NGSL 1.2 · 2,809 words</p><h1 className="text-3xl font-black sm:text-4xl">独立词汇宝库</h1></div></div>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-300">按七个高频阶段浏览，另含 4 个明确标记的闯关补充词。词库不会加入题目，也不会影响现有分数与记录。</p>
        </section>
        <div className="grid gap-5 lg:grid-cols-[minmax(340px,0.8fr)_minmax(0,1.2fr)]">
          <section className="paper-panel rounded-[28px] p-4 sm:p-5" aria-label="词汇列表">
            <DictionarySearch key={query} query={query} onSearch={(value) => navigate({ q: value, page: 1, word: undefined })} />
            <div className="mt-4 flex flex-wrap gap-2"><FilterChip active={!band} onClick={() => navigate({ band: undefined, page: 1 })}>全部</FilterChip>{Array.from({ length: 7 }, (_, offset) => offset + 1).map((value) => <FilterChip key={value} active={band === value} onClick={() => navigate({ band: value, page: 1 })}>阶段 {value}</FilterChip>)}</div>
            <p className="mt-4 text-sm font-bold text-slate-500">找到 {filtered.length} 个词</p>
            {error ? <div role="alert" className="mt-4 rounded-2xl bg-rose-50 p-5 font-bold text-rose-700">{error}</div> : !index ? <div className="mt-4 rounded-2xl bg-blue-50 p-8 text-center font-bold text-slate-500">正在加载索引…</div> : pageItems.length === 0 ? <div className="mt-4 rounded-2xl bg-amber-50 p-8 text-center font-bold text-amber-800">没有匹配的单词，换个关键词试试。</div> : <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">{pageItems.map((item) => <button type="button" key={item.word} onClick={() => navigate({ word: item.word })} className={`rounded-2xl border p-3 text-left transition ${selectedWord === item.word ? "border-blue-300 bg-blue-50 ring-2 ring-blue-100" : "border-slate-100 bg-white hover:border-blue-200"}`}><strong className="block truncate text-lg">{item.word}</strong><span className="text-xs font-bold text-slate-400">#{item.ngslRank} · 阶段 {item.band}</span></button>)}</div>}
            <div className="mt-5 flex items-center justify-between"><button type="button" disabled={safePage <= 1} onClick={() => navigate({ page: safePage - 1 })} className="game-button inline-flex min-h-11 items-center gap-1 rounded-xl bg-slate-100 px-3 text-xs disabled:opacity-40"><ChevronLeft className="size-4" />上一页</button><span className="text-xs font-black text-slate-500">{safePage} / {pageCount}</span><button type="button" disabled={safePage >= pageCount} onClick={() => navigate({ page: safePage + 1 })} className="game-button inline-flex min-h-11 items-center gap-1 rounded-xl bg-slate-100 px-3 text-xs disabled:opacity-40">下一页<ChevronRight className="size-4" /></button></div>
          </section>
          <section className="paper-panel min-h-[520px] rounded-[28px] p-5 sm:p-8" aria-live="polite">
            {!selectedWord ? <div className="grid min-h-[460px] place-items-center text-center"><div><span className="text-7xl">📖</span><h2 className="mt-5 text-2xl font-black">选择一个单词</h2><p className="mt-2 font-bold text-slate-400">查看释义、音标、例句和短语。</p></div></div> : detailLoading ? <div className="grid min-h-[460px] place-items-center font-bold text-slate-500">正在打开 {selectedWord}…</div> : entry ? <DictionaryDetail entry={entry} pronunciations={detail.pronunciations} /> : <div className="grid min-h-[460px] place-items-center text-center"><div><span className="text-6xl">🧭</span><h2 className="mt-4 text-2xl font-black">NGSL 中没有 {selectedWord}</h2><p className="mt-2 font-bold text-slate-400">可以返回列表搜索其他高频词。</p></div></div>}
          </section>
        </div>
      </main>
    </div>
  );
}

function DictionaryDetail({ entry, pronunciations }: { entry: DictionaryEntry; pronunciations?: DictionaryPronunciationAudio }) {
  return <article><div className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-black uppercase tracking-widest text-[#4F8EF7]">{entry.ngslRank ? `NGSL #${entry.ngslRank} · 阶段 ${entry.band}` : "独立补充词 · 不属于 NGSL 阶段"}</p><h2 className="mt-2 text-5xl font-black tracking-tight sm:text-6xl">{entry.word}</h2><div className="mt-3 flex flex-wrap gap-2">{entry.partsOfSpeech.length ? entry.partsOfSpeech.map((part) => <span key={part} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{partOfSpeechLabels[part] ?? part}</span>) : <span className="text-sm font-bold text-slate-400">暂无词性</span>}</div></div><div><DualAccentAudioButtons text={entry.word} enabled purpose="word" recordings={pronunciations} /><RecordingCredits recordings={pronunciations} /></div></div><div className="mt-6 grid gap-3 sm:grid-cols-2"><IpaCard accent="US · 美音" ipa={entry.ipaUS} color="bg-blue-50 text-[#356FD1]" /><IpaCard accent="UK · 英音" ipa={entry.ipaUK} color="bg-violet-50 text-violet-700" /></div><ContentBlock title="中文释义">{entry.definitionsZh.length ? <ol className="space-y-2">{entry.definitionsZh.map((meaning, index) => <li key={meaning} className="leading-6"><b className="mr-2 text-[#4F8EF7]">{index + 1}.</b>{meaning}</li>)}</ol> : <Missing />}</ContentBlock><ContentBlock title="English definitions">{entry.definitionsEn.length ? <ol className="space-y-2">{entry.definitionsEn.map((meaning, index) => <li key={meaning} className="leading-6"><b className="mr-2 text-[#4F8EF7]">{index + 1}.</b>{meaning}</li>)}</ol> : <Missing />}</ContentBlock><ContentBlock title="双语例句">{entry.example ? <div className="rounded-2xl bg-[#FFF8E7] p-4"><p className="font-extrabold leading-6">{entry.example.en}</p><p className="mt-2 text-sm font-bold text-slate-500">{entry.example.zh}</p></div> : <Missing />}</ContentBlock><ContentBlock title="常用短语">{entry.phrases.length ? <div className="grid gap-2 sm:grid-cols-2">{entry.phrases.map((phrase) => <div key={phrase.text} className="rounded-2xl border border-slate-100 bg-white p-4"><strong>{phrase.text}</strong><p className="mt-1 text-sm font-bold text-slate-500">{phrase.translationZh}</p></div>)}</div> : <Missing />}</ContentBlock><p className="mt-7 text-xs font-bold text-slate-400">来源标识：{entry.sources.join(" · ")}</p></article>;
}

function RecordingCredits({ recordings }: { recordings?: DictionaryPronunciationAudio }) {
  const items = (["en-US", "en-GB"] as const).flatMap((accent) => recordings?.[accent] ? [{ accent, recording: recordings[accent] }] : []);
  if (!items.length) return null;
  return <p className="mt-2 max-w-xs text-center text-[11px] font-bold leading-4 text-slate-400">真人录音：{items.map(({ accent, recording }, index) => <span key={accent}>{index > 0 && " · "}<a href={recording?.sourceUrl} target="_blank" rel="noreferrer" className="underline decoration-dotted underline-offset-2">{accent === "en-US" ? "US" : "UK"} {recording?.author}</a>（<a href={recording?.licenseUrl} target="_blank" rel="noreferrer" className="underline decoration-dotted underline-offset-2">{recording?.license}</a>）</span>)}</p>;
}

function IpaCard({ accent, ipa, color }: { accent: string; ipa: string | null; color: string }) { return <div className={`rounded-2xl p-4 ${color}`}><strong className="block text-xs uppercase tracking-wider">{accent}</strong><span className="mt-1 block text-xl font-black">{ipa ?? "暂无音标"}</span></div>; }
function ContentBlock({ title, children }: { title: string; children: React.ReactNode }) { return <section className="mt-7"><h3 className="mb-3 text-lg font-black">{title}</h3>{children}</section>; }
function Missing() { return <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-400">暂无可靠内容</p>; }
function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" aria-pressed={active} onClick={onClick} className={`rounded-full px-3 py-2 text-xs font-black transition ${active ? "bg-[#24324A] text-white" : "bg-slate-100 text-slate-500 hover:bg-blue-50"}`}>{children}</button>; }

function DictionarySearch({ query, onSearch }: { query: string; onSearch: (value?: string) => void }) {
  const [search, setSearch] = useState(query);
  return <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); onSearch(search.trim() || undefined); }}><label className="relative flex-1"><span className="sr-only">搜索单词</span><Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索，例如 apple" className="h-14 w-full rounded-2xl border-2 border-slate-100 bg-white pl-12 pr-10 font-bold" />{search && <button type="button" onClick={() => { setSearch(""); onSearch(undefined); }} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400"><X className="size-4" /></button>}</label><button type="submit" className="game-button min-h-14 bg-[#4F8EF7] px-4 text-white">搜索</button></form>;
}
