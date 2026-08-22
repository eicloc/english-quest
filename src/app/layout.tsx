import type { Metadata } from "next";
import { AssessmentProvider } from "@/features/assessment/assessment-context";
import { SpeechProvider } from "@/features/speech/speech-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "English Quest · 英语闯关岛",
  description: "为二年级孩子设计的轻松英语互动摸底冒险。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full">
        <SpeechProvider><AssessmentProvider>{children}</AssessmentProvider></SpeechProvider>
      </body>
    </html>
  );
}
