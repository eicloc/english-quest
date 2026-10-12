import { Suspense } from "react";
import { GreetingsPlayPageContent } from "./play-page-content";

export default function GreetingsPlayPage() {
  return <Suspense fallback={<main className="grid min-h-screen place-items-center font-black">正在前往交朋友挑战…</main>}><GreetingsPlayPageContent /></Suspense>;
}
