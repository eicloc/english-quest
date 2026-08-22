"use client";

import { DualAccentAudioButtons } from "@/components/speech/DualAccentAudioButtons";
import type { SpeechPurpose } from "@/hooks/useSpeech";

export function AudioPromptButton({ text, enabled, purpose = "sentence" }: { text: string; enabled: boolean; label?: string; purpose?: SpeechPurpose }) {
  return <DualAccentAudioButtons text={text} enabled={enabled} purpose={purpose} />;
}
