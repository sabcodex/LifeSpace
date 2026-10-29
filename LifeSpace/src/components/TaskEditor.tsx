"use client";

import { useEffect, useRef, useState } from "react";
import { Icon, IconButton, SheetHead } from "@/components/ui";
import type { TaskRecord } from "@/lib/stats";

export type EditorState = { mode: "new" } | { mode: "edit"; task: TaskRecord } | null;

const GOAL_PRESETS = [7, 14, 21, 26, 31];

export function TaskEditor({
  state,
  busy,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  onMove,
}: {
  state: EditorState;
  busy: boolean;
  onClose: () => void;
  onCreate: (name: string, goal: number) => Promise<boolean>;
  onUpdate: (id: number, patch: { name?: string; goal?: number }) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
  onMove: (id: number, direction: "up" | "down") => Promise<boolean>;
}) {
  useEffect(() => {
    if (!state) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [state, onClose]);

  if (!state) return null;
  const task = state.mode === "edit" ? state.task : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f1f1c]/45 p-4 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-editor-title"
        className="sheet-card w-full max-w-[380px] overflow-hidden"
      >
        <SheetHead className="justify-between px-3 py-2">
          <h3
            id="task-editor-title"
            className="text-[11.5px] font-bold uppercase tracking-[0.14em]"
          >
            {state.mode === "new" ? "New sheet row" : "Edit task row"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close task editor"
            className="text-white/85 transition-colors hover:text-white"
          >
            <Icon name="close" className="h-3.5 w-3.5" />
          </button>
        </SheetHead>

        <EditorForm
          key={task ? `edit-${task.id}` : "new"}
          task={task}
          busy={busy}
          onClose={onClose}
          onCreate={onCreate}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onMove={onMove}
        />
      </div>
    </div>
  );
}

function EditorForm({
  task,
  busy,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  onMove,
}: {
  task: TaskRecord | null;
  busy: boolean;
  onClose: () => void;
  onCreate: (name: string, goal: number) => Promise<boolean>;
  onUpdate: (id: number, patch: { name?: string; goal?: number }) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
  onMove: (id: number, direction: "up" | "down") => Promise<boolean>;
}) {
  const [name, setName] = useState(task?.name ?? "");
  const [goal, setGoal] = useState(String(task?.goal ?? 26));
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(timer);
  }, []);

  const parsedGoal = Math.max(0, Math.min(31, Number.parseInt(goal, 10) || 0));

  const submit = async () => {
    if (saving || busy || !name.trim()) return;
    setSaving(true);
    const ok = task ? await onUpdate(task.id, { name, goal: parsedGoal }) : await onCreate(name, parsedGoal);
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <form
      className="space-y-3 px-3 py-3"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <label className="block">
        <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.14em] text-sheet-muted">
          Task / habit
        </span>
        <input
          ref={inputRef}
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={90}
          placeholder="e.g. Study / revise lessons"
          className="h-8 w-full border border-[#c3d2d6] bg-white px-2 text-[11.5px] outline-none transition-colors focus:border-sheet-teal focus:ring-2 focus:ring-sheet-teal/15"
        />
      </label>

      <div>
        <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.14em] text-sheet-muted">
          Monthly goal · days checked (0–31)
        </span>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min={0}
            max={31}
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            className="h-8 w-16 border border-[#c3d2d6] bg-white px-2 text-[11.5px] outline-none focus:border-sheet-teal"
          />
          <div className="flex flex-wrap gap-1">
            {GOAL_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setGoal(String(preset))}
                className={`h-[24px] border px-1.5 text-[9.5px] font-semibold transition-colors ${
                  parsedGoal === preset
                    ? "border-sheet-teal-dark bg-sheet-teal text-white"
                    : "border-[#c3d2d6] bg-white text-[#41514d] hover:border-sheet-teal"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-1.5 text-[9px] leading-relaxed text-sheet-muted">
          Goal 0 pauses the row: it stays in the sheet but is excluded from daily and global
          targets.
        </p>
      </div>

      {task ? (
        <div className="flex items-center justify-between gap-1 border-t border-[#e3ebed] pt-2">
          <div className="flex items-center gap-1">
            <IconButton
              label="Move row up"
              disabled={busy}
              onClick={() => void onMove(task.id, "up")}
            >
              <Icon name="arrowUp" className="h-3 w-3" />
            </IconButton>
            <IconButton
              label="Move row down"
              disabled={busy}
              onClick={() => void onMove(task.id, "down")}
            >
              <Icon name="arrowDown" className="h-3 w-3" />
            </IconButton>
          </div>
          <IconButton
            label={confirmDelete ? "Confirm delete" : "Delete task"}
            tone="danger"
            disabled={busy || saving}
            onClick={async () => {
              if (!confirmDelete) {
                setConfirmDelete(true);
                return;
              }
              setSaving(true);
              const ok = await onDelete(task.id);
              setSaving(false);
              if (ok) onClose();
            }}
          >
            <Icon name="trash" className="h-3 w-3" />
            {confirmDelete ? "Confirm?" : "Delete"}
          </IconButton>
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-1.5 border-t border-[#e3ebed] pt-2">
        <IconButton label="Cancel editing" onClick={onClose} disabled={saving}>
          Cancel
        </IconButton>
        <IconButton
          type="submit"
          label={task ? "Save changes" : "Create task"}
          tone="teal"
          disabled={saving || busy || !name.trim()}
        >
          <Icon name="check" className="h-3 w-3" />
          {task ? "Save" : "Create task"}
        </IconButton>
      </div>
    </form>
  );
}
