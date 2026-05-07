"use client";

import { useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";

interface PinInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  onComplete?: () => void;
  disabled?: boolean;
  error?: string;
  length?: number;
  autoFocus?: boolean;
}

const DEFAULT_PIN_LENGTH = 6;

export function PinInput({
  value,
  onChange,
  onComplete,
  disabled = false,
  error,
  length = DEFAULT_PIN_LENGTH,
  autoFocus = false,
}: PinInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleDigitChange = useCallback(
    (index: number, digit: string) => {
      const newDigit = digit.replace(/[^0-9]/g, "");
      if (newDigit.length > 1) return;

      const nextDigits = [...value];
      nextDigits[index] = newDigit;
      onChange(nextDigits);

      let cursor = index;
      if (newDigit) {
        cursor += 1;
      }
      if (cursor < length) {
        inputRefs.current[cursor]?.focus();
      } else {
        inputRefs.current[length - 1]?.blur();
      }
      if (nextDigits.every((digit) => digit !== "")) {
        onComplete?.();
      }
    },
    [value, onChange, onComplete, length]
  );

  const handleDigitKeyDown = useCallback(
    (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "Backspace") return;
      const nextDigits = [...value];
      if (nextDigits[index]) {
        nextDigits[index] = "";
        onChange(nextDigits);
        return;
      }
      if (index > 0) {
        nextDigits[index - 1] = "";
        onChange(nextDigits);
        inputRefs.current[index - 1]?.focus();
      }
    },
    [value, onChange]
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length }).map((_, index) => (
          <Input
            key={`pin-${index}`}
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            type="password"
            name={`pin-${index}`}
            inputMode="numeric"
            maxLength={1}
            value={value[index] || ""}
            onChange={(event) => handleDigitChange(index, event.target.value)}
            onKeyDown={(event) => handleDigitKeyDown(index, event)}
            disabled={disabled}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            autoCapitalize="off"
            autoFocus={autoFocus && index === 0}
            className="h-12 w-10 text-center text-lg font-semibold"
          />
        ))}
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
