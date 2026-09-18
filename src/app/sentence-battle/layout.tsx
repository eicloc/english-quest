import type { Metadata } from "next";
import { BattleProvider } from "@/features/sentence-battle/battle-context";

export const metadata: Metadata = {
  title: "句型打怪岛 · English Quest",
  description: "18 个句型训练，排列问句、选择答句，一起打败小怪物。",
};

export default function SentenceBattleLayout({ children }: { children: React.ReactNode }) {
  return <BattleProvider>{children}</BattleProvider>;
}
