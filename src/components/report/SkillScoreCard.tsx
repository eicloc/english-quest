import { skillLabels } from "@/features/assessment/scoring";
import type { SkillResult } from "@/features/assessment/types";

const skillIcons: Record<SkillResult["skill"], string> = { listening: "👂", vocabulary: "🧺", speaking: "💬", sceneComprehension: "🔎", wordRecognition: "📖", phonics: "🧪", sentenceComprehension: "🌉" };

export function SkillScoreCard({ result }: { result: SkillResult }) {
  const percentage = result.percentage ?? 0;
  const observation = result.percentage === undefined ? "尚无足够证据" : result.percentage >= 85 ? "表现稳定，可适当增加挑战" : result.percentage >= 65 ? "大部分任务能够完成" : result.percentage >= 40 ? "部分任务需要提示" : "建议从轻松启蒙活动开始";
  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-4">
      <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-xl" aria-hidden="true">{skillIcons[result.skill]}</span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><h3 className="font-black">{skillLabels[result.skill]}</h3><strong className="text-[#356FD1]">{result.percentage === undefined ? "—" : `${result.percentage}%`}</strong></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#4F8EF7]" style={{ width: `${percentage}%` }} /></div></div></div>
      <div className="mt-3 flex items-center justify-between text-xs font-bold text-slate-500"><span>{result.level}</span><span>{result.possible ? `${result.earned}/${result.possible} 分` : "暂无作答证据"}</span></div>
      <p className="mt-2 text-xs leading-5 text-slate-500">典型表现：{observation} · 依据 {result.evidenceQuestionIds.length} 题</p>
    </article>
  );
}
