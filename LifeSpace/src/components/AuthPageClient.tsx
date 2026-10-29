"use client";

import { AuthForm } from "@/components/AuthForm";

export function AuthPageClient({ initialError }: { initialError?: string }) {
  return (
    <AuthForm
      initialError={initialError}
      onSuccess={() => {
        window.location.href = "/";
      }}
    />
  );
}
