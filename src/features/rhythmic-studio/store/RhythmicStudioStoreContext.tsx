import { createContext, useContext, useState, type PropsWithChildren } from "react";
import { RhythmicStudioStore } from "./RhythmicStudioStore";

const RhythmicStudioStoreContext = createContext<RhythmicStudioStore | null>(null);

export function RhythmicStudioProvider({ children }: PropsWithChildren) {
  const [store] = useState(() => new RhythmicStudioStore());
  return <RhythmicStudioStoreContext.Provider value={store}>{children}</RhythmicStudioStoreContext.Provider>;
}

export function useRhythmicStudioStore() {
  const store = useContext(RhythmicStudioStoreContext);
  if (!store) throw new Error("RhythmicStudioProvider is missing");
  return store;
}
