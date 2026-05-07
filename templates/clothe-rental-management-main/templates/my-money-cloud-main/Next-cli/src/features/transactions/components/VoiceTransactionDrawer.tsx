"use client";

import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useI18n } from "@/lib/i18n";
import type { TransactionInput } from "@/features/transactions/types";
import { useVoiceTransactionFlow } from "@/features/transactions/hooks/useVoiceTransactionFlow";
import { VoiceTransactionHeader } from "./VoiceTransactionHeader";
import { VoiceTransactionTypeStep } from "./VoiceTransactionTypeStep";
import { VoiceTransactionAmountStep } from "./VoiceTransactionAmountStep";
import { VoiceTransactionCategoryStep } from "./VoiceTransactionCategoryStep";
import { VoiceTransactionNotesStep } from "./VoiceTransactionNotesStep";
import { VoiceTransactionReviewStep } from "./VoiceTransactionReviewStep";
import { VoiceTransactionFooter } from "./VoiceTransactionFooter";
import { VoiceTranscriptionModal } from "./VoiceTranscriptionModal";
import { useVoiceCaptureWeb } from "@/features/transactions/hooks/useVoiceCaptureWeb";
import { toast } from "sonner";

interface VoiceTransactionDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (transaction: TransactionInput) => Promise<boolean>;
}

export function VoiceTransactionDrawer({ open, onClose, onSubmit }: VoiceTransactionDrawerProps) {
  const { t, localeCode, audioLanguage, currency } = useI18n();
  const voiceCapture = useVoiceCaptureWeb(audioLanguage);
  const notify = {
    success: (msg: string) => toast.success(msg),
    error: (msg: string) => toast.error(msg),
    info: (msg: string) => toast(msg),
  };

  const {
    amount,
    categories,
    currencySymbol,
    getStepNumber,
    getStepTitle,
    handleAmountChange,
    handleAmountValueChange,
    handleNext,
    handlePrevious,
    handleSubmit,
    isListening,
    isSubmitting,
    liveTranscript,
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
  } = useVoiceTransactionFlow({
    open,
    onClose,
    onSubmit,
    localeCode,
    currency,
    t,
    voiceCapture,
    notify,
    audioLanguage
  });

  return (
    <>
      <Drawer open={open} onOpenChange={(isOpen) => (!isOpen ? onClose() : undefined)}>
        <DrawerContent className="w-full p-0 rounded-t-3xl bg-background overflow-hidden flex flex-col gap-0 max-h-[85vh]">
          <div className="relative flex h-full max-h-[85vh] flex-col overflow-hidden min-h-0">
            <div
              className={`absolute inset-0 pointer-events-none transition-colors duration-300 ${
                transactionType === "income" ? "bg-green-500/5" : "bg-red-500/5"
              }`}
            />

            <div className="relative z-10 flex flex-col flex-1 overflow-hidden min-h-0">
              <VoiceTransactionHeader
                step={step}
                getStepNumber={getStepNumber}
                getStepTitle={getStepTitle}
                onBack={handlePrevious}
              />

              <div className="flex-1 overflow-y-auto p-5 pt-2 min-h-0">
                {step === "type" && (
                  <VoiceTransactionTypeStep
                    transactionType={transactionType}
                    onSelectType={setTransactionType}
                    t={t}
                  />
                )}

                {step === "amount" && (
                  <VoiceTransactionAmountStep
                    amount={amount}
                    currency={currency}
                    currencySymbol={currencySymbol}
                    localeCode={localeCode}
                    isListening={isListening}
                    onVoiceStart={() => startVoiceInput("amount")}
                    onVoiceStop={stopVoiceInput}
                    onAmountChange={handleAmountChange}
                    onAmountValueChange={handleAmountValueChange}
                    onQuickSelect={(value) => handleAmountValueChange(value.toString())}
                    t={t}
                  />
                )}

                {step === "category" && (
                  <VoiceTransactionCategoryStep
                    categories={categories}
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                    t={t}
                  />
                )}

                {step === "notes" && (
                  <VoiceTransactionNotesStep
                    notes={notes}
                    isListening={isListening}
                    onChangeNotes={setNotes}
                    onVoiceStart={() => startVoiceInput("notes")}
                    onVoiceStop={stopVoiceInput}
                    t={t}
                  />
                )}

                {step === "review" && (
                  <VoiceTransactionReviewStep
                    transactionType={transactionType}
                    amount={amount}
                    currency={currency}
                    localeCode={localeCode}
                    selectedCategoryData={selectedCategoryData}
                    notes={notes}
                    t={t}
                  />
                )}
              </div>
            </div>
          </div>

          <VoiceTransactionFooter
            step={step}
            isSubmitting={isSubmitting}
            transactionType={transactionType}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSubmit={handleSubmit}
            t={t}
          />
        </DrawerContent>
      </Drawer>

      <VoiceTranscriptionModal
        open={showVoiceModal}
        transcript={liveTranscript}
        onClose={stopVoiceInput}
        t={t}
      />
    </>
  );
}
