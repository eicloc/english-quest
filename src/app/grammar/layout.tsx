import { GrammarProvider } from "@/features/grammar/grammar-context";

export default function GrammarLayout({ children }: LayoutProps<"/grammar">) {
  return <GrammarProvider>{children}</GrammarProvider>;
}
