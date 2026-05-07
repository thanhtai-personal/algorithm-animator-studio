import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CategoryRow } from "@/features/categories/types";
import type { TransactionInput } from "@/features/transactions/types";
import { getCurrencySymbol } from "@/lib/currency";
import { categoryStore } from "@/store/categoryStore";
import { extractAmountFromTranscript } from "@/lib/voice/voiceUtils";

type TranslateFn = (key: string) => string | undefined;

export type VoiceTransactionStep = "type" | "amount" | "category" | "notes" | "review";

export interface VoiceCaptureAdapter {
  isListening: boolean;
  liveTranscript: string;
  requestPermission: () => Promise<boolean>;
  start: (options: {
    onPartial?: (text: string) => void;
    onFinal: (text: string) => void;
    onError?: (message?: string) => void;
  }) => void;
  stop: () => void;
  reset: () => void;
}

interface Notifier {
  success: (message: string) => void;
  error: (message: string) => void;
  info?: (message: string) => void;
}

interface UseVoiceTransactionFlowParams {
  open: boolean;
  onClose: () => void;
  onSubmit: (transaction: TransactionInput) => Promise<boolean>;
  localeCode: string;
  currency: string;
  t: TranslateFn;
  voiceCapture: VoiceCaptureAdapter;
  notify: Notifier;
  audioLanguage: string;
}

