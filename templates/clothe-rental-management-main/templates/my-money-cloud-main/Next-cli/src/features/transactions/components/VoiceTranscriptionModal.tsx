import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface VoiceModalProps {
  open: boolean;
  transcript: string;
  onClose: () => void;
  t: (key: string) => string | undefined;
}

export function VoiceTranscriptionModal({ open, transcript, onClose, t }: VoiceModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => (!isOpen ? onClose() : undefined)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("addTransaction.listening")}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {t("addTransaction.tapToSpeak")}
          </p>
        </DialogHeader>
        <div className="rounded-xl border bg-muted/40 px-4 py-6 min-h-[96px] flex items-center justify-center">
          {transcript ? (
            <p className="text-lg font-semibold text-center">{transcript}</p>
          ) : (
            <p className="text-muted-foreground text-center">
              {t("voice.speakNow")}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
