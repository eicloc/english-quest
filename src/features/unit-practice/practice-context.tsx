"use client";

import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { emptyPracticeData, practiceReducer } from "./engine";
import { loadPracticeData, savePracticeData } from "./storage";
import type { PracticeAction, PracticeCollection, PracticeData } from "./types";

type Value = { collection: PracticeCollection; data: PracticeData; dispatch: React.Dispatch<PracticeAction>; hydrated: boolean; storageAvailable: boolean };
const Context = createContext<Value | null>(null);
export function PracticeProvider({ collection, children }: { collection: PracticeCollection; children: React.ReactNode }) {
  const [data, dispatch] = useReducer(practiceReducer, undefined, emptyPracticeData);
  const [meta, updateMeta] = useReducer((state: { hydrated: boolean; storageAvailable: boolean }, patch: Partial<typeof state>) => ({ ...state, ...patch }), { hydrated: false, storageAvailable: true });
  useEffect(() => { const loaded = loadPracticeData(collection); dispatch({ type: "HYDRATE", data: loaded.data }); updateMeta({ hydrated: true, storageAvailable: loaded.storageAvailable }); }, [collection]);
  useEffect(() => { if (meta.hydrated && !savePracticeData(data, collection)) updateMeta({ storageAvailable: false }); }, [data, collection, meta.hydrated]);
  const value = useMemo(() => ({ collection, data, dispatch, ...meta }), [collection, data, meta]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function usePractice() {
  const context = useContext(Context);
  if (!context) throw new Error("usePractice must be used inside PracticeProvider");
  return context;
}
