"use client";

import { AuthForm } from "@/components/AuthForm";

export function AuthPageClient({
  googleConfigured,
  initialError,
}: {
  googleConfigured: boolean;
  initialError?: string;
}) {
  return (
    <AuthForm
      googleConfigured={googleConfigured}
      initialError={initialError}
      onSuccess={() => {
        window.location.href = "/";
      }}
    />
  );
}
