"use client";

import { useSearchParams } from "next/navigation";
import { QuestScreen } from "@/components/quest/QuestScreen";

export function QuestPageContent() {
  const sessionId = useSearchParams().get("session");

  if (!sessionId) {
    return <main className="grid min-h-screen place-items-center p-6 text-center font-bold text-slate-600">没有找到这次冒险，请返回首页重新开始。</main>;
  }

  return <QuestScreen sessionId={sessionId} />;
}
