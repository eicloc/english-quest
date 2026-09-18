import { Suspense } from "react";
import { BattlePlayPageContent } from "./play-page-content";

export default function SentenceBattlePlayPage() {
  return <Suspense fallback={<main className="grid min-h-screen place-items-center font-bold">正在前往句型打怪岛…</main>}><BattlePlayPageContent /></Suspense>;
}
