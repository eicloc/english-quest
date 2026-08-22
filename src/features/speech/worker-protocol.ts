import type { Accent, SpeechPurpose } from "./speech-common";

export type KokoroWorkerRequest =
  | { type: "speak"; id: string; text: string; accent: Accent; purpose: SpeechPurpose; rate: number }
  | { type: "cancel"; id: string };

export type KokoroWorkerResponse =
  | { type: "progress"; loaded: number; total: number; percent?: number }
  | { type: "ready" }
  | { type: "audio"; id: string; samples: ArrayBuffer; sampleRate: number }
  | { type: "error"; id?: string; message: string };
