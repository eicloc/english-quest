import { describe, expect, it } from "vitest";
import { isFreeLicense, selectAccentRecording } from "../../../../scripts/build-pronunciation-audio.mjs";

const mp3 = (name: string) => `https://upload.wikimedia.org/wikipedia/commons/transcoded/a/ab/${name}/${name}.mp3`;

describe("Wikimedia pronunciation import", () => {
  it("selects only an explicitly matching accent", () => {
    const items = [{
      word: "apple",
      sounds: [
        { audio: "En-us-apple.ogg", mp3_url: mp3("En-us-apple.ogg"), tags: ["US"] },
        { audio: "En-uk-apple.ogg", mp3_url: mp3("En-uk-apple.ogg"), tags: ["Received Pronunciation"] },
      ],
    }];
    expect(selectAccentRecording(items, "en-US")?.audio).toBe("En-us-apple.ogg");
    expect(selectAccentRecording(items, "en-GB")?.audio).toBe("En-uk-apple.ogg");
  });

  it("accepts the explicit GA and RP accent abbreviations", () => {
    const items = [{
      word: "apple",
      sounds: [
        { audio: "apple.ogg", mp3_url: mp3("apple.ogg"), tags: ["GA"] },
        { audio: "English-apple.ogg", mp3_url: mp3("English-apple.ogg"), tags: ["RP"] },
      ],
    }];
    expect(selectAccentRecording(items, "en-US")?.audio).toBe("apple.ogg");
    expect(selectAccentRecording(items, "en-GB")?.audio).toBe("English-apple.ogg");
  });

  it("selects the same candidate regardless of source ordering", () => {
    const sounds = [
      { audio: "En-us-apple-2.ogg", mp3_url: mp3("En-us-apple-2.ogg"), tags: ["US"] },
      { audio: "En-us-apple-1.ogg", mp3_url: mp3("En-us-apple-1.ogg"), tags: ["US"] },
    ];
    const forward = selectAccentRecording([{ word: "apple", sounds }], "en-US");
    const reverse = selectAccentRecording([{ word: "apple", sounds: [...sounds].reverse() }], "en-US");
    expect(forward?.audio).toBe("En-us-apple-1.ogg");
    expect(reverse).toEqual(forward);
  });

  it("rejects opposite, regional, nonstandard, and phrase recordings", () => {
    const items = [{
      word: "be",
      sounds: [
        { audio: "En-us-be.ogg", mp3_url: mp3("En-us-be.ogg"), tags: ["UK"] },
        { audio: "En-us-be-2.ogg", mp3_url: mp3("En-us-be-2.ogg"), tags: ["Southern US"] },
        { audio: "En-us-be-3.ogg", mp3_url: mp3("En-us-be-3.ogg"), tags: ["US", "nonstandard"] },
        { audio: "En-uk-to_be.ogg", mp3_url: mp3("En-uk-to_be.ogg"), tags: ["UK"] },
      ],
    }];
    expect(selectAccentRecording(items, "en-US")).toBeUndefined();
    expect(selectAccentRecording(items, "en-GB")).toBeUndefined();
  });

  it("accepts only free Commons license families", () => {
    expect(isFreeLicense("CC BY-SA 4.0")).toBe(true);
    expect(isFreeLicense("CC0 1.0")).toBe(true);
    expect(isFreeLicense("Public domain")).toBe(true);
    expect(isFreeLicense("All rights reserved")).toBe(false);
  });
});
