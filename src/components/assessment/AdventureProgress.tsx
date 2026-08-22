"use client";

import { Flame, Star } from "lucide-react";

export function AdventureProgress({ completed, total, stars, streak }: { completed: number; total: number; stars: number; streak: number }) {
  const percent = total ? Math.min(100, Math.max(3, completed / total * 100)) : 3;
  return (
    <div className="no-print flex items-center gap-3">
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-white shadow-inner" role="progressbar" aria-label="闯关进度" aria-valuemin={0} aria-valuemax={total} aria-valuenow={completed}><div className="h-full rounded-full bg-[#4F8EF7] transition-all" style={{ width: `${percent}%` }} /></div>
      <span className="hidden min-w-12 text-sm font-black text-slate-500 sm:block">{completed}/{total}</span>
      {streak > 0 && <span className="flex min-h-10 items-center gap-1 rounded-full bg-orange-50 px-3 text-sm font-black text-orange-600" aria-label={`连续答对 ${streak} 题`}><Flame className="size-4 fill-orange-400" />{streak}</span>}
      <span className="flex min-h-10 items-center gap-1 rounded-full bg-[#FFF0B8] px-3 font-black"><Star className="size-4 fill-amber-400 text-amber-500" />{stars}</span>
    </div>
  );
}
