"use client";

import { useState, type FormEvent } from "react";
import { SpaceBanner } from "@/components/SpaceBanner";
import { Icon } from "@/components/ui";
import { MAX_DISPLAY_NAME_LENGTH, normalizeDisplayName } from "@/lib/display-name";
import { isHexColor, useAppearance } from "@/lib/theme";
import { SPACE_NAME_COLORS, SPACE_THEMES } from "@/lib/space-presets";

export function SpaceSettings({
  displayName,
  onSaveName,
  onOpenTheme,
}: {
  displayName: string;
  onSaveName: (name: string) => Promise<void>;
  onOpenTheme: () => void;
}) {
  const { appearance, update } = useAppearance();
  const [name, setName] = useState(displayName);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cleanedName = normalizeDisplayName(name);
  const nameChanged = cleanedName !== displayName;
  const colorIsPreset = SPACE_NAME_COLORS.some(
    (color) => color.value.toLowerCase() === appearance.spaceNameColor.toLowerCase(),
  );

  const saveName = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving || !nameChanged) return;
    if (!cleanedName) {
      setError("Enter a name for your space.");
      return;
    }
    setSaving(true);
    setError(null);
    setStatus(null);
    try {
      await onSaveName(cleanedName);
      setName(cleanedName);
      setStatus("Name saved on this device.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save your name. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-[10px] leading-relaxed text-sheet-muted">
          Your name, your universe. Preview changes to your space below.
        </p>
        <SpaceBanner displayName={cleanedName || displayName} preview />
      </div>

      <section className="sheet-card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[#dfe8ea] bg-[#fbfdfc] px-4 py-3">
          <Icon name="pencil" className="h-4 w-4 text-sheet-teal-dark" />
          <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#22312e]">
            Display name
          </h3>
        </div>
        <form onSubmit={(event) => void saveName(event)} className="px-4 py-4">
          <label htmlFor="space-name-input" className="block text-[10.5px] text-sheet-muted">
            Give your space a name. It is saved in this browser.
          </label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              id="space-name-input"
              type="text"
              value={name}
              maxLength={MAX_DISPLAY_NAME_LENGTH}
              autoComplete="nickname"
              onChange={(event) => {
                setName(event.target.value);
                setError(null);
                setStatus(null);
              }}
              placeholder="Your name"
              className="h-9 min-w-0 flex-1 border border-[#c3d2d6] bg-white px-3 text-[11.5px] text-[#22312e] outline-none transition-colors focus:border-sheet-teal focus:ring-2 focus:ring-sheet-teal/15"
            />
            <button
              type="submit"
              disabled={saving || !nameChanged || !cleanedName}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 border border-sheet-teal-dark bg-sheet-teal px-3 text-[10.5px] font-bold text-white transition-colors hover:bg-sheet-teal-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon name="check" className="h-3.5 w-3.5" />
              {saving ? "Saving…" : "Save name"}
            </button>
          </div>
          {error ? <p role="alert" className="mt-2 text-[10px] font-semibold text-red-700">{error}</p> : null}
          {status ? <p role="status" className="mt-2 text-[10px] font-semibold text-sheet-teal-dark">{status}</p> : null}
        </form>
      </section>

      <section className="sheet-card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[#dfe8ea] bg-[#fbfdfc] px-4 py-3">
          <Icon name="spark" className="h-4 w-4 text-sheet-teal-dark" />
          <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#22312e]">
            Name color
          </h3>
        </div>
        <div className="px-4 py-4">
          <p className="mb-3 text-[10.5px] leading-relaxed text-sheet-muted">
            Choose a color for your name in the space banner. Automatic matches the selected atmosphere.
          </p>
          <div className="flex flex-wrap gap-2" aria-label="Name color choices">
            {SPACE_NAME_COLORS.map((color) => {
              const active = color.value.toLowerCase() === appearance.spaceNameColor.toLowerCase();
              return (
                <button
                  type="button"
                  key={color.value}
                  onClick={() => update({ spaceNameColor: color.value })}
                  aria-pressed={active}
                  title={`${color.name} name color`}
                  className={`flex items-center gap-2 rounded-full border-2 bg-white py-1 pl-1 pr-3 text-[10px] font-semibold text-[#22312e] transition-colors hover:border-sheet-teal ${
                    active ? "border-sheet-teal-dark ring-2 ring-sheet-teal/25" : "border-[#c3d2d6]"
                  }`}
                >
                  <span
                    className="h-5 w-5 rounded-full border border-black/15"
                    aria-hidden="true"
                    style={{
                      background:
                        color.value === "default"
                          ? "linear-gradient(135deg, #ceddec 0 50%, #223e5b 50% 100%)"
                          : color.value,
                    }}
                  />
                  {color.name}
                </button>
              );
            })}
            <label
              className={`relative flex cursor-pointer items-center gap-2 rounded-full border-2 bg-white py-1 pl-1 pr-3 text-[10px] font-semibold text-[#22312e] transition-colors hover:border-sheet-teal ${
                colorIsPreset ? "border-[#c3d2d6]" : "border-sheet-teal-dark ring-2 ring-sheet-teal/25"
              }`}
              title="Pick a custom name color"
            >
              <span
                aria-hidden="true"
                className="h-5 w-5 rounded-full border border-black/15"
                style={{
                  background: colorIsPreset
                    ? "conic-gradient(#e87a91,#ecc678,#72c9a2,#65aee0,#ab8ee0,#e87a91)"
                    : appearance.spaceNameColor,
                }}
              />
              Custom
              <input
                aria-label="Custom name color"
                type="color"
                value={isHexColor(appearance.spaceNameColor) ? appearance.spaceNameColor : "#266fbb"}
                onChange={(event) => update({ spaceNameColor: event.target.value })}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </label>
          </div>
        </div>
      </section>

      <section className="sheet-card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[#dfe8ea] bg-[#fbfdfc] px-4 py-3">
          <Icon name="moon" className="h-4 w-4 text-sheet-teal-dark" />
          <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#22312e]">
            Space theme
          </h3>
        </div>
        <div className="px-4 py-4">
          <p className="mb-3 text-[10.5px] leading-relaxed text-sheet-muted">
            Pick the atmosphere behind your name. Each one has a light and a dark version.
          </p>
          <div role="radiogroup" aria-label="Space theme" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SPACE_THEMES.map((theme) => {
              const active = appearance.spaceTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => update({ spaceTheme: theme.id })}
                  className={`group min-w-0 overflow-hidden border text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sheet-teal ${
                    active ? "border-sheet-teal-dark ring-2 ring-sheet-teal/30" : "border-[#c3d2d6] hover:border-sheet-teal"
                  }`}
                >
                  <span aria-hidden="true" className="block h-9 w-full" style={{ background: theme.preview }} />
                  <span className="block bg-white px-2 py-1.5">
                    <span className="block truncate text-[10px] font-bold text-[#22312e]">{theme.label}</span>
                    <span className="block truncate text-[8px] text-sheet-muted">{theme.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="sheet-card flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-[#22312e]">Gentle motion</p>
          <p className="mt-0.5 text-[9.5px] leading-relaxed text-sheet-muted">
            Drift the stars and float your name. Respects reduced-motion device settings.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-label="Gentle motion"
          aria-checked={appearance.spaceMotion}
          onClick={() => update({ spaceMotion: !appearance.spaceMotion })}
          className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sheet-teal ${
            appearance.spaceMotion ? "border-sheet-teal-dark bg-sheet-teal" : "border-[#b9c9c5] bg-[#cbd6d3]"
          }`}
        >
          <span
            className={`absolute top-[2px] h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform ${
              appearance.spaceMotion ? "left-[22px]" : "left-[2px]"
            }`}
          />
        </button>
      </section>
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-2">
        <p className="text-[9px] leading-relaxed text-sheet-muted">
          Colors, atmosphere and motion are saved on this device.
        </p>
        <button
          type="button"
          onClick={onOpenTheme}
          className="inline-flex items-center gap-1.5 border border-[#c3d2d6] bg-white px-2.5 py-1.5 text-[10px] font-bold text-sheet-teal-dark transition-colors hover:border-sheet-teal"
        >
          <Icon name="monitor" className="h-3 w-3" />
          Website theme
          <Icon name="chevronRight" className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
