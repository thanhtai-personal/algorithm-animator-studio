"use client";

import { useEffect, useRef, useState } from "react";

import { useI18n } from "@/lib/i18n";
import { categoryStore } from "@/store/categoryStore";
import { transactionStore } from "@/store/transactionStore";
import { authStore } from "@/store/authStore";
import { ZERO_VERSION, CURRENT_APP_VERSION } from "../constants";
import { versionStore } from "@/store/versionStore";
import { useResetVersionQuery } from "../queries/version";
import { compareVersions } from "../utils";
import { observer } from "mobx-react-lite";


export const ForceResetGuard = observer(function ForceResetGuard() {
  const { t } = useI18n();
  const [requiredVersion, setRequiredVersion] = useState<string | null>(null);
  const { data: remoteVersion } = useResetVersionQuery();

  useEffect(() => {
    if (!authStore.userId && !authStore.anonId) return;
    if (!remoteVersion) return;

    const storedVersion = versionStore.version;


    if (storedVersion === ZERO_VERSION) {
      versionStore.version = CURRENT_APP_VERSION || remoteVersion;
      return;
    }

    if (compareVersions(remoteVersion, storedVersion) > 0) {
      setRequiredVersion(remoteVersion);
    }
  }, [authStore.userId, authStore.anonId, remoteVersion]);

  const handleConfirmReset = async () => {
    if (!requiredVersion) return;
    try {
      // Xoá dữ liệu local qua store mới
      categoryStore.clear();
      transactionStore.clear();
      authStore.clear();
      versionStore.version = requiredVersion;
    } catch (error) {
      console.warn("[ForceResetGuard] Failed to clear local data", error);
    }

    // TODO: signOut logic nếu cần
    setRequiredVersion(null);
  };

  if (!requiredVersion) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 text-gray-900">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-red-600">{t("forceReset.badgeTitle")}</p>
          <h2 className="text-xl font-bold">{t("forceReset.title")}</h2>
          <p className="text-sm text-gray-700 leading-relaxed">{t("forceReset.description")}</p>
          <p className="text-sm text-gray-600">{t("forceReset.requiredVersion", { version: requiredVersion ?? "" })}</p>
        </div>

        <div className="rounded-lg bg-gray-100 p-3 text-sm text-gray-800">{t("forceReset.notice")}</div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleConfirmReset}
            className="rounded-xl bg-red-500 px-3 py-2 text-white font-semibold shadow hover:bg-red-600 transition"
          >
            {t("forceReset.confirm")}
          </button>
          <button
            type="button"
            onClick={() => setRequiredVersion(null)}
            className="rounded-xl border border-gray-300 px-3 py-2 font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            {t("common.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
});
