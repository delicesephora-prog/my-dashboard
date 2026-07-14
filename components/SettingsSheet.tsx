"use client";

import { useRef, useState } from "react";
import { DashboardData, normalizeDashboardData } from "@/lib/types";
import { todayKey } from "@/lib/date";

type ImportState =
  | { step: "idle" }
  | { step: "confirming"; fileName: string; normalized: DashboardData }
  | { step: "importing" }
  | { step: "success" }
  | { step: "error"; message: string };

export default function SettingsSheet({
  data,
  onImported,
  onClose,
}: {
  data: DashboardData;
  onImported: (data: DashboardData) => void;
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalized),
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
        </div>
      </div>
    </div>
  );
}
