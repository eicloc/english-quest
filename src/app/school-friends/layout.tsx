import type { Metadata } from "next";
import { PracticeProvider } from "@/features/unit-practice/practice-context";

export const metadata: Metadata = { title: "校园礼貌岛 · English Quest", description: "Good morning与Nice to meet you两关，共38题口头交流、拼词和句子排序。" };
export default function SchoolLayout({ children }: { children: React.ReactNode }) {
  return <PracticeProvider collection="school">{children}</PracticeProvider>;
}
