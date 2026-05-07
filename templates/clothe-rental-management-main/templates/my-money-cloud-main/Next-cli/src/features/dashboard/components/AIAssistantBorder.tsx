"use client";

import React from "react";
import { useI18n } from "@/lib/i18n";
// import { ElectricBorder } from "../../../components/animations/electricBorder/ElectricBorder";

interface Props {
  children: React.ReactNode;
}

export function AIAssistantBorder({ children }: Props) {
  const { t } = useI18n();

  return (
    <div className="relative rounded-3xl bg-transparent">
      <div className="absolute right-3 top-0 z-20 transform translate-y-[-12px]">
        <div className="bg-background/90 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold border border-muted">
          {t("ai.mode")}
        </div>
      </div>

      <div className="relative rounded-3xl flex justify-center items-center w-full h-full bg-transparent">{children}</div>
    </div>
  );
}

export default AIAssistantBorder;
