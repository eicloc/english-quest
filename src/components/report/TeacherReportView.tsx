"use client";

import { questionById } from "@/content/questions";
import { skillLabels } from "@/features/assessment/scoring";
import type { AssessmentReport, AssessmentSession } from "@/features/assessment/types";
import { SkillScoreCard } from "./SkillScoreCard";

export function TeacherReportView({ session, report, onOverallNote }: { session: AssessmentSession; report: AssessmentReport; onOverallNote: (note: string) => void }) {
  const notes = session.attempts.filter((attempt) => attempt.note?.trim());
  const percentages = report.skillResults.flatMap((result) => result.percentage === undefined ? [] : [result.percentage]);
  const overall = percentages.length ? Math.round(percentages.reduce((sum, value) => sum + value, 0) / percentages.length) : 0;
  return (
    <section className="print-panel paper-panel rounded-[32px] p-5 sm:p-8" aria-labelledby="teacher-report-title">
      <header className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-black uppercase tracking-[0.18em] text-[#4F8EF7]">Teacher assessment</p><h1 id="teacher-report-title" className="mt-2 text-3xl font-black sm:text-4xl">{session.studentName} 的英语能力报告</h1><p className="mt-2 text-sm font-bold text-slate-500">{new Date(session.createdAt).toLocaleString("zh-CN")} · {session.mode === "teacher-led" ? "老师带领模式" : "学生自主模式"}</p></div><div className="rounded-2xl bg-[#24324A] px-6 py-4 text-white"><span className="text-xs font-bold text-blue-100">已测维度平均</span><strong className="ml-3 text-3xl">{overall}%</strong></div></header>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5"><Metric label="总用时" value={formatDuration(report.durationMs)} /><Metric label="完成题数" value={`${report.completedCount}`} /><Metric label="首次答对率" value={`${report.firstTryAccuracy}%`} /><Metric label="使用提示" value={`${report.hintCount}`} /><Metric label="跳过题目" value={`${report.skippedCount}`} /></div>
      <section className="mt-8"><h2 className="text-xl font-black">七维能力雷达</h2><p className="mt-1 text-sm text-slate-500">仅按实际作答形成证据；未访问题目不计入分母。</p><div className="mt-4 grid gap-3 md:grid-cols-2">{report.skillResults.map((result) => <SkillScoreCard key={result.skill} result={result} />)}</div></section>
      <div className="mt-8 grid gap-7 lg:grid-cols-2">
        <section><h2 className="text-xl font-black">建议训练方向</h2><ol className="mt-4 space-y-3">{report.recommendations.map((recommendation, index) => <li key={recommendation} className="flex gap-3 rounded-2xl bg-blue-50 p-4 text-sm font-semibold leading-6 text-slate-700"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#4F8EF7] text-xs font-black text-white">{index + 1}</span>{recommendation}</li>)}</ol></section>
        <section><h2 className="text-xl font-black">不稳定词汇与任务</h2>{report.unstableWords.length ? <div className="mt-4 flex flex-wrap gap-2">{report.unstableWords.map((word) => <span key={word} className="rounded-full bg-amber-50 px-3 py-2 text-sm font-bold text-amber-800">{word}</span>)}</div> : <p className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">本次已完成题目表现稳定，继续保持！</p>}<label htmlFor="overall-note" className="mt-6 block text-sm font-black">老师整体观察</label><textarea id="overall-note" value={session.overallNote ?? ""} onChange={(event) => onOverallNote(event.target.value.slice(0, 500))} placeholder="记录课堂状态、表达特点或后续沟通重点…" className="no-print mt-2 min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6" /><p className="hidden whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm print:block">{session.overallNote || "暂无整体备注"}</p></section>
      </div>
      {notes.length > 0 && <section className="mt-8"><h2 className="text-xl font-black">逐题观察记录</h2><div className="mt-4 grid gap-3 md:grid-cols-2">{notes.map((attempt) => { const question = questionById[attempt.questionId]; return <article key={attempt.questionId} className="rounded-2xl border border-slate-100 bg-white p-4"><p className="text-sm font-black">{question?.promptEn ?? attempt.questionId}</p><p className="mt-1 text-xs font-bold text-[#356FD1]">{question ? skillLabels[question.skill] : "观察"}</p><p className="mt-3 text-sm leading-6 text-slate-600">{attempt.note}</p></article>; })}</div></section>}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-slate-50 p-3 text-center"><strong className="block text-lg">{value}</strong><span className="text-xs font-bold text-slate-500">{label}</span></div>;
}

function formatDuration(durationMs: number) {
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  return `${minutes}分${seconds}秒`;
}
