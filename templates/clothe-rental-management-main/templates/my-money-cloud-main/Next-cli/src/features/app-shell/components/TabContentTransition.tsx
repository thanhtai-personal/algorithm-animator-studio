"use client";

import type { ReactNode } from "react";

interface TabContentTransitionProps {
  activeKey: string;
  children: ReactNode;
}

export function TabContentTransition({ activeKey, children }: TabContentTransitionProps) {
  return <div key={activeKey}>{children}</div>;
}
