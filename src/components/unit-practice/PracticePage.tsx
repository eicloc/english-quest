"use client";

import { useSearchParams } from "next/navigation";
import { PracticePlayScreen } from "./PracticePlayScreen";
import { PracticeReportScreen } from "./PracticeReportScreen";

export function PracticePage({ view }: { view: "play" | "report" }) {
  const sessionId = useSearchParams().get("session") ?? "";
  return view === "play" ? <PracticePlayScreen sessionId={sessionId} /> : <PracticeReportScreen sessionId={sessionId} />;
}
