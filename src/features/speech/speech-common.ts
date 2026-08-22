export type Accent = "en-US" | "en-GB";
export type SpeechPurpose = "sentence" | "word" | "phonics";
export type PronunciationRecording = {
  url: string;
  format: "audio/mpeg" | "audio/ogg";
  sourceUrl: string;
  author: string;
  license: string;
  licenseUrl: string;
};
export type SpeakOptions = {
  accent: Accent;
  purpose: SpeechPurpose;
  rate?: number;
  sourceId?: string;
  recording?: PronunciationRecording;
};

const preferredVoiceNames = [
  /natural/i,
  /neural/i,
  /google.*english/i,
  /microsoft.*(aria|jenny|guy|sonia|ryan)/i,
  /samantha|daniel|karen|moira/i,
];

/** Text normalization used only by the Web Speech fallback. */
export function prepareEnglishSpeech(text: string, purpose: SpeechPurpose = "sentence") {
  const normalized = text.trim().replace(/\s+/g, " ");
  if (purpose !== "sentence") return normalized;
  return normalized.replace(/(^|[\s“"'(])a(?=\s+[a-z])/gi, "$1uh");
}

export function rankEnglishVoice(voice: SpeechSynthesisVoice, accent: Accent = "en-US") {
  const language = voice.lang.toLowerCase();
  let score = language === accent.toLowerCase() ? 120 : language.startsWith("en-") ? 70 : 0;
  if (voice.localService) score += 10;
  preferredVoiceNames.forEach((pattern, index) => {
    if (pattern.test(voice.name)) score += 30 - index;
  });
  if (/compact|espeak/i.test(voice.name)) score -= 20;
  return score;
}

export function pickEnglishVoice(voices: SpeechSynthesisVoice[], accent: Accent = "en-US") {
  return [...voices]
    .filter((voice) => voice.lang.toLowerCase() === accent.toLowerCase())
    .sort((a, b) => rankEnglishVoice(b, accent) - rankEnglishVoice(a, accent))[0] ?? null;
}
