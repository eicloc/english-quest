"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import type { KokoroWorkerResponse } from "./worker-protocol";
import { pickEnglishVoice, prepareEnglishSpeech, type Accent, type SpeakOptions } from "./speech-common";

export type SpeechModelStatus = "idle" | "loading" | "ready" | "error";
export type SpeechPhase = "preparing" | "playing";

type SpeechContextValue = {
  supported: boolean;
  speaking: boolean;
  phase?: SpeechPhase;
  speak: (text: string, options: SpeakOptions) => Promise<void>;
  preloadRecording: (options: SpeakOptions["recording"]) => void;
  stop: () => void;
  playSuccessTone: () => Promise<void>;
  playErrorTone: () => Promise<void>;
  modelStatus: SpeechModelStatus;
  progress: { loaded: number; total: number; percent?: number };
  currentAccent?: Accent;
  activeSourceId?: string;
  error?: string;
};

type PendingRequest = { text: string; options: SpeakOptions; cacheKey: string; resolve: () => void };
type CachedAudio = { samples: ArrayBuffer; sampleRate: number };
type ActiveSpeech = { id: string; sourceId: string; accent: Accent; phase?: SpeechPhase };

export const AUDIO_CACHE_LIMIT_BYTES = 16 * 1024 * 1024;
const SPEECH_OUTPUT_VOLUME = 1;
const FEEDBACK_TONE_GAIN = 0.22;

const unavailableSpeech: SpeechContextValue = {
  supported: false,
  speaking: false,
  speak: async () => undefined,
  preloadRecording: () => undefined,
  stop: () => undefined,
  playSuccessTone: async () => undefined,
  playErrorTone: async () => undefined,
  modelStatus: "idle",
  progress: { loaded: 0, total: 0 },
};
const SpeechContext = createContext<SpeechContextValue>(unavailableSpeech);

