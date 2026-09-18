"use client";

import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from "react";
import { reduceBattleData } from "./engine";
import { emptyBattleData, loadBattleData, saveBattleData } from "./storage";
import type { BattleAction, BattleData } from "./types";

type State = { data: BattleData; hydrated: boolean; storageAvailable: boolean };
type ContextAction = BattleAction | { type: "HYDRATE"; data: BattleData; storageAvailable: boolean } | { type: "STORAGE_UNAVAILABLE" };
const BattleContext = createContext<(State & { dispatch: Dispatch<BattleAction> }) | null>(null);

function reducer(state: State, action: ContextAction): State {
  if (action.type === "HYDRATE") return { data: action.data, storageAvailable: action.storageAvailable, hydrated: true };
  if (action.type === "STORAGE_UNAVAILABLE") return state.storageAvailable ? { ...state, storageAvailable: false } : state;
  if (!state.hydrated) return state;
  const data = reduceBattleData(state.data, action);
  return data === state.data ? state : { ...state, data };
}

export function BattleProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { data: emptyBattleData(), hydrated: false, storageAvailable: true });
  useEffect(() => { dispatch({ type: "HYDRATE", ...loadBattleData() }); }, []);
  useEffect(() => {
    if (state.hydrated && !saveBattleData(state.data)) dispatch({ type: "STORAGE_UNAVAILABLE" });
  }, [state.data, state.hydrated]);
  return <BattleContext.Provider value={{ ...state, dispatch }}>{children}</BattleContext.Provider>;
}

export function useBattle() {
  const context = useContext(BattleContext);
  if (!context) throw new Error("Sentence battle requires BattleProvider");
  return context;
}
