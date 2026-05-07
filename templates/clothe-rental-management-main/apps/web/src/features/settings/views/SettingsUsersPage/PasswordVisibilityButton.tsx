"use client";

import { Eye, EyeOff } from "lucide-react";

interface PasswordVisibilityButtonProps {
  visible: boolean;
  onToggle: () => void;
}

export function PasswordVisibilityButton({ visible, onToggle }: PasswordVisibilityButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md border border-border bg-background p-1 text-muted-foreground transition hover:text-foreground"
      aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
    >
      {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}