export function useVoiceTransactionFlow({
  open,
  onClose,
  onSubmit,
  localeCode,
  currency,
  t,
  voiceCapture,
  notify,
  audioLanguage,
}: UseVoiceTransactionFlowParams) {
  const [step, setStep] = useState<VoiceTransactionStep>("type");
  const [transactionType, setTransactionType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const previousStepRef = useRef<VoiceTransactionStep | null>(null);

  const currencySymbol = useMemo(() => getCurrencySymbol(currency, localeCode), [currency, localeCode]);
  const selectedCategoryData = useMemo<CategoryRow | undefined>(
    () => categoryStore.findById(selectedCategory),
    [categoryStore.categoryMap, selectedCategory]
  );

  const handleAmountTranscript = useCallback(
    (rawTranscript: string) => {
      const parsedAmount = extractAmountFromTranscript(rawTranscript, audioLanguage);

      if (parsedAmount && parsedAmount > 0) {
        setAmount(Math.round(parsedAmount).toString());
        notify.success(t("toast.voiceCaptured") || "Captured voice input");
      } else {
        notify.error(t("toast.voiceNoAmount") || "Could not detect an amount");
      }
    },
    [audioLanguage, notify, t]
  );

  const requestMicPermission = useCallback(async () => {
    const granted = await voiceCapture.requestPermission();
    if (!granted) {
      notify.error(t("addTransaction.micPermissionDenied") || "Microphone permission is required");
    }
    return granted;
  }, [notify, t, voiceCapture]);

  const startVoiceInput = useCallback(
    (fieldType: "amount" | "notes") => {
      if (voiceCapture.isListening) return;

      setLiveTranscript("");
      if (fieldType === "amount") {
        setShowVoiceModal(true);
      }

      voiceCapture.start({
        onPartial: (text) => {
          if (fieldType === "amount") {
            setLiveTranscript(text);
          }
        },
        onFinal: (text) => {
          if (fieldType === "amount") {
            handleAmountTranscript(text);
            setShowVoiceModal(false);
          } else if (text.trim()) {
            setNotes(text);
            notify.success(t("toast.voiceCaptured") || "Captured voice input");
          } else {
            notify.error(t("toast.voiceNoText") || "Could not capture any text");
          }
        },
        onError: (message) => {
          setShowVoiceModal(false);
          notify.error(message || t("toast.voiceUnsupported") || "Voice input is not supported");
        },
      });
    },
    [handleAmountTranscript, notify, t, voiceCapture]
  );

  useEffect(() => {
    if (!open) {
      voiceCapture.stop();
      voiceCapture.reset();
      previousStepRef.current = null;
      setTimeout(() => {
        setStep("type");
        setTransactionType("expense");
        setAmount("");
        setSelectedCategory("");
        setNotes("");
        setLiveTranscript("");
        setShowVoiceModal(false);
      }, 300);
    }
  }, [open, voiceCapture]);

  useEffect(() => {
    if (!open) return;
    if (step !== previousStepRef.current && (step === "amount" || step === "notes")) {
      startVoiceInput(step);
    }
    previousStepRef.current = step;
  }, [open, startVoiceInput, step]);

  const stopVoiceInput = useCallback(() => {
    voiceCapture.stop();
    setShowVoiceModal(false);
  }, [voiceCapture]);

  const handleAmountValueChange = useCallback((value: string) => {
    const digits = value.replace(/\D/g, "");
    setAmount(digits);
  }, []);

  const handleAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleAmountValueChange(e.target.value);
    },
    [handleAmountValueChange]
  );

  const handleNext = useCallback(async () => {
    if (step === "type") {
      const hasPermission = await requestMicPermission();
      if (!hasPermission) {
        return;
      }
      setStep("amount");
    } else if (step === "amount") {
      if (!amount || parseInt(amount) <= 0) {
        notify.error(t("common.amountRequired") || "Yêu cầu nhập số tiền");
        return;
      }
      stopVoiceInput();
      setStep("category");
    } else if (step === "category") {
      if (!selectedCategory) {
        notify.error(t("common.categoryRequired") || "Yêu cầu chọn danh mục");
        return;
      }
      setStep("notes");
    } else if (step === "notes") {
      stopVoiceInput();
      setStep("review");
    }
  }, [amount, notify, requestMicPermission, selectedCategory, step, stopVoiceInput, t]);

  const handlePrevious = useCallback(() => {
    stopVoiceInput();
    if (step === "amount") {
      setStep("type");
    } else if (step === "category") {
      setStep("amount");
    } else if (step === "notes") {
      setStep("category");
    } else if (step === "review") {
      setStep("notes");
    }
  }, [step, stopVoiceInput]);

  const handleSubmit = useCallback(async () => {
    if (!amount || !selectedCategory) {
      notify.error(t("common.requiredFields") || "Thiếu thông tin bắt buộc");
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await onSubmit({
        amount: parseInt(amount, 10),
        description: notes || (selectedCategoryData?.name ?? ""),
        categoryId: selectedCategory,
        type: transactionType,
        date: new Date(),
      });

      if (success) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [amount, notes, notify, onClose, onSubmit, selectedCategory, selectedCategoryData?.name, t, transactionType]);

  const getStepTitle = useCallback(() => {
    switch (step) {
      case "type":
        return t("addTransaction.typeStep");
      case "amount":
        return t("addTransaction.amountStep");
      case "category":
        return t("addTransaction.categoryStep");
      case "notes":
        return t("addTransaction.notesStep");
      case "review":
        return t("addTransaction.reviewStep");
      default:
        return "";
    }
  }, [step, t]);

  const getStepNumber = useCallback(() => {
    const steps: VoiceTransactionStep[] = ["type", "amount", "category", "notes", "review"];
    return steps.indexOf(step) + 1;
  }, [step]);

  return {
    amount,
    categories: categoryStore.categories,
    currencySymbol,
    getStepNumber,
    getStepTitle,
    handleAmountChange,
    handleAmountValueChange,
    handleNext,
    handlePrevious,
    handleSubmit,
    isListening: voiceCapture.isListening,
    isSubmitting,
    liveTranscript: liveTranscript || voiceCapture.liveTranscript,
    notes,
    selectedCategory,
    selectedCategoryData,
    setAmount,
    setNotes,
    setSelectedCategory,
    setTransactionType,
    showVoiceModal,
    startVoiceInput,
    step,
    stopVoiceInput,
    transactionType,
  };
}
