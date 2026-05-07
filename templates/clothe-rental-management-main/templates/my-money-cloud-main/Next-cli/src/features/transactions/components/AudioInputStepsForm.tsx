"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCategories } from "@/features/categories/hooks/useCategories";
import { useI18n } from "@/lib/i18n";
import { toast as notify } from "sonner";
import type { TransactionInput } from "@/features/transactions/types";
import { FormSteps } from "@/components/steps/FormSteps";
import type { StepFormHandle } from "@/components/steps/types";
import { AmountStep } from "./audio-input/AmountStep";
import { CategoryStep } from "./audio-input/CategoryStep";
import { NotesStep } from "./audio-input/NotesStep";
import { ReviewStep } from "./audio-input/ReviewStep";
import { categoryStore } from "@/store/categoryStore";
import { observer } from "mobx-react-lite";

interface AudioInputStepsFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (transaction: TransactionInput) => Promise<boolean>;
}

type VoiceStepKey = "amount" | "category" | "notes" | "review";

export const AudioInputStepsForm = observer(function AudioInputStepsForm({
  open,
  onClose,
  onSubmit,
}: AudioInputStepsFormProps) {
  const { t } = useI18n();
  const [transactionType, setTransactionType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [notes, setNotes] = useState("");
  const stepFormRef = useRef<StepFormHandle>(null);
  const { categoryMap, categories } = categoryStore;

  const selectedCategoryData = categoryMap[selectedCategory];

  const handleAmountChange = useCallback((value: string) => {
    setAmount(value.replace(/\D/g, ""));
  }, []);

  const handleTransactionTypeChange = useCallback((type: "income" | "expense") => {
    setTransactionType(type);
    setSelectedCategory("");
  }, []);

  const handleQuickSelect = useCallback((value: number) => {
    setAmount(value.toString());
  }, []);

  const resetForm = () => {
    stepFormRef.current?.reset();
    setTransactionType("expense");
    setAmount("");
    setSelectedCategory("");
    setNotes("");
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        resetForm();
      }, 300);

      return () => clearTimeout(timer);
    }

    return undefined;
  }, [open]);

  const handleSubmit = async () => {
    if (!amount || !selectedCategory) {
      notify.error(t("common.requiredFields"));
      return;
    }

    try {
      const success = await onSubmit({
        amount: parseInt(amount),
        description: notes || (selectedCategoryData?.name ?? ""),
        categoryId: selectedCategory,
        type: transactionType,
        date: new Date(),
      });

      if (success) {
        onClose();
      }
    } catch (error) {}
  };

  return (
    <FormSteps
      ref={stepFormRef}
      open={open}
      onClose={onClose}
      initialStepKey="amount"
      onSubmit={handleSubmit}
      onStepChange={() => {}}
      labels={{
        back: t("common.back"),
        next: t("common.next"),
        done: t("common.done"),
        submitting: t("common.loading"),
      }}
    >
      <FormSteps.Step
        stepKey="amount"
        title={t("addTransaction.amountStep")}
        validate={() => {
          if (!amount || parseInt(amount, 10) <= 0) {
            notify.error(t("common.amountRequired"));
            return false;
          }
          return true;
        }}
      >
        <AmountStep
          amount={amount}
          transactionType={transactionType}
          onTransactionTypeChange={handleTransactionTypeChange}
          onAmountChange={handleAmountChange}
          onQuickSelect={handleQuickSelect}
        />
      </FormSteps.Step>

      <FormSteps.Step
        stepKey="category"
        title={t("addTransaction.categoryStep")}
        validate={() => {
          if (!selectedCategory) {
            notify.error(t("common.categoryRequired"));
            return false;
          }
          return true;
        }}
      >
        <CategoryStep categories={categories} selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
      </FormSteps.Step>

      <FormSteps.Step stepKey="notes" title={t("addTransaction.notesStep")}>
        <NotesStep
          notes={notes}
          onChangeNotes={setNotes}
        />
      </FormSteps.Step>

      <FormSteps.Step stepKey="review" title={t("addTransaction.reviewStep")}>
        <ReviewStep
          transactionType={transactionType}
          amount={amount ? parseInt(amount, 10) : 0}
          selectedCategory={selectedCategoryData}
          notes={notes}
        />
      </FormSteps.Step>
    </FormSteps>
  );
})
