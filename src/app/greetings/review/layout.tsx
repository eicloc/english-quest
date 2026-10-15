import type { Metadata } from "next";
import { PracticeProvider } from "@/features/unit-practice/practice-context";

export const metadata: Metadata = { title: "问候交朋友·复习挑战 · English Quest", description: "第一、二部分40题进阶复习：换角色、主动反问、完整对话和句子排序。" };
export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  return <PracticeProvider collection="review">{children}</PracticeProvider>;
}
