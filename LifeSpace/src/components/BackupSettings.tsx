"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/ui";
import { downloadBackup, lastBackupDate, readBackupFile, restoreBackup } from "@/lib/backup";

const subscribeNoop = () => () => undefined;

export function BackupSettings({ displayName }: { displayName: string }) {
  const signedIn = false;
  const [busy, setBusy] = useState<"download" | "restore" | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Read after mount only: localStorage does not exist during server rendering.
  const storedLastBackup = useSyncExternalStore(subscribeNoop, lastBackupDate, () => null);
  const lastBackup = savedAt ?? storedLastBackup;

  const download = async () => {
    setBusy("download");
    setError(null);
    setStatus(null);
    try {
      const result = await downloadBackup({ signedIn, displayName });
      setSavedAt(new Date().toISOString());
      setStatus(
        `Backup downloaded: ${result.tasks} task${result.tasks === 1 ? "" : "s"} and ${result.checks} check-in${result.checks === 1 ? "" : "s"}. Keep the file somewhere safe.`,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create your backup.");
    } finally {
      setBusy(null);
    }
  };

  const restore = async (file: File | undefined) => {
    if (!file) return;
    setBusy("restore");
    setError(null);
    setStatus(null);
    try {
      const backup = await readBackupFile(file);
      const summary = await restoreBackup(backup, { signedIn });
      setStatus(
        `Restored: ${summary.added} new task${summary.added === 1 ? "" : "s"} and ${summary.checks} check-in${summary.checks === 1 ? "" : "s"} added. Reloading…`,
      );
      window.setTimeout(() => window.location.reload(), 1200);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not restore that file.");
      setBusy(null);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <section className="sheet-card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[#dfe8ea] bg-[#fbfdfc] px-4 py-3">
          <Icon name="check" className="h-4 w-4 text-sheet-teal-dark" />
          <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#22312e]">
            How your progress is kept safe
          </h3>
        </div>
        <ul className="space-y-2 px-4 py-4 text-[10.5px] leading-relaxed text-[#41514d]">
          {(signedIn
            ? [
                "Every task and checkmark is saved to your account automatically.",
                "If your connection drops, changes are kept on this device and synced as soon as you're back online.",
                "You stay signed in on this device for a full year.",
                "Download a backup file any time — it restores every month in one click.",
              ]
            : [
                "Your sheet is saved in this browser automatically, and protected from automatic cleanup.",
                "Clearing your browser data or switching browsers would remove it — download a backup to be safe.",
                "Tip: keep the backup file somewhere safe, like your email drafts or cloud drive.",
              ]
          ).map((line) => (
            <li key={line} className="flex items-start gap-2">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#e2f2ec] text-sheet-teal-dark">
                <Icon name="check" className="h-2.5 w-2.5" />
              </span>
              {line}
            </li>
          ))}
        </ul>
      </section>

      <section className="sheet-card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[#dfe8ea] bg-[#fbfdfc] px-4 py-3">
          <Icon name="download" className="h-4 w-4 text-sheet-teal-dark" />
          <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#22312e]">
            Download a backup
          </h3>
        </div>
        <div className="px-4 py-4">
          <p className="text-[10.5px] leading-relaxed text-sheet-muted">
            Saves every month&apos;s tasks, goals and checkmarks{signedIn ? " from your account" : ""}, plus
            your name and appearance, in one small file.
          </p>
          <button
            type="button"
            onClick={() => void download()}
            disabled={busy !== null}
            className="mt-3 inline-flex items-center gap-1.5 border border-sheet-teal-dark bg-sheet-teal px-3 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-sheet-teal-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Icon name="download" className="h-3.5 w-3.5" />
            {busy === "download" ? "Preparing…" : "Download backup"}
          </button>
          <p className="mt-2 text-[9.5px] text-sheet-muted">
            {lastBackup
              ? `Last backup on this device: ${new Date(lastBackup).toLocaleString()}`
              : "No backup downloaded on this device yet."}
          </p>
        </div>
      </section>

      <section className="sheet-card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[#dfe8ea] bg-[#fbfdfc] px-4 py-3">
          <Icon name="arrowUp" className="h-4 w-4 text-sheet-teal-dark" />
          <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#22312e]">
            Restore from a backup
          </h3>
        </div>
        <div className="px-4 py-4">
          <p className="text-[10.5px] leading-relaxed text-sheet-muted">
            Choose a LifeSpace backup file. It is added to {signedIn ? "your account" : "this browser"}{" "}
            — nothing you already have is deleted, and restoring the same file twice never creates
            duplicates.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            aria-label="Choose a backup file"
            onChange={(event) => void restore(event.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy !== null}
            className="mt-3 inline-flex items-center gap-1.5 border border-[#c3d2d6] bg-white px-3 py-1.5 text-[11px] font-bold text-sheet-teal-dark transition-colors hover:border-sheet-teal disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Icon name="arrowUp" className="h-3.5 w-3.5" />
            {busy === "restore" ? "Restoring…" : "Choose backup file"}
          </button>
        </div>
      </section>

      {error ? (
        <p role="alert" className="border border-red-300 bg-red-50 px-3 py-2 text-[10.5px] font-semibold text-red-800">
          {error}
        </p>
      ) : null}
      {status ? (
        <p role="status" className="border border-[#cfe3dc] bg-[#eaf5f1] px-3 py-2 text-[10.5px] font-semibold text-sheet-teal-deep">
          {status}
        </p>
      ) : null}
    </div>
  );
}
