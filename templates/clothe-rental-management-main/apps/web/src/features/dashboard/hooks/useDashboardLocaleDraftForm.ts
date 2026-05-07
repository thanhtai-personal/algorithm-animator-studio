"use client";

import { useCallback, useEffect, useState } from "react";

const DASHBOARD_DRAFT_STORAGE_KEY = "showroom:dashboard:locale-draft-form";

type DashboardDraftForm = {
  customerName: string;
  note: string;
};

const EMPTY_DRAFT_FORM: DashboardDraftForm = {
  customerName: "",
  note: "",
};

function loadDraftForm(): DashboardDraftForm {
  if (typeof window === "undefined") {
    return EMPTY_DRAFT_FORM;
  }

  try {
    const raw = window.sessionStorage.getItem(DASHBOARD_DRAFT_STORAGE_KEY);
    if (!raw) return EMPTY_DRAFT_FORM;

    const parsed = JSON.parse(raw) as Partial<DashboardDraftForm>;
    return {
      customerName: typeof parsed.customerName === "string" ? parsed.customerName : "",
      note: typeof parsed.note === "string" ? parsed.note : "",
    };
  } catch {
    return EMPTY_DRAFT_FORM;
  }
}

export function useDashboardLocaleDraftForm() {
  const [form, setForm] = useState<DashboardDraftForm>(loadDraftForm);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(DASHBOARD_DRAFT_STORAGE_KEY, JSON.stringify(form));
  }, [form]);

  const updateField = useCallback(
    <TField extends keyof DashboardDraftForm>(field: TField, value: DashboardDraftForm[TField]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  return {
    form,
    updateField,
  };
}
