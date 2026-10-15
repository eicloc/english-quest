import { Suspense } from "react";
import { PracticePage } from "@/components/unit-practice/PracticePage";
export default function SchoolPlayPage() {
  return <Suspense fallback={<main className="grid min-h-screen place-items-center font-black">正在打开校园挑战…</main>}><PracticePage view="play" /></Suspense>;
}
