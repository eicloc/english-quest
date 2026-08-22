"use client";

import { LoaderCircle, Square, Volume2, VolumeX } from "lucide-react";
import { useEffect, useId } from "react";
import { useSpeech, type Accent, type PronunciationRecording, type SpeechPurpose } from "@/hooks/useSpeech";

const ACCENTS: { accent: Accent; short: string; label: string }[] = [
  { accent: "en-US", short: "US", label: "美音" },
  { accent: "en-GB", short: "UK", label: "英音" },
];

export function DualAccentAudioButtons({ text, enabled, purpose = "sentence", rate, compact = false, onBeforeSpeak, recordings }: { text: string; enabled: boolean; purpose?: SpeechPurpose; rate?: number; compact?: boolean; onBeforeSpeak?: () => void; recordings?: Partial<Record<Accent, PronunciationRecording>> }) {
  const sourceId = useId();
  const { supported, speaking, phase, currentAccent, activeSourceId, speak, stop, preloadRecording, modelStatus, progress, error } = useSpeech(enabled);
  const canPlay = supported && enabled && Boolean(text.trim());
  const groupActive = speaking && activeSourceId === sourceId;

  useEffect(() => {
    preloadRecording(recordings?.["en-US"]);
    preloadRecording(recordings?.["en-GB"]);
  }, [preloadRecording, recordings]);

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <div className="inline-flex flex-wrap items-center justify-center gap-2" role="group" aria-label={`${text} 的英美发音`}>
        {ACCENTS.map(({ accent, short, label }) => {
          const active = groupActive && currentAccent === accent;
          return (
            <button
              key={accent}
              type="button"
              disabled={!canPlay}
              onClick={() => {
                if (active) stop();
                else {
                  onBeforeSpeak?.();
                  void speak(text, { accent, purpose, rate, sourceId, recording: recordings?.[accent] });
                }
              }}
              aria-label={canPlay ? `${label}播放：${text}` : "当前语音不可用"}
              className={`game-button inline-flex items-center justify-center gap-2 bg-blue-50 font-black text-[#356FD1] disabled:cursor-not-allowed disabled:opacity-55 ${compact ? "min-h-11 rounded-xl px-3 text-xs" : "min-h-14 px-5 text-sm"}`}
            >
              {!canPlay ? <VolumeX className="size-4" /> : active && phase === "preparing" ? <LoaderCircle className="size-4 animate-spin" /> : active ? <Square className="size-4 fill-current" /> : <Volume2 className="size-4" />}
              <span>{short} · {label}</span>
            </button>
          );
        })}
      </div>
      {groupActive && phase === "preparing" && <span role="status" className="text-xs font-bold text-slate-500">{modelStatus === "loading" ? `首次准备本地回退语音${progress.percent !== undefined ? ` · ${Math.min(100, progress.percent)}%` : "…"}` : "正在准备发音…"}</span>}
      {activeSourceId === sourceId && modelStatus === "error" && error && <span role="status" className="max-w-xs text-xs font-bold text-amber-700" title={error}>{currentAccent === "en-GB" ? "英音" : "美音"}暂时无法播放</span>}
    </div>
  );
}
