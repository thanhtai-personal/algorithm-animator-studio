import { useVoiceRecorder } from "@/lib/voice/useVoiceRecorder";

export function useSpeechRecognition(audioLanguage?: string) {
  return useVoiceRecorder({ audioLanguage });
}
