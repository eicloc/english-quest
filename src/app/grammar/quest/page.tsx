import { Suspense } from "react";
import { GrammarQuestPageContent } from "./quest-page-content";

export default function GrammarQuestPage() {
  return <Suspense fallback={<main className="grid min-h-screen place-items-center font-black">正在打开语法地图…</main>}><GrammarQuestPageContent /></Suspense>;
}
