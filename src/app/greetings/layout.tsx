import type { Metadata } from "next";
import { GreetingsProvider } from "@/features/greetings/greetings-context";

export const metadata: Metadata = {
  title: "问候交朋友 · English Quest",
  description: "Hello! 和 How are you? 口头交流与字母拼词，26道一对一互动挑战。",
};

export default function GreetingsLayout({ children }: { children: React.ReactNode }) {
  return <GreetingsProvider>{children}</GreetingsProvider>;
}
