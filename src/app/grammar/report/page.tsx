import { Suspense } from "react";
import { GrammarReportPageContent } from "./report-page-content";

export default function GrammarReportPage() {
  return <Suspense fallback={<main className="grid min-h-screen place-items-center font-black">正在生成语法报告…</main>}><GrammarReportPageContent /></Suspense>;
}
