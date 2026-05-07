"use client";

import { useEffect } from "react";
import { authStore } from "@/store/authStore";
import { categoryStore } from "@/store/categoryStore";
import { transactionStore } from "@/store/transactionStore";
import { uiStore } from "@/store/uiStore";

export function useLocalStoreBootstrap() {
  useEffect(() => {
    try {
      authStore.load();
      categoryStore.load();
      transactionStore.load();
    } finally {
      uiStore.loading = false;
    }
  }, []);
}
