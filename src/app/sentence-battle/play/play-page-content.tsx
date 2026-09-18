"use client";

import { useSearchParams } from "next/navigation";
import { BattleScreen } from "@/components/sentence-battle/BattleScreen";

export function BattlePlayPageContent() {
  const trainingId = useSearchParams().get("training");
  return <BattleScreen key={trainingId} trainingId={trainingId} />;
}
