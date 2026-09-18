import Link from "next/link";
import { ArrowRight, BookOpenCheck, GraduationCap, Library, Sparkles, Swords } from "lucide-react";
import { AppHeader } from "@/components/ui/AppHeader";

const adventures = [
  {
    href: "/assessment/",
    eyebrow: "English Assessment",
    title: "英语能力摸底",
    description: "听力、词汇、口语、认读、拼读和句子理解，完成原有 7 关冒险。",
    icon: GraduationCap,
    emoji: "🏝️",
    accent: "#DFF3FF",
    border: "hover:border-blue-300",
    action: "进入英语冒险",
  },
  {
    href: "/grammar/",
    eyebrow: "Grammar Galaxy",
    title: "语法星球",
    description: "从 I am、You are 到单复数和第三人称，循序渐进闯过 10 关。",
    icon: BookOpenCheck,
    emoji: "🪐",
    accent: "#E9DEFF",
    border: "hover:border-violet-300",
    action: "进入语法冒险",
  },
  {
    href: "/sentence-battle/",
    eyebrow: "Sentence Battle",
    title: "句型打怪岛",
    description: "排列问句、选择答句，挑战 18 个句型训练，答对就能击败小怪物。",
    icon: Swords,
    emoji: "🐲",
    accent: "#CFF3C5",
    border: "hover:border-emerald-300",
    action: "进入句型挑战",
  },
] as const;

export function AdventureHub() {
  return (
    <div className="min-h-screen">
      <AppHeader actions={<Link href="/words/" className="game-button flex min-h-12 items-center gap-2 border border-blue-100 bg-white px-4 text-sm text-slate-700 shadow-sm hover:bg-blue-50"><Library className="size-5" /><span className="hidden sm:inline">词汇宝库</span></Link>} />
      <main className="mx-auto w-full max-w-6xl px-4 pb-14 pt-5 sm:px-6 lg:px-8 lg:pt-10">
        <header className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-[#356FD1] shadow-sm ring-1 ring-blue-100"><Sparkles className="size-4" />选择今天的英语冒险</span>
          <h1 className="mt-5 text-4xl font-black tracking-[-0.04em] text-[#24324A] sm:text-5xl">想挑战哪一座岛？</h1>
          <p className="mt-3 text-base font-bold leading-7 text-slate-500 sm:text-lg">三个板块独立保存进度，可以随时回来继续。</p>
        </header>

        <section className="mt-9 grid gap-5 lg:grid-cols-3" aria-label="英语冒险板块">
          {adventures.map((adventure) => {
            const Icon = adventure.icon;
            return (
              <Link key={adventure.href} href={adventure.href} className={`paper-panel group relative flex min-h-80 flex-col overflow-hidden rounded-[32px] border-2 border-transparent p-6 transition hover:-translate-y-1 hover:shadow-2xl focus-visible:outline-4 sm:p-8 ${adventure.border}`}>
                <span className="absolute -right-6 -top-8 text-[9rem] opacity-10" aria-hidden="true">{adventure.emoji}</span>
                <div className="relative flex items-start justify-between gap-4">
                  <span className="grid size-16 place-items-center rounded-[22px] text-3xl shadow-sm" style={{ backgroundColor: adventure.accent }} aria-hidden="true">{adventure.emoji}</span>
                  <span className="grid size-11 place-items-center rounded-full bg-white text-[#4F8EF7] shadow-sm"><Icon className="size-5" aria-hidden="true" /></span>
                </div>
                <p className="relative mt-7 text-sm font-black uppercase tracking-[0.16em] text-[#4F8EF7]">{adventure.eyebrow}</p>
                <h2 className="relative mt-2 text-3xl font-black">{adventure.title}</h2>
                <p className="relative mt-3 max-w-lg text-base font-semibold leading-7 text-slate-500">{adventure.description}</p>
                <span className="relative mt-auto flex items-center justify-between border-t border-slate-100 pt-6 text-base font-black text-[#356FD1]">{adventure.action}<ArrowRight className="size-5 transition group-hover:translate-x-1" /></span>
              </Link>
            );
          })}
        </section>
      </main>
    </div>
  );
}
