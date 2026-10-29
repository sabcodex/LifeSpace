"use client";

import { useState } from "react";
import { LogoMark } from "@/components/Logo";
import { Icon } from "@/components/ui";
import { clearGuestSheet, collectGuestSheet, PENDING_MIGRATION_KEY } from "@/lib/guest-storage";

type Mode = "signin" | "signup";

const ERROR_MESSAGES: Record<string, string> = {
  google_not_configured:
    "Google sign-in is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, or create an account with your email below.",
  google_cancelled: "Google sign-in was cancelled. You can try again or use your email.",
  google_failed: "Google sign-in failed. Please try again or use your email.",
  google_state: "Google sign-in expired. Please try again.",
  google_email: "Google did not share an email address, so we cannot create your account.",
};

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34A21.99 21.99 0 002 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </svg>
  );
}

export function AuthForm({
  googleConfigured,
  onSuccess,
  compact = false,
  initialError,
}: {
  googleConfigured: boolean;
  /** Called after a successful sign-in / registration. Should reload the app. */
  onSuccess: () => void;
  /** Embedded inside Settings: no big brand header, tighter spacing. */
  compact?: boolean;
  initialError?: string;
}) {
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    initialError
      ? (ERROR_MESSAGES[initialError] ?? "Something went wrong. Please try again.")
      : null,
  );
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const continueWithGoogle = () => {
    if (!googleConfigured) {
      // Stay on the page: show why Google is unavailable instead of redirecting away.
      setError(ERROR_MESSAGES.google_not_configured);
      return;
    }
    // The guest sheet stays in localStorage; after Google redirects back,
    // the app posts it to /api/auth/migrate-guest automatically.
    if (collectGuestSheet()) {
      try {
        window.localStorage.setItem(PENDING_MIGRATION_KEY, "1");
      } catch {
        // ignore
      }
    }
    window.location.href = "/api/auth/google";
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);

    try {
      const endpoint = mode === "signup" ? "/api/auth/register" : "/api/auth/login";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, guest: collectGuestSheet() }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setBusy(false);
        return;
      }
      // The guest sheet was merged server-side, so the local copy can go.
      clearGuestSheet();
      onSuccess();
    } catch {
      setError("Network error. Check your connection and try again.");
      setBusy(false);
    }
  };

  return (
    <div className={compact ? "w-full" : "w-full max-w-[420px]"}>
      {!compact ? (
        <div className="sheet-card overflow-hidden">
          <div className="brand-gradient flex items-center justify-center gap-2.5 px-5 py-4 text-white">
            <LogoMark className="h-10 w-10 shrink-0 drop-shadow-sm" />
            <div className="text-left">
              <h1 className="text-[20px] font-extrabold leading-none tracking-tight">
                Life<span className="text-white/85">Space</span>
              </h1>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/80">
                be productive
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 border-b border-[#dbe6e8] bg-[#fbfdfc]">
            {(
              [
                { id: "signin" as Mode, label: "Sign in" },
                { id: "signup" as Mode, label: "Create account" },
              ]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setMode(tab.id);
                  setError(null);
                }}
                aria-pressed={mode === tab.id}
                className={`py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] transition-colors ${
                  mode === tab.id
                    ? "border-b-2 border-sheet-teal-dark bg-white text-sheet-teal-deep"
                    : "border-b-2 border-transparent text-sheet-muted hover:bg-[#f2f8f6]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="px-5 py-4">{renderBody()}</div>
        </div>
      ) : (
        <div className="sheet-card overflow-hidden">
          <div className="grid grid-cols-2 border-b border-[#dbe6e8] bg-[#fbfdfc]">
            {(
              [
                { id: "signin" as Mode, label: "Sign in" },
                { id: "signup" as Mode, label: "Create account" },
              ]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setMode(tab.id);
                  setError(null);
                }}
                aria-pressed={mode === tab.id}
                className={`py-2 text-[10px] font-bold uppercase tracking-[0.1em] transition-colors ${
                  mode === tab.id
                    ? "border-b-2 border-sheet-teal-dark bg-white text-sheet-teal-deep"
                    : "border-b-2 border-transparent text-sheet-muted hover:bg-[#f2f8f6]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="px-4 py-3.5">{renderBody()}</div>
        </div>
      )}

      {!compact ? (
        <p className="mt-3 text-center text-[9px] leading-relaxed text-sheet-muted">
          Your tasks, goals and check-ins stay private to your account and sync on every device you
          sign in from.
        </p>
      ) : null}
    </div>
  );

  function renderBody() {
    return (
      <>
        {error ? (
          <div
            role="alert"
            className="mb-3 border border-red-300 bg-red-50 px-2.5 py-2 text-[10.5px] font-semibold leading-relaxed text-red-800"
          >
            {error}
          </div>
        ) : null}

        <button
          type="button"
          onClick={continueWithGoogle}
          className="flex w-full items-center justify-center gap-2 border border-[#c3d2d6] bg-white py-2.5 text-[11.5px] font-bold text-[#22312e] transition-colors hover:border-sheet-teal hover:bg-[#f7fbfa]"
        >
          <GoogleMark />
          Continue with Google
        </button>

        <p className="mt-2 text-center text-[9px] leading-relaxed text-sheet-muted">
          {googleConfigured
            ? "We create your account automatically with your Google name and email."
            : "Google sign-in activates automatically once Google OAuth keys are added."}
        </p>

        <div className="my-3 flex items-center gap-2">
          <span className="h-px flex-1 bg-[#dfe8ea]" />
          <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-sheet-muted">
            or use email
          </span>
          <span className="h-px flex-1 bg-[#dfe8ea]" />
        </div>

        <form onSubmit={submit} className="space-y-2.5">
          {mode === "signup" ? (
            <label className="block">
              <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.14em] text-sheet-muted">
                Your name
              </span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                maxLength={80}
                placeholder="Alex Martin"
                className="h-9 w-full border border-[#c3d2d6] bg-white px-2 text-[11.5px] outline-none transition-colors focus:border-sheet-teal focus:ring-2 focus:ring-sheet-teal/15"
              />
            </label>
          ) : null}

          <label className="block">
            <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.14em] text-sheet-muted">
              Email address
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              className="h-9 w-full border border-[#c3d2d6] bg-white px-2 text-[11.5px] outline-none transition-colors focus:border-sheet-teal focus:ring-2 focus:ring-sheet-teal/15"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.14em] text-sheet-muted">
              Password
            </span>
            <span className="relative block">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
                className="h-9 w-full border border-[#c3d2d6] bg-white px-2 pr-16 text-[11.5px] outline-none transition-colors focus:border-sheet-teal focus:ring-2 focus:ring-sheet-teal/15"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-1 top-1 h-7 px-1.5 text-[9.5px] font-bold uppercase tracking-[0.08em] text-sheet-teal-dark"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </span>
          </label>

          <button
            type="submit"
            disabled={busy}
            className="mt-1 flex w-full items-center justify-center gap-1.5 bg-sheet-teal py-2.5 text-[11.5px] font-bold text-white transition-colors hover:bg-sheet-teal-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? (
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            ) : (
              <Icon name="check" className="h-3.5 w-3.5" />
            )}
            {busy
              ? mode === "signup"
                ? "Creating your sheet…"
                : "Signing you in…"
              : mode === "signup"
                ? "Create my account"
                : "Sign in"}
          </button>
        </form>

        <p className="mt-3 text-center text-[9.5px] leading-relaxed text-sheet-muted">
          {mode === "signin" ? (
            <>
              New here?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                }}
                className="font-bold text-sheet-teal-dark underline decoration-dotted"
              >
                Create an account
              </button>{" "}
              — your sheet starts with a ready-made task list.
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setError(null);
                }}
                className="font-bold text-sheet-teal-dark underline decoration-dotted"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </>
    );
  }
}
