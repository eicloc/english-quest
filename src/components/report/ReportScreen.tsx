"use client";

import { Download, Home, Printer, ScrollText, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppHeader } from "@/components/ui/AppHeader";
import { useAssessment } from "@/features/assessment/assessment-context";
import { buildReport } from "@/features/assessment/scoring";
import { StudentRewardView } from "./StudentRewardView";
import { TeacherReportView } from "./TeacherReportView";

export function ReportScreen({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const { data, dispatch, hydrated } = useAssessment();
  const [view, setView] = useState<"reward" | "teacher">("reward");
  const session = data.sessions.find((item) => item.id === sessionId);
  if (!hydrated) return <main className="grid min-h-screen place-items-center font-black">正在整理冒险宝藏…</main>;
  if (!session) return <main className="grid min-h-screen place-items-center p-4"><section className="paper-panel max-w-md rounded-[30px] p-8 text-center"><span className="text-6xl">📭</span><h1 className="mt-5 text-3xl font-black">没有找到这份报告</h1><button type="button" onClick={() => router.push("/")} className="game-button primary-button mt-6 px-6">返回欢迎页</button></section></main>;
  const report = buildReport(session);

  function exportJson() {
    if (!session) return;
    const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), session }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeName = session.studentName.replace(/[\\/:*?"<>|]/g, "-") || "小勇士";
    link.href = url;
    link.download = `english-quest-${safeName}-${session.createdAt.slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen">
      <AppHeader actions={<div className="flex items-center gap-2"><button type="button" onClick={() => router.push("/")} className="game-button flex min-h-11 items-center gap-2 bg-white px-4 text-sm shadow-sm"><Home className="size-4" /><span className="hidden sm:inline">首页</span></button></div>} />
      <main className="mx-auto w-full max-w-[1180px] px-4 pb-12 sm:px-6 lg:px-8">
        <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-2 shadow-sm">
          <div className="flex gap-2"><button type="button" onClick={() => setView("reward")} className={`game-button flex min-h-11 items-center gap-2 px-4 text-sm ${view === "reward" ? "bg-[#24324A] text-white" : "bg-slate-50 text-slate-600"}`}><Sparkles className="size-4" />孩子奖励</button><button type="button" onClick={() => setView("teacher")} className={`game-button flex min-h-11 items-center gap-2 px-4 text-sm ${view === "teacher" ? "bg-[#24324A] text-white" : "bg-slate-50 text-slate-600"}`}><ScrollText className="size-4" />老师报告</button></div>
          <div className="flex gap-2"><button type="button" onClick={() => window.print()} className="game-button flex min-h-11 items-center gap-2 bg-blue-50 px-4 text-sm text-[#356FD1]"><Printer className="size-4" />打印</button><button type="button" onClick={exportJson} className="game-button flex min-h-11 items-center gap-2 bg-blue-50 px-4 text-sm text-[#356FD1]"><Download className="size-4" />导出 JSON</button></div>
        </div>
        {view === "reward" ? <StudentRewardView session={session} report={report} /> : <TeacherReportView session={session} report={report} onOverallNote={(note) => dispatch({ type: "SET_OVERALL_NOTE", sessionId, note })} />}
      </main>
    </div>
  );
}
