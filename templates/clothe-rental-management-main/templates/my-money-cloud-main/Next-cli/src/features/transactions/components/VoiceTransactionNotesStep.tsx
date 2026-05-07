import { Textarea } from "@/components/ui/textarea";
import { VoiceTransactionVoiceButton } from "./VoiceTransactionVoiceButton";

interface NotesStepProps {
  notes: string;
  isListening: boolean;
  onChangeNotes: (value: string) => void;
  onVoiceStart: () => void;
  onVoiceStop: () => void;
  t: (key: string) => string | undefined;
}

export function VoiceTransactionNotesStep({
  notes,
  isListening,
  onChangeNotes,
  onVoiceStart,
  onVoiceStop,
  t,
}: NotesStepProps) {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <VoiceTransactionVoiceButton
        isListening={isListening}
        onPress={onVoiceStart}
        onRelease={onVoiceStop}
        label={t("addTransaction.listening")}
        idleLabel={t("addTransaction.tapToSpeakNote")}
      />

      <div>
        <label className="text-sm font-medium text-muted-foreground mb-2 block">
          {t("common.descriptionOptional")}
        </label>
        <Textarea
          value={notes}
          onChange={(e) => onChangeNotes(e.target.value)}
          placeholder={t("common.descriptionPlaceholder")}
          className="rounded-xl min-h-[120px] resize-none"
          disabled={isListening}
        />
      </div>
    </div>
  );
}
