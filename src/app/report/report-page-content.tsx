"use client";

import { useSearchParams } from "next/navigation";
import { ReportScreen } from "@/components/report/ReportScreen";

export function ReportPageContent() {
  const sessionId = useSearchParams().get("session");

  if (!sessionId) {
    return <main className="grid min-h-screen place-items-center p-6 text-center font-bold text-slate-600">没有找到这份报告，请返回首页查看冒险记录。</main>;
  }

  return <ReportScreen sessionId={sessionId} />;
}
