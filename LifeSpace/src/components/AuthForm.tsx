"use client";

import { useState } from "react";
import { LogoMark } from "@/components/Logo";
import { Icon } from "@/components/ui";
import { clearGuestSheet, collectGuestSheet } from "@/lib/guest-storage";

type Mode = "signin" | "signup";

export function AuthForm({
  onSuccess,
  compact = false,
  initialError,
}: {
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
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

        <p className="mb-3 text-center text-[10px] leading-relaxed text-sheet-muted">
          Create your free LifeSpace account with your email address. Your progress is saved to
          your account and stays on this device for instant access.
        </p>

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