export function SpeechProvider({ children }: { children: ReactNode }) {
  const [modelStatus, setModelStatusState] = useState<SpeechModelStatus>("idle");
  const [progress, setProgress] = useState({ loaded: 0, total: 0, percent: undefined as number | undefined });
  const [activeSpeech, setActiveSpeechState] = useState<ActiveSpeech>();
  const [error, setError] = useState<string>();
  const workerRef = useRef<Worker | undefined>(undefined);
  const audioContextRef = useRef<AudioContext | undefined>(undefined);
  const sourceRef = useRef<AudioBufferSourceNode | undefined>(undefined);
  const effectRef = useRef<OscillatorNode | undefined>(undefined);
  const recordingRef = useRef<HTMLAudioElement | undefined>(undefined);
  const recordingResolveRef = useRef<((played: boolean) => void) | undefined>(undefined);
  const recordingCacheRef = useRef(new Map<string, HTMLAudioElement>());
  const utteranceRef = useRef<SpeechSynthesisUtterance | undefined>(undefined);
  const utteranceResolveRef = useRef<((played: boolean) => void) | undefined>(undefined);
  const activeSpeechRef = useRef<ActiveSpeech | undefined>(undefined);
  const modelStatusRef = useRef<SpeechModelStatus>("idle");
  const pendingRef = useRef(new Map<string, PendingRequest>());
  const audioCacheRef = useRef(new Map<string, CachedAudio>());
  const audioCacheBytesRef = useRef(0);
  const requestNumberRef = useRef(0);
  const effectNumberRef = useRef(0);

  const supported = useSyncExternalStore(subscribeToCapabilities, readCapabilities, () => false);

  const updateModelStatus = useCallback((status: SpeechModelStatus) => {
    modelStatusRef.current = status;
    setModelStatusState(status);
  }, []);

  const updateActiveSpeech = useCallback((next: ActiveSpeech | undefined) => {
    activeSpeechRef.current = next;
    setActiveSpeechState(next);
  }, []);

  const getAudioContext = useCallback(() => {
    const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return undefined;
    audioContextRef.current ??= new AudioContextClass({ latencyHint: "interactive" });
    return audioContextRef.current;
  }, []);

  const getRecordingAudio = useCallback((recording: NonNullable<SpeakOptions["recording"]>) => {
    const cached = recordingCacheRef.current.get(recording.url);
    if (cached) {
      recordingCacheRef.current.delete(recording.url);
      recordingCacheRef.current.set(recording.url, cached);
      return cached;
    }
    if (typeof Audio === "undefined") return undefined;
    const audio = new Audio();
    if (!audio.canPlayType(recording.format)) return undefined;
    audio.preload = "auto";
    audio.src = recording.url;
    audio.volume = SPEECH_OUTPUT_VOLUME;
    try { audio.load(); } catch { /* Loading will be retried by play(). */ }
    recordingCacheRef.current.set(recording.url, audio);
    while (recordingCacheRef.current.size > 8) {
      const oldest = recordingCacheRef.current.entries().next().value as [string, HTMLAudioElement] | undefined;
      if (!oldest) break;
      recordingCacheRef.current.delete(oldest[0]);
      if (oldest[1] !== recordingRef.current) {
        oldest[1].pause();
        oldest[1].removeAttribute("src");
      }
    }
    return audio;
  }, []);

  const preloadRecording = useCallback((recording: SpeakOptions["recording"]) => {
    if (recording) getRecordingAudio(recording);
  }, [getRecordingAudio]);

  const cancelRecording = useCallback(() => {
    const resolve = recordingResolveRef.current;
    recordingResolveRef.current = undefined;
    const audio = recordingRef.current;
    recordingRef.current = undefined;
    if (audio) {
      audio.onplaying = null;
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      try { audio.currentTime = 0; } catch { /* Some streams cannot seek before metadata loads. */ }
    }
    resolve?.(false);
  }, []);

  const cancelSystemVoice = useCallback(() => {
    const resolve = utteranceResolveRef.current;
    utteranceResolveRef.current = undefined;
    if (utteranceRef.current) {
      utteranceRef.current.onstart = null;
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
      utteranceRef.current = undefined;
    }
    if (typeof window !== "undefined" && typeof window.speechSynthesis?.cancel === "function") window.speechSynthesis.cancel();
    resolve?.(false);
  }, []);

  const stopEffect = useCallback(() => {
    effectNumberRef.current += 1;
    try { effectRef.current?.stop(); } catch { /* The tone may already have ended. */ }
    effectRef.current = undefined;
  }, []);

  const stop = useCallback(() => {
    const active = activeSpeechRef.current;
    if (active) {
      workerRef.current?.postMessage({ type: "cancel", id: active.id });
      pendingRef.current.get(active.id)?.resolve();
      pendingRef.current.delete(active.id);
      updateActiveSpeech({ ...active, phase: undefined });
    }
    try { sourceRef.current?.stop(); } catch { /* The source may already have ended. */ }
    sourceRef.current = undefined;
    cancelRecording();
    stopEffect();
    cancelSystemVoice();
  }, [cancelRecording, cancelSystemVoice, stopEffect, updateActiveSpeech]);

  const playRecording = useCallback((requestId: string, recording: NonNullable<SpeakOptions["recording"]>) => new Promise<boolean>((resolve) => {
    cancelRecording();
    const audio = getRecordingAudio(recording);
    if (!audio) {
      resolve(false);
      return;
    }
    let settled = false;
    const finish = (played: boolean) => {
      if (settled) return;
      settled = true;
      if (recordingRef.current === audio) recordingRef.current = undefined;
      recordingResolveRef.current = undefined;
      audio.onplaying = null;
      audio.onended = null;
      audio.onerror = null;
      if (activeSpeechRef.current?.id === requestId) updateActiveSpeech({ ...activeSpeechRef.current, phase: undefined });
      resolve(played);
    };
    audio.onplaying = () => {
      if (activeSpeechRef.current?.id === requestId) updateActiveSpeech({ ...activeSpeechRef.current, phase: "playing" });
    };
    audio.onended = () => finish(true);
    audio.onerror = () => finish(false);
    recordingRef.current = audio;
    recordingResolveRef.current = finish;
    try { audio.currentTime = 0; } catch { /* Playback will start from the beginning once metadata is ready. */ }
    void audio.play().catch(() => finish(false));
  }), [cancelRecording, getRecordingAudio, updateActiveSpeech]);

  const playSystemVoice = useCallback((requestId: string, text: string, options: SpeakOptions) => new Promise<boolean>((resolve) => {
    if (typeof window === "undefined" || typeof window.speechSynthesis === "undefined" || typeof SpeechSynthesisUtterance === "undefined") {
      if (activeSpeechRef.current?.id === requestId) updateActiveSpeech({ ...activeSpeechRef.current, phase: undefined });
      resolve(false);
      return;
    }
    cancelSystemVoice();
    let settled = false;
    const finish = (played: boolean) => {
      if (settled) return;
      settled = true;
      utteranceResolveRef.current = undefined;
      utteranceRef.current = undefined;
      if (activeSpeechRef.current?.id === requestId) updateActiveSpeech({ ...activeSpeechRef.current, phase: undefined });
      resolve(played);
    };
    const utterance = new SpeechSynthesisUtterance(prepareEnglishSpeech(text, options.purpose));
    utterance.voice = pickEnglishVoice(window.speechSynthesis.getVoices(), options.accent);
    utterance.lang = options.accent;
    utterance.rate = options.rate ?? defaultRate(options.purpose);
    utterance.pitch = 1.02;
    utterance.volume = SPEECH_OUTPUT_VOLUME;
    utterance.onstart = () => {
      if (activeSpeechRef.current?.id === requestId) updateActiveSpeech({ ...activeSpeechRef.current, phase: "playing" });
    };
    utterance.onend = () => finish(true);
    utterance.onerror = () => finish(false);
    utteranceRef.current = utterance;
    utteranceResolveRef.current = finish;
    try { window.speechSynthesis.speak(utterance); } catch { finish(false); }
  }), [cancelSystemVoice, updateActiveSpeech]);

  const playSamples = useCallback(async (requestId: string, clip: CachedAudio) => {
    const context = getAudioContext();
    if (!context) throw new Error("当前浏览器无法播放模型音频");
    if (context.state === "suspended") await context.resume();
    const active = activeSpeechRef.current;
    if (active?.id !== requestId) return;
    const values = new Float32Array(clip.samples);
    const buffer = context.createBuffer(1, values.length, clip.sampleRate);
    buffer.copyToChannel(values, 0);
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    sourceRef.current = source;
    updateActiveSpeech({ ...active, phase: "playing" });
    await new Promise<void>((resolve) => {
      source.onended = () => {
        if (sourceRef.current === source) sourceRef.current = undefined;
        resolve();
      };
      source.start();
    });
  }, [getAudioContext, updateActiveSpeech]);

  const readCachedAudio = useCallback((key: string) => {
    const cached = audioCacheRef.current.get(key);
    if (!cached) return undefined;
    audioCacheRef.current.delete(key);
    audioCacheRef.current.set(key, cached);
    return cached;
  }, []);

  const cacheAudio = useCallback((key: string, clip: CachedAudio) => {
    const existing = audioCacheRef.current.get(key);
    if (existing) audioCacheBytesRef.current -= existing.samples.byteLength;
    audioCacheRef.current.delete(key);
    audioCacheRef.current.set(key, clip);
    audioCacheBytesRef.current += clip.samples.byteLength;
    while (audioCacheBytesRef.current > AUDIO_CACHE_LIMIT_BYTES) {
      const oldestKey = audioCacheRef.current.keys().next().value as string | undefined;
      if (!oldestKey) break;
      const oldest = audioCacheRef.current.get(oldestKey);
      audioCacheRef.current.delete(oldestKey);
      audioCacheBytesRef.current -= oldest?.samples.byteLength ?? 0;
    }
  }, []);

  const ensureWorker = useCallback(() => {
    if (workerRef.current || typeof Worker === "undefined") return workerRef.current;
    const worker = new Worker(new URL("../../workers/kokoro.worker.ts", import.meta.url), { type: "module", name: "kokoro-speech" });
    worker.onmessage = async (event: MessageEvent<KokoroWorkerResponse>) => {
      const response = event.data;
      if (response.type === "progress") {
        updateModelStatus("loading");
        setProgress({ loaded: response.loaded, total: response.total, percent: response.percent });
        return;
      }
      if (response.type === "ready") {
        updateModelStatus("ready");
        setError(undefined);
        return;
      }
      if (response.type === "error") {
        updateModelStatus("error");
        setError(response.message);
        const request = response.id ? pendingRef.current.get(response.id) : undefined;
        if (response.id) pendingRef.current.delete(response.id);
        if (!response.id || !request || activeSpeechRef.current?.id !== response.id) {
          request?.resolve();
          return;
        }
        updateActiveSpeech({ ...activeSpeechRef.current, phase: undefined });
        request.resolve();
        return;
      }
      const request = pendingRef.current.get(response.id);
      if (!request || activeSpeechRef.current?.id !== response.id) {
        pendingRef.current.delete(response.id);
        request?.resolve();
        return;
      }
      pendingRef.current.delete(response.id);
      const clip = { samples: response.samples, sampleRate: response.sampleRate };
      cacheAudio(request.cacheKey, clip);
      try {
        await playSamples(response.id, clip);
      } catch (playbackError) {
        if (activeSpeechRef.current?.id !== response.id) {
          request.resolve();
          return;
        }
        setError(playbackError instanceof Error ? playbackError.message : "模型音频播放失败");
      } finally {
        if (activeSpeechRef.current?.id === response.id) updateActiveSpeech({ ...activeSpeechRef.current, phase: undefined });
        request.resolve();
      }
    };
    worker.onerror = () => {
      updateModelStatus("error");
      setError("Kokoro 初始化失败");
      const activeId = activeSpeechRef.current?.id;
      for (const [id, request] of pendingRef.current) {
        pendingRef.current.delete(id);
        if (id === activeId && activeSpeechRef.current) updateActiveSpeech({ ...activeSpeechRef.current, phase: undefined });
        request.resolve();
      }
      worker.terminate();
      workerRef.current = undefined;
    };
    workerRef.current = worker;
    return worker;
  }, [cacheAudio, playSamples, updateActiveSpeech, updateModelStatus]);

  const playModelSpeech = useCallback(async (requestId: string, text: string, options: SpeakOptions) => {
    const rate = options.rate ?? defaultRate(options.purpose);
    const cacheKey = `${options.accent}\u0000${options.purpose}\u0000${rate}\u0000${text}`;
    const context = getAudioContext();
    if (context?.state === "suspended") void context.resume();
    const cached = readCachedAudio(cacheKey);
    if (cached) {
      try {
        await playSamples(requestId, cached);
      } catch (playbackError) {
        setError(playbackError instanceof Error ? playbackError.message : "模型音频播放失败");
      } finally {
        if (activeSpeechRef.current?.id === requestId) updateActiveSpeech({ ...activeSpeechRef.current, phase: undefined });
      }
      return;
    }
    const worker = ensureWorker();
    if (!worker) {
      updateModelStatus("error");
      setError("此浏览器没有可用的语音播放方式");
      if (activeSpeechRef.current?.id === requestId) updateActiveSpeech({ ...activeSpeechRef.current, phase: undefined });
      return;
    }
    if (modelStatusRef.current === "idle") updateModelStatus("loading");
    await new Promise<void>((resolve) => {
      pendingRef.current.set(requestId, { text, options, cacheKey, resolve });
      worker.postMessage({ type: "speak", id: requestId, text, accent: options.accent, purpose: options.purpose, rate });
    });
  }, [ensureWorker, getAudioContext, playSamples, readCachedAudio, updateActiveSpeech, updateModelStatus]);

  const speak = useCallback(async (text: string, options: SpeakOptions) => {
    const normalizedText = text.trim().replace(/\s+/g, " ");
    if (!normalizedText) return;
    stop();
    const rate = options.rate ?? defaultRate(options.purpose);
    const requestId = `speech-${Date.now()}-${requestNumberRef.current += 1}`;
    const sourceId = options.sourceId ?? requestId;
    const resolvedOptions = { ...options, rate };
    setError(undefined);
    updateActiveSpeech({ id: requestId, sourceId, accent: options.accent, phase: "preparing" });
    if (options.recording) {
      const recorded = await playRecording(requestId, options.recording);
      if (activeSpeechRef.current?.id !== requestId || recorded) return;
      updateActiveSpeech({ ...activeSpeechRef.current, phase: "preparing" });
    }
    const systemPlayed = await playSystemVoice(requestId, normalizedText, resolvedOptions);
    if (activeSpeechRef.current?.id !== requestId || systemPlayed) return;
    updateActiveSpeech({ ...activeSpeechRef.current, phase: "preparing" });
    await playModelSpeech(requestId, normalizedText, resolvedOptions);
  }, [playModelSpeech, playRecording, playSystemVoice, stop, updateActiveSpeech]);

  const playFeedbackTone = useCallback(async (schedule: (oscillator: OscillatorNode, gain: GainNode, startTime: number) => number) => {
    stopEffect();
    const effectNumber = effectNumberRef.current;
    const context = getAudioContext();
    if (!context) return;
    if (context.state === "suspended") await context.resume();
    if (effectNumberRef.current !== effectNumber) return;
    const startTime = context.currentTime + 0.003;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    const duration = schedule(oscillator, gain, startTime);
    oscillator.connect(gain).connect(context.destination);
    effectRef.current = oscillator;
    await new Promise<void>((resolve) => {
      oscillator.onended = () => {
        if (effectRef.current === oscillator) effectRef.current = undefined;
        resolve();
      };
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    });
  }, [getAudioContext, stopEffect]);

  const playSuccessTone = useCallback(() => playFeedbackTone((oscillator, gain, startTime) => {
    oscillator.frequency.setValueAtTime(523, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(784, startTime + 0.16);
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.exponentialRampToValueAtTime(FEEDBACK_TONE_GAIN, startTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.24);
    return 0.24;
  }), [playFeedbackTone]);

  const playErrorTone = useCallback(() => playFeedbackTone((oscillator, gain, startTime) => {
    oscillator.frequency.setValueAtTime(330, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(294, startTime + 0.075);
    oscillator.frequency.setValueAtTime(262, startTime + 0.1);
    oscillator.frequency.exponentialRampToValueAtTime(220, startTime + 0.22);
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.exponentialRampToValueAtTime(FEEDBACK_TONE_GAIN, startTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.075);
    gain.gain.setValueAtTime(0.001, startTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(FEEDBACK_TONE_GAIN, startTime + 0.105);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);
    return 0.23;
  }), [playFeedbackTone]);

  useEffect(() => {
    const unlock = () => {
      document.removeEventListener("pointerdown", unlock, true);
      document.removeEventListener("keydown", unlock, true);
      const context = getAudioContext();
      if (context?.state === "suspended") void context.resume();
      if (typeof window.speechSynthesis?.getVoices === "function") window.speechSynthesis.getVoices();
    };
    document.addEventListener("pointerdown", unlock, true);
    document.addEventListener("keydown", unlock, true);
    return () => {
      document.removeEventListener("pointerdown", unlock, true);
      document.removeEventListener("keydown", unlock, true);
    };
  }, [getAudioContext]);

  useEffect(() => () => {
    workerRef.current?.terminate();
    sourceRef.current?.disconnect();
    effectRef.current?.disconnect();
    cancelRecording();
    recordingCacheRef.current.forEach((audio) => {
      audio.pause();
      audio.removeAttribute("src");
    });
    recordingCacheRef.current.clear();
    cancelSystemVoice();
    void audioContextRef.current?.close();
    pendingRef.current.forEach((request) => request.resolve());
    pendingRef.current.clear();
    audioCacheRef.current.clear();
    audioCacheBytesRef.current = 0;
  }, [cancelRecording, cancelSystemVoice]);

  const value = useMemo(() => ({
    supported,
    speaking: Boolean(activeSpeech?.phase),
    phase: activeSpeech?.phase,
    speak,
    preloadRecording,
    stop,
    playSuccessTone,
    playErrorTone,
    modelStatus,
    progress,
    currentAccent: activeSpeech?.accent,
    activeSourceId: activeSpeech?.sourceId,
    error,
  }), [activeSpeech, error, modelStatus, playErrorTone, playSuccessTone, preloadRecording, progress, speak, stop, supported]);
  return <SpeechContext.Provider value={value}>{children}</SpeechContext.Provider>;
}

export function useSpeechContext() {
  return useContext(SpeechContext);
}

function defaultRate(purpose: SpeakOptions["purpose"]) {
  if (purpose === "phonics") return 0.68;
  return purpose === "word" ? 0.78 : 0.85;
}

function subscribeToCapabilities() {
  return () => undefined;
}

function readCapabilities() {
  return typeof Worker !== "undefined" || (typeof window.speechSynthesis !== "undefined" && typeof SpeechSynthesisUtterance !== "undefined");
}
