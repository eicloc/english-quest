import { Suspense } from "react";
import { ReportPageContent } from "./report-page-content";

export default function ReportPage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center font-extrabold text-slate-600">正在整理冒险报告…</main>}>
      <ReportPageContent />
    </Suspense>
  );
}
