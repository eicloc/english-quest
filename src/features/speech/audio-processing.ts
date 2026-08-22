const FRAME_SECONDS = 0.01;
const PRE_ROLL_SECONDS = 0.02;
const POST_ROLL_SECONDS = 0.12;
const FADE_SECONDS = 0.005;
const ABSOLUTE_THRESHOLD = 0.008;
const RELATIVE_THRESHOLD = 0.03;

export function cleanGeneratedSamples(input: Float32Array, sampleRate: number) {
  if (!input.length || !Number.isFinite(sampleRate) || sampleRate <= 0) return new Float32Array();
  const samples = Float32Array.from(input, (value) => Number.isFinite(value) ? Math.max(-1, Math.min(1, value)) : 0);
  let peak = 0;
  for (const value of samples) peak = Math.max(peak, Math.abs(value));
  if (peak < ABSOLUTE_THRESHOLD) return new Float32Array();

  const frameSize = Math.max(1, Math.round(sampleRate * FRAME_SECONDS));
  const threshold = Math.max(ABSOLUTE_THRESHOLD, peak * RELATIVE_THRESHOLD);
  let firstActiveFrame = -1;
  let lastActiveFrame = -1;
  for (let start = 0, frame = 0; start < samples.length; start += frameSize, frame += 1) {
    const end = Math.min(samples.length, start + frameSize);
    let sumSquares = 0;
    for (let index = start; index < end; index += 1) sumSquares += samples[index] ** 2;
    const rms = Math.sqrt(sumSquares / Math.max(1, end - start));
    if (rms >= threshold) {
      if (firstActiveFrame < 0) firstActiveFrame = frame;
      lastActiveFrame = frame;
    }
  }

  if (firstActiveFrame < 0 || lastActiveFrame < 0) return samples;
  const start = Math.max(0, firstActiveFrame * frameSize - Math.round(sampleRate * PRE_ROLL_SECONDS));
  const end = Math.min(samples.length, (lastActiveFrame + 1) * frameSize + Math.round(sampleRate * POST_ROLL_SECONDS));
  const output = samples.slice(start, end);
  const fadeSamples = Math.min(Math.round(sampleRate * FADE_SECONDS), Math.floor(output.length / 2));
  for (let index = 0; index < fadeSamples; index += 1) {
    const gain = (index + 1) / fadeSamples;
    output[index] *= gain;
    output[output.length - 1 - index] *= gain;
  }
  return output;
}
