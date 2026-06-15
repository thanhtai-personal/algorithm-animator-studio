import { useCallback, useEffect, useState } from "react";

type NodePosition = { x: number; y: number };
type FlowLayout = Record<string, NodePosition>;

const STORAGE_PREFIX = "kai-agent-flow-layout:v1:";

function readLayout(key: string): FlowLayout {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return raw ? JSON.parse(raw) as FlowLayout : {};
  } catch {
    return {};
  }
}

function writeLayout(key: string, layout: FlowLayout) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(layout));
}

export function usePersistedFlowLayout(key: string) {
  const [savedPositions, setSavedPositions] = useState<FlowLayout>(() => readLayout(key));
  const [positions, setPositions] = useState<FlowLayout>(() => readLayout(key));
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const layout = readLayout(key);
    setSavedPositions(layout);
    setPositions(layout);
    setDirty(false);
  }, [key]);

  const setNodePosition = useCallback((nodeId: string, position: NodePosition) => {
    setPositions((current) => {
      setDirty(true);
      return { ...current, [nodeId]: position };
    });
  }, []);

  const saveLayout = useCallback(() => {
    writeLayout(key, positions);
    setSavedPositions(positions);
    setDirty(false);
  }, [key, positions]);

  const resetLayout = useCallback(() => {
    setPositions(savedPositions);
    setDirty(false);
  }, [savedPositions]);

  return { dirty, positions, resetLayout, saveLayout, setNodePosition };
}
