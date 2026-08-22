"use client";

import { CheckCircle2, HelpCircle, Sprout } from "lucide-react";
import type { ManualScore } from "@/features/assessment/types";

const scoreOptions: Array<{ score: ManualScore; title: string; short: string; icon: typeof CheckCircle2; color: string }> = [
  { score: 2, title: "独立完成", short: "2分", icon: CheckCircle2, color: "border-emerald-300 bg-emerald-50 text-emerald-800" },
  { score: 1, title: "提示后完成", short: "1分", icon: HelpCircle, color: "border-amber-300 bg-amber-50 text-amber-800" },
  { score: 0, title: "暂时不会", short: "0分", icon: Sprout, color: "border-blue-200 bg-blue-50 text-blue-800" },
];

export function ManualScoreButtons({ value, onChange, compact = false, label = "老师评分" }: { value?: ManualScore; onChange: (score: ManualScore) => void; compact?: boolean; label?: string }) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">{label}</legend>
      <div className={`grid grid-cols-3 ${compact ? "gap-2" : "gap-3"}`}>
        {scoreOptions.map(({ score, title, short, icon: Icon, color }) => (
          <button key={score} type="button" aria-pressed={value === score} onClick={() => onChange(score)} className={`game-button border-2 ${compact ? "min-h-14 px-2" : "min-h-20 px-3"} ${value === score ? `${color} ring-4 ring-blue-100` : "border-slate-100 bg-white text-slate-600"}`}>
            <Icon className={`mx-auto ${compact ? "size-4" : "size-5"}`} /><strong className="mt-1 block text-xs sm:text-sm">{compact ? short : title}</strong>{!compact && <span className="text-xs opacity-65">{short}</span>}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
