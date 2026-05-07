"use client";

import { CircleCheckBig, Mic } from "lucide-react";
import { cn } from "@/utils";

interface TranscriptDisplayProps {
  transcript: string;
  isListening: boolean;
  error: string | null;
}

export function TranscriptDisplay({
  transcript,
  isListening,
  error,
}: TranscriptDisplayProps) {
  return (
    <div className="w-full space-y-3">
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
          {error}
        </div>
      )}

      {transcript && (
        <div
          className={cn(
            "p-4 rounded-lg text-center transition-all",
            isListening
              ? "bg-primary/10 border border-primary/20"
              : "bg-green-500/10 border border-green-500/20"
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-sm text-foreground">{transcript}</p>
              {isListening && (
                <p className="text-xs text-muted-foreground mt-1">🎤 Đang ghi âm...</p>
              )}
            </div>
            {!isListening && (
              <CircleCheckBig className="w-5 h-5 text-green-500 flex-shrink-0" />
            )}
          </div>
        </div>
      )}

      {isListening && !transcript && !error && (
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-center">
          <div className="flex items-center justify-center gap-2">
            <Mic className="w-4 h-4 text-primary animate-pulse" />
            <p className="text-sm text-foreground font-medium">Đang nghe...</p>
          </div>
        </div>
      )}
    </div>
  );
}
