"use client";

import { useSearchParams } from "next/navigation";
import { GrammarReportScreen } from "@/components/grammar/GrammarReportScreen";

export function GrammarReportPageContent() {
  const sessionId = useSearchParams().get("session");
  if (!sessionId) return <main className="grid min-h-screen place-items-center p-6 text-center font-bold text-slate-600">没有找到语法报告，请返回语法星球查看记录。</main>;
  return <GrammarReportScreen sessionId={sessionId} />;
}
