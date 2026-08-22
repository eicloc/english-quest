"use client";

import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { assessmentReducer } from "./reducer";
import { EMPTY_DATA, loadPersistedData, savePersistedData } from "./storage";
import type { AssessmentAction, PersistedAssessmentData } from "./types";

type AssessmentContextValue = {
  data: PersistedAssessmentData;
  dispatch: React.Dispatch<AssessmentAction>;
  hydrated: boolean;
  storageAvailable: boolean;
};

const AssessmentContext = createContext<AssessmentContextValue | null>(null);

export function AssessmentProvider({ children }: { children: React.ReactNode }) {
  const [data, dispatch] = useReducer(assessmentReducer, EMPTY_DATA);
  const [meta, updateMeta] = useReducer(
    (state: { hydrated: boolean; storageAvailable: boolean }, patch: Partial<{ hydrated: boolean; storageAvailable: boolean }>) => ({ ...state, ...patch }),
    { hydrated: false, storageAvailable: true },
  );

  useEffect(() => {
    const loaded = loadPersistedData();
    dispatch({ type: "HYDRATE", data: loaded.data });
    updateMeta({ storageAvailable: loaded.storageAvailable, hydrated: true });
  }, []);

  useEffect(() => {
    if (!meta.hydrated) return;
    if (!savePersistedData(data)) updateMeta({ storageAvailable: false });
  }, [data, meta.hydrated]);

  const value = useMemo(
    () => ({ data, dispatch, hydrated: meta.hydrated, storageAvailable: meta.storageAvailable }),
    [data, meta.hydrated, meta.storageAvailable],
  );

  return <AssessmentContext.Provider value={value}>{children}</AssessmentContext.Provider>;
}

export function useAssessment() {
  const context = useContext(AssessmentContext);
  if (!context) throw new Error("useAssessment must be used inside AssessmentProvider");
  return context;
}
