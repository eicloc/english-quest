"use client";

import { useSearchParams } from "next/navigation";
import { GreetingsReportScreen } from "@/components/greetings/GreetingsReportScreen";

export function GreetingsReportPageContent() {
  const sessionId = useSearchParams().get("session") ?? "";
  return <GreetingsReportScreen sessionId={sessionId} />;
}
