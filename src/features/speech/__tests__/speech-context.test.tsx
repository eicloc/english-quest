import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AUDIO_CACHE_LIMIT_BYTES, SpeechProvider, useSpeechContext } from "@/features/speech/speech-context";
import type { KokoroWorkerRequest, KokoroWorkerResponse } from "@/features/speech/worker-protocol";
import { useSpeech } from "@/hooks/useSpeech";

class FakeWorker {
  static instances: FakeWorker[] = [];
  onmessage: ((event: MessageEvent<KokoroWorkerResponse>) => void | Promise<void>) | null = null;
  onerror: ((event: Event) => void) | null = null;
  messages: KokoroWorkerRequest[] = [];
  terminate = vi.fn();

  constructor() {
    FakeWorker.instances.push(this);
  }

  postMessage(message: KokoroWorkerRequest) {
    this.messages.push(message);
  }

  emit(message: KokoroWorkerResponse) {
    return this.onmessage?.({ data: message } as MessageEvent<KokoroWorkerResponse>);
  }
}

class FakeBufferSource {
  onended: (() => void) | null = null;
  buffer: AudioBuffer | null = null;
  connect = vi.fn();
  start = vi.fn();
  stop = vi.fn(() => this.finish());
  disconnect = vi.fn();

  finish() {
    const onended = this.onended;
    this.onended = null;
    onended?.();
  }
}

class FakeOscillator {
  onended: (() => void) | null = null;
  type = "sine";
  frequency = { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() };
  connect = vi.fn((node: unknown) => node);
  start = vi.fn();
  stop = vi.fn();
  disconnect = vi.fn();

  finish() {
    const onended = this.onended;
    this.onended = null;
    onended?.();
  }
}

class FakeAudioContext {
  static instances: FakeAudioContext[] = [];
  state: AudioContextState = "running";
  currentTime = 0;
  destination = {} as AudioDestinationNode;
  sources: FakeBufferSource[] = [];
  oscillators: FakeOscillator[] = [];
  gains: { gain: { setValueAtTime: ReturnType<typeof vi.fn>; exponentialRampToValueAtTime: ReturnType<typeof vi.fn> }; connect: ReturnType<typeof vi.fn> }[] = [];
  options?: AudioContextOptions;
  resume = vi.fn(async () => { this.state = "running"; });
  close = vi.fn(async () => undefined);

  constructor(options?: AudioContextOptions) {
    this.options = options;
    FakeAudioContext.instances.push(this);
  }

  createBuffer() {
    return { copyToChannel: vi.fn() } as unknown as AudioBuffer;
  }

  createBufferSource() {
    const source = new FakeBufferSource();
    this.sources.push(source);
    return source as unknown as AudioBufferSourceNode;
  }

  createOscillator() {
    const oscillator = new FakeOscillator();
    this.oscillators.push(oscillator);
    return oscillator as unknown as OscillatorNode;
  }

  createGain() {
    const gain = {
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
    };
    this.gains.push(gain);
    return gain as unknown as GainNode;
  }
}

const recording = {
  url: "https://upload.wikimedia.org/test.mp3",
  format: "audio/mpeg" as const,
  sourceUrl: "https://commons.wikimedia.org/wiki/File:test",
  author: "Tester",
  license: "CC BY 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
};

class FakeRecordingAudio {
  static instances: FakeRecordingAudio[] = [];
  static rejectPlayback = false;
  src = "";
  preload = "";
  volume = 0;
  currentTime = 0;
  onplaying: (() => void) | null = null;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  load = vi.fn();
  pause = vi.fn();
  removeAttribute = vi.fn();
  canPlayType = vi.fn(() => "probably");

  constructor() {
    FakeRecordingAudio.instances.push(this);
  }

  play = vi.fn(async () => {
    if (FakeRecordingAudio.rejectPlayback) throw new Error("recording unavailable");
    this.onplaying?.();
  });

  finish() {
    this.onended?.();
  }
}

