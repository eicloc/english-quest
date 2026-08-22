"use client";

import { useCallback } from "react";
import { useSpeechContext } from "@/features/speech/speech-context";
import type { SpeakOptions } from "@/features/speech/speech-common";

export type { Accent, PronunciationRecording, SpeakOptions, SpeechPurpose } from "@/features/speech/speech-common";
export { pickEnglishVoice, prepareEnglishSpeech, rankEnglishVoice } from "@/features/speech/speech-common";

export function useSpeech(enabled: boolean) {
  const speech = useSpeechContext();
  const { speak: speakSpeech, playSuccessTone: playSuccessToneSpeech, playErrorTone: playErrorToneSpeech } = speech;
  const speak = useCallback((text: string, options: SpeakOptions) => {
    if (!enabled) return Promise.resolve();
    return speakSpeech(text, options);
  }, [enabled, speakSpeech]);
  const playSuccessTone = useCallback(() => {
    if (!enabled) return Promise.resolve();
    return playSuccessToneSpeech();
  }, [enabled, playSuccessToneSpeech]);
  const playErrorTone = useCallback(() => {
    if (!enabled) return Promise.resolve();
    return playErrorToneSpeech();
  }, [enabled, playErrorToneSpeech]);
  return { ...speech, speak, playSuccessTone, playErrorTone };
}
