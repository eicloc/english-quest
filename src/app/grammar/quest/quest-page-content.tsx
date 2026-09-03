"use client";

import { useSearchParams } from "next/navigation";
import { GrammarQuestScreen } from "@/components/grammar/GrammarQuestScreen";

export function GrammarQuestPageContent() {
  const sessionId = useSearchParams().get("session");
  if (!sessionId) return <main className="grid min-h-screen place-items-center p-6 text-center font-bold text-slate-600">没有找到这次语法冒险，请返回语法星球重新开始。</main>;
  return <GrammarQuestScreen sessionId={sessionId} />;
}