function SpeechHarness() {
  const speech = useSpeechContext();
  return (
    <div>
      <button type="button" onClick={() => void speech.speak("apple", { accent: "en-US", purpose: "word", sourceId: "first" })}>first</button>
      <button type="button" onClick={() => void speech.speak("banana", { accent: "en-GB", purpose: "word", sourceId: "second" })}>second</button>
      <button type="button" onClick={() => speech.preloadRecording(recording)}>preload</button>
      <button type="button" onClick={() => void speech.speak("apple", { accent: "en-US", purpose: "word", sourceId: "recorded", recording })}>recorded</button>
      <button type="button" onClick={() => void speech.playSuccessTone()}>success</button>
      <button type="button" onClick={() => void speech.playErrorTone()}>error</button>
      <output data-testid="speech-state" data-source={speech.activeSourceId ?? ""} data-accent={speech.currentAccent ?? ""} data-phase={speech.phase ?? "idle"} />
    </div>
  );
}

function DisabledToneHarness() {
  const speech = useSpeech(false);
  return (
    <div>
      <button type="button" onClick={() => void speech.playSuccessTone()}>disabled success</button>
      <button type="button" onClick={() => void speech.playErrorTone()}>disabled error</button>
    </div>
  );
}

describe("SpeechProvider scheduling", () => {
  beforeEach(() => {
    FakeWorker.instances = [];
    FakeAudioContext.instances = [];
    vi.stubGlobal("Worker", FakeWorker);
    vi.stubGlobal("AudioContext", FakeAudioContext);
    vi.stubGlobal("speechSynthesis", undefined);
    vi.stubGlobal("SpeechSynthesisUtterance", undefined);
    FakeRecordingAudio.instances = [];
    FakeRecordingAudio.rejectPlayback = false;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps only the latest request active and reuses generated audio and one AudioContext", async () => {
    render(<SpeechProvider><SpeechHarness /></SpeechProvider>);
    fireEvent.click(screen.getByRole("button", { name: "first" }));
    await waitFor(() => expect(FakeWorker.instances).toHaveLength(1));
    const worker = FakeWorker.instances[0];
    const firstRequest = worker.messages.find((message) => message.type === "speak");
    expect(firstRequest?.type).toBe("speak");
    expect(screen.getByTestId("speech-state")).toHaveAttribute("data-source", "first");
    expect(screen.getByTestId("speech-state")).toHaveAttribute("data-phase", "preparing");

    fireEvent.click(screen.getByRole("button", { name: "second" }));
    await waitFor(() => expect(worker.messages.filter((message) => message.type === "speak")).toHaveLength(2));
    const speakMessages = worker.messages.filter((message) => message.type === "speak");
    const secondRequest = speakMessages[1];
    expect(worker.messages).toContainEqual({ type: "cancel", id: firstRequest && "id" in firstRequest ? firstRequest.id : "" });
    expect(screen.getByTestId("speech-state")).toHaveAttribute("data-source", "second");
    expect(screen.getByTestId("speech-state")).toHaveAttribute("data-accent", "en-GB");

    if (!firstRequest || firstRequest.type !== "speak" || !secondRequest || secondRequest.type !== "speak") throw new Error("Missing speech requests");
    await act(async () => { await worker.emit({ type: "audio", id: firstRequest.id, samples: new Float32Array([0.1]).buffer, sampleRate: 24000 }); });
    expect(FakeAudioContext.instances[0].sources).toHaveLength(0);

    await act(async () => { await worker.emit({ type: "ready" }); });
    let playback: void | Promise<void> | undefined;
    act(() => { playback = worker.emit({ type: "audio", id: secondRequest.id, samples: new Float32Array([0.1, 0.2]).buffer, sampleRate: 24000 }); });
    await waitFor(() => expect(screen.getByTestId("speech-state")).toHaveAttribute("data-phase", "playing"));
    act(() => FakeAudioContext.instances[0].sources[0].finish());
    await act(async () => { await playback; });
    expect(screen.getByTestId("speech-state")).toHaveAttribute("data-phase", "idle");

    fireEvent.click(screen.getByRole("button", { name: "second" }));
    expect(worker.messages.filter((message) => message.type === "speak")).toHaveLength(2);
    await waitFor(() => expect(FakeAudioContext.instances[0].sources).toHaveLength(2));
    expect(FakeAudioContext.instances[0].sources[1].connect).toHaveBeenCalledWith(FakeAudioContext.instances[0].destination);
    act(() => FakeAudioContext.instances[0].sources[1].finish());

    fireEvent.click(screen.getByRole("button", { name: "success" }));
    await waitFor(() => expect(FakeAudioContext.instances[0].oscillators).toHaveLength(1));
    expect(FakeAudioContext.instances).toHaveLength(1);
    expect(FakeAudioContext.instances[0].gains[0].gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.22, 0.008);
  });

  it("plays the two-pulse error tone at the shared feedback volume and replaces the previous tone", async () => {
    render(<SpeechProvider><SpeechHarness /></SpeechProvider>);
    fireEvent.click(screen.getByRole("button", { name: "success" }));
    await waitFor(() => expect(FakeAudioContext.instances[0].oscillators).toHaveLength(1));
    const context = FakeAudioContext.instances[0];
    const successOscillator = context.oscillators[0];

    fireEvent.click(screen.getByRole("button", { name: "error" }));
    await waitFor(() => expect(context.oscillators).toHaveLength(2));
    const errorOscillator = context.oscillators[1];
    const errorGain = context.gains[1].gain;

    expect(context.options).toEqual({ latencyHint: "interactive" });
    expect(successOscillator.stop).toHaveBeenCalledWith();
    expect(errorOscillator.start).toHaveBeenCalledWith(0.003);
    expect(errorOscillator.stop).toHaveBeenCalledWith(0.233);
    expect(errorOscillator.frequency.setValueAtTime).toHaveBeenNthCalledWith(1, 330, 0.003);
    expect(errorOscillator.frequency.exponentialRampToValueAtTime).toHaveBeenNthCalledWith(1, 294, 0.078);
    expect(errorOscillator.frequency.setValueAtTime.mock.calls[1][0]).toBe(262);
    expect(errorOscillator.frequency.setValueAtTime.mock.calls[1][1]).toBeCloseTo(0.103);
    expect(errorOscillator.frequency.exponentialRampToValueAtTime.mock.calls[1][0]).toBe(220);
    expect(errorOscillator.frequency.exponentialRampToValueAtTime.mock.calls[1][1]).toBeCloseTo(0.223);
    expect(errorGain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.22, 0.008);
    expect(errorGain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.22, 0.108);
    expect(context.gains[0].gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.22, 0.008);
  });

  it("does not play feedback tones when sound is disabled", () => {
    render(<SpeechProvider><DisabledToneHarness /></SpeechProvider>);
    fireEvent.click(screen.getByRole("button", { name: "disabled success" }));
    fireEvent.click(screen.getByRole("button", { name: "disabled error" }));
    expect(FakeAudioContext.instances).toHaveLength(0);
  });

  it("evicts a generated clip larger than the bounded memory cache", async () => {
    render(<SpeechProvider><SpeechHarness /></SpeechProvider>);
    fireEvent.click(screen.getByRole("button", { name: "first" }));
    await waitFor(() => expect(FakeWorker.instances).toHaveLength(1));
    const worker = FakeWorker.instances[0];
    const request = worker.messages.find((message) => message.type === "speak");
    if (!request || request.type !== "speak") throw new Error("Missing speech request");
    const oversizedSamples = new ArrayBuffer(AUDIO_CACHE_LIMIT_BYTES + 4);
    let playback: void | Promise<void> | undefined;
    act(() => { playback = worker.emit({ type: "audio", id: request.id, samples: oversizedSamples, sampleRate: 24000 }); });
    await waitFor(() => expect(FakeAudioContext.instances[0].sources).toHaveLength(1));
    act(() => FakeAudioContext.instances[0].sources[0].finish());
    await act(async () => { await playback; });

    fireEvent.click(screen.getByRole("button", { name: "first" }));
    await waitFor(() => expect(worker.messages.filter((message) => message.type === "speak")).toHaveLength(2));
  });

  it("settles a cancelled Web Speech fallback before starting the latest request", async () => {
    const spoken: FakeUtterance[] = [];
    const speechSynthesis = {
      cancel: vi.fn(),
      getVoices: vi.fn(() => []),
      speak: vi.fn((utterance: FakeUtterance) => {
        spoken.push(utterance);
        utterance.onstart?.(new Event("start") as SpeechSynthesisEvent);
      }),
    };
    vi.stubGlobal("Worker", undefined);
    vi.stubGlobal("SpeechSynthesisUtterance", FakeUtterance);
    vi.stubGlobal("speechSynthesis", speechSynthesis);
    render(<SpeechProvider><SpeechHarness /></SpeechProvider>);

    fireEvent.click(screen.getByRole("button", { name: "first" }));
    await waitFor(() => expect(screen.getByTestId("speech-state")).toHaveAttribute("data-source", "first"));
    fireEvent.click(screen.getByRole("button", { name: "second" }));
    await waitFor(() => expect(screen.getByTestId("speech-state")).toHaveAttribute("data-source", "second"));
    expect(spoken).toHaveLength(2);
    expect(speechSynthesis.cancel).toHaveBeenCalled();

    act(() => spoken[1].onend?.(new Event("end") as SpeechSynthesisEvent));
    await waitFor(() => expect(screen.getByTestId("speech-state")).toHaveAttribute("data-phase", "idle"));
  });

  it("preloads and prefers a Wikimedia recording without invoking system or model speech", async () => {
    const speechSynthesis = { cancel: vi.fn(), getVoices: vi.fn(() => []), speak: vi.fn() };
    vi.stubGlobal("Audio", FakeRecordingAudio);
    vi.stubGlobal("speechSynthesis", speechSynthesis);
    vi.stubGlobal("SpeechSynthesisUtterance", FakeUtterance);
    render(<SpeechProvider><SpeechHarness /></SpeechProvider>);

    fireEvent.click(screen.getByRole("button", { name: "preload" }));
    expect(FakeRecordingAudio.instances).toHaveLength(1);
    expect(FakeRecordingAudio.instances[0].volume).toBe(1);
    fireEvent.click(screen.getByRole("button", { name: "recorded" }));
    await waitFor(() => expect(screen.getByTestId("speech-state")).toHaveAttribute("data-phase", "playing"));
    expect(FakeRecordingAudio.instances).toHaveLength(1);
    expect(speechSynthesis.speak).not.toHaveBeenCalled();
    expect(FakeWorker.instances).toHaveLength(0);
    act(() => FakeRecordingAudio.instances[0].finish());
    await waitFor(() => expect(screen.getByTestId("speech-state")).toHaveAttribute("data-phase", "idle"));
  });

  it("falls back from a failed recording to the requested system accent", async () => {
    const spoken: FakeUtterance[] = [];
    const british = { lang: "en-GB", name: "British", localService: true } as SpeechSynthesisVoice;
    const speechSynthesis = {
      cancel: vi.fn(),
      getVoices: vi.fn(() => [british]),
      speak: vi.fn((utterance: FakeUtterance) => { spoken.push(utterance); utterance.onstart?.(new Event("start") as SpeechSynthesisEvent); }),
    };
    FakeRecordingAudio.rejectPlayback = true;
    vi.stubGlobal("Audio", FakeRecordingAudio);
    vi.stubGlobal("speechSynthesis", speechSynthesis);
    vi.stubGlobal("SpeechSynthesisUtterance", FakeUtterance);
    render(<SpeechProvider><SpeechHarness /></SpeechProvider>);

    fireEvent.click(screen.getByRole("button", { name: "recorded" }));
    await waitFor(() => expect(spoken).toHaveLength(1));
    expect(spoken[0].lang).toBe("en-US");
    expect(spoken[0].voice).toBeNull();
    expect(spoken[0].volume).toBe(1);
    act(() => spoken[0].onend?.(new Event("end") as SpeechSynthesisEvent));
    await waitFor(() => expect(screen.getByTestId("speech-state")).toHaveAttribute("data-phase", "idle"));
  });
});

class FakeUtterance {
  voice: SpeechSynthesisVoice | null = null;
  lang = "";
  rate = 1;
  pitch = 1;
  volume = 0;
  onstart: ((event: SpeechSynthesisEvent) => void) | null = null;
  onend: ((event: SpeechSynthesisEvent) => void) | null = null;
  onerror: ((event: SpeechSynthesisErrorEvent) => void) | null = null;

  constructor(public text: string) {}
}
