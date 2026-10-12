"use client";

import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { emptyGreetingsData, greetingsReducer } from "./engine";
import { loadGreetingsData, saveGreetingsData } from "./storage";
import type { GreetingsAction, GreetingsData } from "./types";

type GreetingsContextValue = { data: GreetingsData; dispatch: React.Dispatch<GreetingsAction>; hydrated: boolean; storageAvailable: boolean };
const GreetingsContext = createContext<GreetingsContextValue | null>(null);

export function GreetingsProvider({ children }: { children: React.ReactNode }) {
  const [data, dispatch] = useReducer(greetingsReducer, undefined, emptyGreetingsData);
  const [meta, updateMeta] = useReducer((state: { hydrated: boolean; storageAvailable: boolean }, patch: Partial<typeof state>) => ({ ...state, ...patch }), { hydrated: false, storageAvailable: true });
  useEffect(() => {
    const loaded = loadGreetingsData();
    dispatch({ type: "HYDRATE", data: loaded.data });
    updateMeta({ hydrated: true, storageAvailable: loaded.storageAvailable });
  }, []);
  useEffect(() => {
    if (meta.hydrated && !saveGreetingsData(data)) updateMeta({ storageAvailable: false });
  }, [data, meta.hydrated]);
  const value = useMemo(() => ({ data, dispatch, ...meta }), [data, meta]);
  return <GreetingsContext.Provider value={value}>{children}</GreetingsContext.Provider>;
}

export function useGreetings() {
  const context = useContext(GreetingsContext);
  if (!context) throw new Error("useGreetings must be used inside GreetingsProvider");
  return context;
}
