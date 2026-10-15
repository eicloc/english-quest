import { Suspense } from "react";
import { PracticePage } from "@/components/unit-practice/PracticePage";
export default function ReviewReportPage() {
  return <Suspense fallback={<main className="grid min-h-screen place-items-center font-black">正在整理复习结果…</main>}><PracticePage view="report" /></Suspense>;
}
