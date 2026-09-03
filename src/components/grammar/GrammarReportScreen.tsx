"use client";

import { ArrowLeft, Home, Printer, RotateCcw, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/ui/AppHeader";
import { grammarStageById } from "@/content/grammar/stages";
import { avatars } from "@/content/vocabulary";
import { useGrammar } from "@/features/grammar/grammar-context";
import { buildGrammarReport, grammarSkillLabels } from "@/features/grammar/scoring";
import { resetGrammarSession } from "@/features/grammar/session";

const skillIcons = { pronouns: "🧑‍🚀", beAgreement: "⚡", nounNumber: "🔢", demonstratives: "👉", thereBe: "🏘️", haveHas: "🎒", thirdPersonVerbs: "🏃", negatives: "🚫", questions: "❓" } as const;

export function GrammarReportScreen({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const { data, dispatch, hydrated } = useGrammar();
  const session = data.sessions.find((item) => item.id === sessionId);
  if (!hydrated) return <main className="grid min-h-screen place-items-center font-black">正在整理语法能量…</main>;
  if (!session) return <main className="grid min-h-screen place-items-center p-4"><section className="paper-panel max-w-md rounded-[30px] p-8 text-center"><span className="text-6xl">📭</span><h1 className="mt-5 text-3xl font-black">没有找到语法报告</h1><button type="button" onClick={() => router.push("/grammar/")} className="game-button mt-6 bg-violet-600 px-6 text-white">返回语法星球</button></section></main>;
  const report = buildGrammarReport(session);
  const avatar = avatars.find((item) => item.id === session.avatarId);

  function playAgain() {
    const reset = resetGrammarSession(session!);
    dispatch({ type: "CREATE_SESSION", session: reset });
    router.push(`/grammar/quest/?session=${encodeURIComponent(reset.id)}`);
  }

  return <div className="min-h-screen">
    <AppHeader actions={<div className="flex gap-2"><button type="button" onClick={() => router.push("/")} className="game-button flex min-h-11 items-center gap-2 bg-white px-4 text-sm shadow-sm"><Home className="size-4" /><span className="hidden sm:inline">选择板块</span></button><button type="button" onClick={() => router.push("/grammar/")} className="game-button flex min-h-11 items-center gap-2 bg-white px-4 text-sm shadow-sm"><ArrowLeft className="size-4" /><span className="hidden sm:inline">语法星球</span></button></div>} />
    <main className="mx-auto w-full max-w-6xl px-4 pb-14 sm:px-6 lg:px-8">
      <section className="print-panel paper-panel relative overflow-hidden rounded-[36px] p-6 sm:p-9">
        <div className="absolute -right-12 -top-16 text-[12rem] opacity-[0.06]" aria-hidden="true">🪐</div>
        <header className="relative flex flex-col gap-6 border-b border-violet-100 pb-7 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><span className="grid size-20 place-items-center rounded-full bg-[#FFF0B8] text-5xl shadow-sm">{avatar?.emoji ?? "⭐"}</span><div><p className="text-sm font-black uppercase tracking-[0.18em] text-violet-600">Grammar adventure complete</p><h1 className="mt-1 text-3xl font-black sm:text-4xl">{session.studentName} 的语法星球报告</h1><p className="mt-2 font-semibold text-slate-500">{new Date(session.createdAt).toLocaleString("zh-CN")}</p></div></div><div className="flex items-center gap-3 rounded-[24px] bg-[#24324A] px-6 py-4 text-white"><Star className="size-8 fill-[#FFD86B] text-[#FFD86B]" /><strong className="text-4xl">{report.totalStars}</strong><span className="text-sm font-bold text-blue-100">颗<br />语法星</span></div></header>

        <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4"><Metric label="完成主线题" value={`${report.completedCount}`} /><Metric label="首次答对率" value={`${report.firstTryAccuracy}%`} /><Metric label="最终答对率" value={`${report.finalAccuracy}%`} /><Metric label="复习正确率" value={report.reviewAccuracy === undefined ? "无需复习" : `${report.reviewAccuracy}%`} /></div>

        <section className="relative mt-8"><div className="flex items-end justify-between gap-3"><div><h2 className="text-2xl font-black">知识点掌握情况</h2><p className="mt-1 text-sm font-semibold text-slate-500">80% 是掌握提示，不影响完成冒险。</p></div><button type="button" onClick={() => window.print()} className="no-print game-button flex min-h-11 items-center gap-2 bg-violet-50 px-4 text-sm text-violet-700"><Printer className="size-4" />打印</button></div><div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">{report.skillResults.map((result) => { const percentage = result.percentage ?? 0; return <article key={result.skill} className="rounded-2xl border border-slate-100 bg-white p-4"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-violet-50 text-2xl">{skillIcons[result.skill]}</span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><h3 className="font-black">{grammarSkillLabels[result.skill]}</h3><strong className={percentage >= 80 ? "text-emerald-600" : "text-amber-600"}>{result.percentage === undefined ? "—" : `${percentage}%`}</strong></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${percentage >= 80 ? "bg-emerald-500" : "bg-amber-400"}`} style={{ width: `${percentage}%` }} /></div></div></div><p className="mt-3 flex justify-between text-xs font-bold text-slate-500"><span>{result.status}</span><span>{result.possible ? `${result.earned}/${result.possible} 星` : "暂无数据"}</span></p></article>; })}</div></section>

        <div className="relative mt-8 grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
          <section className="rounded-[24px] bg-violet-50 p-5"><h2 className="text-xl font-black">下一步练什么</h2>{report.weakRules.length ? <><p className="mt-2 text-sm font-semibold leading-6 text-slate-600">优先回看这些知识点，每次练习 5～8 分钟即可：</p><div className="mt-4 flex flex-wrap gap-2">{report.weakRules.map((rule) => <span key={rule} className="rounded-full bg-white px-3 py-2 text-sm font-black text-violet-700 shadow-sm">{rule}</span>)}</div></> : <div className="mt-4 rounded-2xl bg-emerald-50 p-4 font-bold text-emerald-700">所有已测知识点都达到掌握线，继续用短句轻松复习吧！</div>}</section>
          <section><h2 className="text-xl font-black">错题与正确规则</h2>{report.mistakes.length ? <div className="mt-3 max-h-[32rem] space-y-3 overflow-auto pr-1">{report.mistakes.map((mistake, index) => <article key={mistake.questionId} className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4"><p className="text-xs font-black uppercase tracking-widest text-amber-600">Review {index + 1}</p><p className="mt-1 font-black text-slate-700">{mistake.prompt}</p><p className="mt-2 text-sm font-semibold text-rose-700">第一次回答：{mistake.response}</p><p className="mt-1 text-sm font-black text-emerald-700">正确答案：{mistake.answer}</p><p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{mistake.explanation}</p></article>)}</div> : <div className="mt-3 rounded-2xl bg-emerald-50 p-5 font-bold text-emerald-700">这次没有需要整理的错题，太棒了！</div>}</section>
        </div>

        <section className="relative mt-8"><h2 className="text-xl font-black">收集到的关卡徽章</h2><div className="mt-3 flex flex-wrap gap-3">{session.badges.map((stageId) => { const stage = grammarStageById[stageId]; return stage ? <div key={stageId} className="min-w-28 rounded-2xl border border-violet-100 bg-white p-3 text-center shadow-sm"><span className="text-3xl">{stage.icon}</span><strong className="mt-1 block text-xs">{stage.titleZh}</strong></div> : null; })}</div></section>
        <div className="no-print relative mt-8 flex flex-wrap justify-center gap-3"><button type="button" onClick={() => router.push("/grammar/")} className="game-button bg-slate-100 px-6">返回语法星球</button><button type="button" onClick={playAgain} className="game-button flex items-center gap-2 bg-violet-600 px-6 text-white shadow-sm"><RotateCcw className="size-4" />重新抽题挑战</button></div>
      </section>
    </main>
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-slate-50 p-4 text-center"><strong className="block text-xl">{value}</strong><span className="mt-1 block text-xs font-bold text-slate-500">{label}</span></div>;
}
