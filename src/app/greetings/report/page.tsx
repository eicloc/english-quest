import { Suspense } from "react";
import { GreetingsReportPageContent } from "./report-page-content";

export default function GreetingsReportPage() {
  return <Suspense fallback={<main className="grid min-h-screen place-items-center font-black">正在整理挑战结果…</main>}><GreetingsReportPageContent /></Suspense>;
}
