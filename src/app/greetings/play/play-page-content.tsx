"use client";

import { useSearchParams } from "next/navigation";
import { GreetingsPlayScreen } from "@/components/greetings/GreetingsPlayScreen";

export function GreetingsPlayPageContent() {
  const sessionId = useSearchParams().get("session") ?? "";
  return <GreetingsPlayScreen sessionId={sessionId} />;
}
