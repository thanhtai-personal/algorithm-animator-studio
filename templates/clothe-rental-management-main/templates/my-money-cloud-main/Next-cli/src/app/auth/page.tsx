"use client";

import { LoginScreen } from "@/features/auth/components/LoginScreen";

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-gradient-background">
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <LoginScreen />
      </div>
    </div>
  );
}
