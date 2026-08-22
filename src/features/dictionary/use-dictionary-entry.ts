"use client";

import { useEffect, useState } from "react";
import { loadDictionaryEntry } from "./dictionary-client";
import type { DictionaryEntry } from "./types";

export function useDictionaryEntry(word: string) {
  const [result, setResult] = useState<{ word: string; entry?: DictionaryEntry }>({ word: "" });

  useEffect(() => {
    let active = true;
    void loadDictionaryEntry(word).then((result) => {
      if (active) setResult({ word, entry: result });
    }).catch(() => {
      if (active) setResult({ word });
    });
    return () => { active = false; };
  }, [word]);

  return result.word === word ? result.entry : undefined;
}
