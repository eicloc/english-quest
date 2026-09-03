"use client";

import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { grammarReducer } from "./reducer";
import { EMPTY_GRAMMAR_DATA, loadPersistedGrammarData, savePersistedGrammarData } from "./storage";
import type { GrammarAction, PersistedGrammarData } from "./types";

type GrammarContextValue = { data: PersistedGrammarData; dispatch: React.Dispatch<GrammarAction>; hydrated: boolean; storageAvailable: boolean };
const GrammarContext = createContext<GrammarContextValue | null>(null);

export function GrammarProvider({ children }: { children: React.ReactNode }) {
  const [data, dispatch] = useReducer(grammarReducer, EMPTY_GRAMMAR_DATA);
  const [meta, updateMeta] = useReducer((state: { hydrated: boolean; storageAvailable: boolean }, patch: Partial<{ hydrated: boolean; storageAvailable: boolean }>) => ({ ...state, ...patch }), { hydrated: false, storageAvailable: true });
  useEffect(() => {
    const loaded = loadPersistedGrammarData();
    dispatch({ type: "HYDRATE", data: loaded.data });
    updateMeta({ hydrated: true, storageAvailable: loaded.storageAvailable });
  }, []);
  useEffect(() => {
    if (meta.hydrated && !savePersistedGrammarData(data)) updateMeta({ storageAvailable: false });
  }, [data, meta.hydrated]);
  const value = useMemo(() => ({ data, dispatch, hydrated: meta.hydrated, storageAvailable: meta.storageAvailable }), [data, meta.hydrated, meta.storageAvailable]);
  return <GrammarContext.Provider value={value}>{children}</GrammarContext.Provider>;
}

export function useGrammar() {
  const context = useContext(GrammarContext);
  if (!context) throw new Error("useGrammar must be used inside GrammarProvider");
  return context;
}
