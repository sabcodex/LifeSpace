"use client";

import { useSyncExternalStore } from "react";

export const GUEST_DISPLAY_NAME_KEY = "organizer-guest-display-name";
export const DEFAULT_GUEST_NAME = "Guest Explorer";
export const MAX_DISPLAY_NAME_LENGTH = 80;

const listeners = new Set<() => void>();
let temporaryName: string | null = null;

export function normalizeDisplayName(value: string): string {
  return value.trim().replace(/\s+/g, " ").slice(0, MAX_DISPLAY_NAME_LENGTH);
}

function getGuestName(): string {
  if (temporaryName !== null) return temporaryName;
  if (typeof window === "undefined") return DEFAULT_GUEST_NAME;
  try {
    const saved = window.localStorage.getItem(GUEST_DISPLAY_NAME_KEY);
    return saved ? normalizeDisplayName(saved) || DEFAULT_GUEST_NAME : DEFAULT_GUEST_NAME;
  } catch {
    return DEFAULT_GUEST_NAME;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== GUEST_DISPLAY_NAME_KEY) return;
    temporaryName = null;
    listeners.forEach((subscriber) => subscriber());
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function setGuestDisplayName(value: string) {
  const name = normalizeDisplayName(value);
  if (!name) throw new Error("Enter a name for your space.");
  temporaryName = name;
  try {
    window.localStorage.setItem(GUEST_DISPLAY_NAME_KEY, name);
  } catch {
    // Private-browsing restrictions: keep the name for this visit.
  }
  listeners.forEach((listener) => listener());
}

export function useGuestDisplayName(): string {
  return useSyncExternalStore(subscribe, getGuestName, () => DEFAULT_GUEST_NAME);
}
