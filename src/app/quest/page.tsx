import { Suspense } from "react";
import { QuestPageContent } from "./quest-page-content";

export default function QuestPage() {
  return (
    <Suspense fallback={<PageLoading label="正在打开冒险地图…" />}>
      <QuestPageContent />
    </Suspense>
  );
}

function PageLoading({ label }: { label: string }) {
  return <main className="grid min-h-screen place-items-center font-extrabold text-slate-600">{label}</main>;
}
