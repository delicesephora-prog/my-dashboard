"use client";

import { useRef, useState } from "react";
import { DashboardData, normalizeDashboardData } from "@/lib/types";
import { todayKey } from "@/lib/date";
import {
  LIFE_SCORE_CATEGORIES,
  LIFE_SCORE_CATEGORY_LABELS,
  LifeScoreWeights,
} from "@/lib/lifescore";
import { TextAlertsSettings } from "@/lib/textalerts";

type ImportState =
  | { step: "idle" }
  | { step: "confirming"; fileName: string; normalized: DashboardData }
  | { step: "importing" }
  | { step: "success" }
  | { step: "error"; message: string };

export default function SettingsSheet({
  data,
  onImported,
  onChangeLifeScoreWeights,
  onChangeTextAlerts,
  onClose,
}: {
  data: DashboardData;
  onImported: (data: DashboardData) => void;
  onChangeLifeScoreWeights: (updater: (w: LifeScoreWeights) => LifeScoreWeights) => void;
  onChangeTextAlerts: (updater: (t: TextAlertsSettings) => TextAlertsSettings) => void;
  onClose: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importState, setImportState] = useState<ImportState>({ step: "idle" });

  function handleExport() {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `my-dashboard-export-${todayKey()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
          throw new Error("not an object");
        }
        // Older exports may be missing fields added since - normalize fills
        // them with defaults, the same way the app handles old saved data.
        const normalized = normalizeDashboardData(parsed as Partial<DashboardData>);
        setImportState({ step: "confirming", fileName: file.name, normalized });
      } catch {
        setImportState({
          step: "error",
          message: "Couldn't read that file - make sure it's a JSON export from this app.",
        });
      }
    };
    reader.onerror = () => {
      setImportState({ step: "error", message: "Couldn't read that file." });
    };
    reader.readAsText(file);
  }

  async function confirmImport() {
    if (importState.step !== "confirming") return;
    const { normalized } = importState;
    setImportState({ step: "importing" });
    try {
      const res = await fetch("/api/dashboard", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-Save-Seq": String(Date.now()) },
        body: JSON.stringify(normalized),
        cache: "no-store",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "This file doesn't match the expected format.");
      }
      onImported(normalized);
      setImportState({ step: "success" });
    } catch (err) {
      setImportState({
        step: "error",
        message: err instanceof Error ? err.message : "Import failed.",
      });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-paper-surface animate-fade-in">
      <div className="safe-top flex items-center justify-between px-5 pb-2 pt-3">
        <p className="font-serif text-[1.1rem] text-paper-ink">Settings</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-paper-surface2 px-3.5 py-1.5 text-sm font-medium text-paper-muted"
        >
          Done
        </button>
      </div>

      <div className="scroll-quiet safe-bottom flex-1 overflow-y-auto px-5 pb-4">
        <div className="flex flex-col gap-3">
          <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
            <p className="mb-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
              Export
            </p>
            <p className="mb-3 text-[13px] leading-relaxed text-paper-muted">
              Download everything in your dashboard - Work, Life, all of it - as one file you can
              keep as a backup.
            </p>
            <button
              type="button"
              onClick={handleExport}
              className="w-full rounded-xl bg-work py-3 text-sm font-medium text-paper-surface transition active:scale-[0.98]"
            >
              Export My Data
            </button>
          </div>

          <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
            <p className="mb-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
              Import
            </p>
            <p className="mb-3 text-[13px] leading-relaxed text-paper-muted">
              Restore from a previously exported file. This replaces everything currently in your
              dashboard.
            </p>

            {importState.step === "idle" && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-xl border border-paper-border bg-paper-surface2 py-3 text-sm font-medium text-paper-ink transition active:scale-[0.98]"
              >
                Choose a File to Import…
              </button>
            )}

            {importState.step === "confirming" && (
              <div className="rounded-xl border border-[#B5574A] bg-[#B5574A]/5 p-3.5">
                <p className="mb-3 text-[13.5px] leading-relaxed text-paper-ink">
                  Replace everything in your dashboard with{" "}
                  <strong>{importState.fileName}</strong>? Whatever is currently saved will be
                  gone. This can&apos;t be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setImportState({ step: "idle" })}
                    className="flex-1 rounded-lg border border-paper-border bg-paper-surface py-2.5 text-sm font-medium text-paper-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmImport}
                    className="flex-1 rounded-lg bg-[#B5574A] py-2.5 text-sm font-medium text-paper-surface"
                  >
                    Yes, Replace My Data
                  </button>
                </div>
              </div>
            )}

            {importState.step === "importing" && (
              <p className="py-2 text-center text-sm italic text-paper-muted">Importing…</p>
            )}

            {importState.step === "success" && (
              <div className="rounded-xl border border-[#8FA37E] bg-[#8FA37E]/10 p-3.5 text-center">
                <p className="text-sm text-paper-ink">Your data has been restored.</p>
                <button
                  type="button"
                  onClick={() => setImportState({ step: "idle" })}
                  className="mt-2 text-xs text-paper-muted underline underline-offset-2"
                >
                  Done
                </button>
              </div>
            )}

            {importState.step === "error" && (
              <div className="rounded-xl border border-[#B5574A] bg-[#B5574A]/5 p-3.5">
                <p className="mb-2 text-sm text-paper-ink">{importState.message}</p>
                <button
                  type="button"
                  onClick={() => setImportState({ step: "idle" })}
                  className="text-xs text-paper-muted underline underline-offset-2"
                >
                  Try again
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleFileSelected}
              className="hidden"
            />
          </div>

          <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
            <p className="mb-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
              Life Score Weights
            </p>
            <p className="mb-3 text-[13px] leading-relaxed text-paper-muted">
              How much each area counts toward your daily Life Score. These don&apos;t need to add
              up to any particular number - they&apos;re just relative to each other.
            </p>
            <div className="flex flex-col gap-2.5">
              {LIFE_SCORE_CATEGORIES.map((key) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-[13px] text-paper-ink">
                    {LIFE_SCORE_CATEGORY_LABELS[key]}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={data.lifeScore.weights[key]}
                    onChange={(e) =>
                      onChangeLifeScoreWeights((w) => ({ ...w, [key]: Number(e.target.value) }))
                    }
                    className="flex-1 accent-work"
                  />
                  <span className="w-7 shrink-0 text-right text-[12px] text-paper-muted">
                    {data.lifeScore.weights[key]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
            <p className="mb-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
              Text Alerts
            </p>
            <p className="mb-3 text-[13px] leading-relaxed text-paper-muted">
              Never more than 3 texts a day, and nothing between 10pm and 6:30am, no matter what&apos;s
              toggled on below.
            </p>

            <div className="flex flex-col gap-4">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[13.5px] text-paper-ink">Morning text</span>
                  <ToggleSwitch
                    checked={data.textAlerts.settings.morningEnabled}
                    onChange={(v) => onChangeTextAlerts((t) => ({ ...t, morningEnabled: v }))}
                  />
                </div>
                {data.textAlerts.settings.morningEnabled && (
                  <div className="flex flex-col gap-2 pl-0.5">
                    <label className="flex items-center justify-between text-[12.5px] text-paper-muted">
                      Weekdays
                      <input
                        type="time"
                        value={data.textAlerts.settings.morningWeekdayTime}
                        onChange={(e) =>
                          onChangeTextAlerts((t) => ({ ...t, morningWeekdayTime: e.target.value }))
                        }
                        className="rounded-md border border-paper-border bg-paper-surface2 px-2 py-1 text-[12.5px] text-paper-ink outline-none"
                      />
                    </label>
                    <label className="flex items-center justify-between text-[12.5px] text-paper-muted">
                      Weekends
                      <input
                        type="time"
                        value={data.textAlerts.settings.morningWeekendTime}
                        onChange={(e) =>
                          onChangeTextAlerts((t) => ({ ...t, morningWeekendTime: e.target.value }))
                        }
                        className="rounded-md border border-paper-border bg-paper-surface2 px-2 py-1 text-[12.5px] text-paper-ink outline-none"
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-paper-border pt-3">
                <div>
                  <p className="text-[13.5px] text-paper-ink">Anchor nudges</p>
                  <p className="text-[11.5px] text-paper-muted">
                    Set nudge times per anchor in Rhythm.
                  </p>
                </div>
                <ToggleSwitch
                  checked={data.textAlerts.settings.anchorNudgesEnabled}
                  onChange={(v) => onChangeTextAlerts((t) => ({ ...t, anchorNudgesEnabled: v }))}
                />
              </div>

              <div className="border-t border-paper-border pt-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[13.5px] text-paper-ink">Night routine text</span>
                  <ToggleSwitch
                    checked={data.textAlerts.settings.nightEnabled}
                    onChange={(v) => onChangeTextAlerts((t) => ({ ...t, nightEnabled: v }))}
                  />
                </div>
                {data.textAlerts.settings.nightEnabled && (
                  <label className="flex items-center justify-between pl-0.5 text-[12.5px] text-paper-muted">
                    Only if not started by
                    <input
                      type="time"
                      value={data.textAlerts.settings.nightTime}
                      onChange={(e) => onChangeTextAlerts((t) => ({ ...t, nightTime: e.target.value }))}
                      className="rounded-md border border-paper-border bg-paper-surface2 px-2 py-1 text-[12.5px] text-paper-ink outline-none"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-work" : "bg-paper-border"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-paper-surface shadow transition ${
          checked ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}
