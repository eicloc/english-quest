"use client";

import Link from "next/link";
import { Leaf, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

export function AppHeader({ actions }: { actions?: ReactNode }) {
  return (
    <header className="no-print mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
      <Link href="/" className="flex items-center gap-3 rounded-2xl focus-visible:outline-4">
        <span className="relative grid size-12 place-items-center rounded-2xl bg-[#4F8EF7] text-white shadow-lg shadow-blue-200">
          <Leaf className="size-6" aria-hidden="true" />
          <Sparkles className="absolute -right-1 -top-1 size-4 text-[#FFD86B]" aria-hidden="true" />
        </span>
        <span><strong className="block text-lg font-black tracking-tight sm:text-xl">English Quest</strong><span className="block text-xs font-bold text-slate-500">英语闯关岛</span></span>
      </Link>
      {actions}
    </header>
  );
}
