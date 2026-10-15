import { Suspense } from "react";
import { PracticePage } from "@/components/unit-practice/PracticePage";
export default function ReviewPlayPage() {
  return <Suspense fallback={<main className="grid min-h-screen place-items-center font-black">正在打开复习挑战…</main>}><PracticePage view="play" /></Suspense>;
}
