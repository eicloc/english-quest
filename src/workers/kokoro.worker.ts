/// <reference lib="webworker" />

import { KokoroTTS } from "kokoro-js";
import { cleanGeneratedSamples } from "@/features/speech/audio-processing";
import type { KokoroWorkerRequest, KokoroWorkerResponse } from "@/features/speech/worker-protocol";

const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";
const VOICES = { "en-US": "af_heart", "en-GB": "bf_emma" } as const;
const workerScope = self as DedicatedWorkerGlobalScope;
const cancelled = new Set<string>();
const downloads = new Map<string, { loaded: number; total: number }>();
let modelPromise: Promise<KokoroTTS> | undefined;
let processing = false;
let queuedRequest: Extract<KokoroWorkerRequest, { type: "speak" }> | undefined;

function send(message: KokoroWorkerResponse, transfer: Transferable[] = []) {
  workerScope.postMessage(message, transfer);
}

function getModel() {
  if (!modelPromise) {
    modelPromise = KokoroTTS.from_pretrained(MODEL_ID, {
      dtype: "q8",
      device: "wasm",
      progress_callback: (progress) => {
        if (progress.status !== "progress") return;
        downloads.set(progress.file, { loaded: progress.loaded, total: progress.total });
        const totals = [...downloads.values()].reduce((sum, item) => ({ loaded: sum.loaded + item.loaded, total: sum.total + item.total }), { loaded: 0, total: 0 });
        send({ type: "progress", ...totals, percent: totals.total ? Math.round((totals.loaded / totals.total) * 100) : progress.progress });
      },
    }).then((model) => {
      send({ type: "ready" });
      return model;
    }).catch((error: unknown) => {
      modelPromise = undefined;
      throw error;
    });
  }
  return modelPromise;
}

async function synthesize(request: Extract<KokoroWorkerRequest, { type: "speak" }>) {
  try {
    const model = await getModel();
    if (cancelled.delete(request.id)) return;
    const audio = await model.generate(request.text, { voice: VOICES[request.accent], speed: request.rate });
    if (cancelled.delete(request.id)) return;
    const samples = cleanGeneratedSamples(audio.audio, audio.sampling_rate).buffer;
    send({ type: "audio", id: request.id, samples, sampleRate: audio.sampling_rate }, [samples]);
  } catch (error) {
    send({ type: "error", id: request.id, message: error instanceof Error ? error.message : "Kokoro 语音生成失败" });
  }
}

workerScope.onmessage = (event: MessageEvent<KokoroWorkerRequest>) => {
  const request = event.data;
  if (request.type === "cancel") {
    cancelled.add(request.id);
    if (queuedRequest?.id === request.id) {
      queuedRequest = undefined;
      cancelled.delete(request.id);
    }
    return;
  }
  if (processing) {
    queuedRequest = request;
    return;
  }
  void processRequests(request);
};

async function processRequests(initial: Extract<KokoroWorkerRequest, { type: "speak" }>) {
  processing = true;
  let current: Extract<KokoroWorkerRequest, { type: "speak" }> | undefined = initial;
  while (current) {
    await synthesize(current);
    current = queuedRequest;
    queuedRequest = undefined;
  }
  processing = false;
}

export {};
