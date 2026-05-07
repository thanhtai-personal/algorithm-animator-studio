import { VoiceInputButton } from "@/components/voice/VoiceInputButton";
import { useVoiceDictationPrimitive } from "@/lib/voice/useVoiceDictationPrimitive";

interface FieldVoiceButtonProps {
  onTranscript: (transcript: string) => void;
  disabled?: boolean;
}

export function FieldVoiceButton({
  onTranscript,
  disabled,
}: FieldVoiceButtonProps) {
  const voice = useVoiceDictationPrimitive({
    language: "vi-VN",
    disabled,
    onResult: onTranscript,
  });

  return (
    <VoiceInputButton
      state={voice.state}
      onStart={() => void voice.start()}
      onStop={voice.stop}
      disabled={disabled}
    />
  );
}
