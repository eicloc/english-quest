import { Suspense } from "react";
import { WordsScreen } from "@/components/dictionary/WordsScreen";

export default function WordsPage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center font-extrabold text-slate-600">正在打开词汇宝库…</main>}>
      <WordsScreen />
    </Suspense>
  );
}
