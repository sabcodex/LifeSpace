"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Icon } from "@/components/ui";

const CATEGORIES = [
  { id: "idea", label: "Idea" },
  { id: "add", label: "Add something" },
  { id: "remove", label: "Remove something" },
  { id: "bug", label: "Something's broken" },
  { id: "other", label: "Other" },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

export function FeedbackDialog({
  open,
  signedIn,
  onClose,
}: {
  open: boolean;
  signedIn: boolean;
  onClose: () => void;
}) {
  const [category, setCategory] = useState<CategoryId>("idea");
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => textareaRef.current?.focus(), 40);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const close = () => {
    if (sent) {
      setSent(false);
      setMessage("");
      setRating(null);
      setCategory("idea");
    }
    setError(null);
    onClose();
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending) return;
    if (message.trim().length < 3) {
      setError("Write a few words before sending.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, rating, message, name, email }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) throw new Error(data.error ?? "Could not send your feedback.");
      setSent(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not send your feedback.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="no-print fixed inset-0 z-[85] flex items-center justify-center bg-[#0f1f1c]/45 p-4 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
        className="sheet-card w-full max-w-[440px] overflow-hidden"
      >
        <div className="brand-gradient flex items-center justify-between px-4 py-3 text-white">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/75">Feedback</p>
            <h2 id="feedback-title" className="text-[15px] font-bold leading-tight">
              Tell us what you think
            </h2>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close feedback"
            className="inline-flex h-8 w-8 items-center justify-center border border-white/40 transition-colors hover:bg-white/15"
          >
            <Icon name="close" className="h-3.5 w-3.5" />
          </button>
        </div>

        {sent ? (
          <div className="px-5 py-8 text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#e2f2ec] text-sheet-teal-dark">
              <Icon name="check" className="h-5 w-5" />
            </span>
            <p className="mt-3 text-[13px] font-bold text-[#22312e]">Thank you!</p>
            <p className="mt-1 text-[10.5px] leading-relaxed text-sheet-muted">
              Your feedback was sent. It helps decide what to add, change or remove next.
            </p>
            <button
              type="button"
              onClick={close}
              className="mt-4 inline-flex items-center gap-1.5 border border-sheet-teal-dark bg-sheet-teal px-4 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-sheet-teal-dark"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={(event) => void submit(event)} className="space-y-3 px-4 py-4">
            <fieldset>
              <legend className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-sheet-muted">
                What is it about?
              </legend>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((item) => {
                  const active = category === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setCategory(item.id)}
                      className={`border px-2.5 py-1 text-[10px] font-semibold transition-colors ${
                        active
                          ? "border-sheet-teal-dark bg-sheet-teal text-white"
                          : "border-[#c3d2d6] bg-white text-[#41514d] hover:border-sheet-teal"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-sheet-muted">
                How do you like it? (optional)
              </legend>
              <div className="flex gap-1" role="radiogroup" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((value) => {
                  const filled = rating !== null && value <= rating;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={rating === value}
                      aria-label={`${value} star${value > 1 ? "s" : ""}`}
                      onClick={() => setRating(rating === value ? null : value)}
                      className={`text-[20px] leading-none transition-colors ${
                        filled ? "text-[#e0a526]" : "text-[#c3d2d6] hover:text-[#e0a526]"
                      }`}
                    >
                      ★
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <label className="block">
              <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.14em] text-sheet-muted">
                Your message
              </span>
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                maxLength={2000}
                rows={5}
                placeholder="What should be added, changed or removed? What do you love?"
                className="w-full resize-y border border-[#c3d2d6] bg-white px-2.5 py-2 text-[11.5px] leading-relaxed text-[#22312e] outline-none transition-colors focus:border-sheet-teal focus:ring-2 focus:ring-sheet-teal/15"
              />
              <span className="mt-0.5 block text-right text-[8.5px] text-sheet-muted">
                {message.length}/2000
              </span>
            </label>

            {!signedIn ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.14em] text-sheet-muted">
                    Name (optional)
                  </span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    maxLength={80}
                    autoComplete="name"
                    className="h-9 w-full border border-[#c3d2d6] bg-white px-2 text-[11.5px] text-[#22312e] outline-none focus:border-sheet-teal"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.14em] text-sheet-muted">
                    Email (optional)
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    placeholder="For a reply"
                    className="h-9 w-full border border-[#c3d2d6] bg-white px-2 text-[11.5px] text-[#22312e] outline-none focus:border-sheet-teal"
                  />
                </label>
              </div>
            ) : (
              <p className="text-[9.5px] text-sheet-muted">Sent with your account name and email.</p>
            )}

            {error ? (
              <p role="alert" className="border border-red-300 bg-red-50 px-2.5 py-1.5 text-[10.5px] font-semibold text-red-800">
                {error}
              </p>
            ) : null}

            <div className="flex justify-end gap-2 border-t border-[#e3ebed] pt-3">
              <button
                type="button"
                onClick={close}
                className="border border-[#c3d2d6] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#41514d] transition-colors hover:border-sheet-teal"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending}
                className="inline-flex items-center gap-1.5 border border-sheet-teal-dark bg-sheet-teal px-3 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-sheet-teal-dark disabled:opacity-60"
              >
                <Icon name="check" className="h-3.5 w-3.5" />
                {sending ? "Sending…" : "Send feedback"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
