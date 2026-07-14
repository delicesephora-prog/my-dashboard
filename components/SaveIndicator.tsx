"use client";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function SaveIndicator({ status }: { status: SaveStatus }) {
  const label =
    status === "saving"
      ? "Saving…"
      : status === "saved"
        ? "Saved"
        : status === "error"
          ? "Couldn't save"
          : "";

  if (!label) return <div className="h-4" />;

  const dotClass =
    status === "saving"
      ? "bg-[#C7A46B] animate-pulse"
      : status === "saved"
        ? "bg-[#8FA37E]"
        : "bg-[#B5574A]";

  return (
    <div className="flex items-center gap-1.5 text-xs text-paper-muted">
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      {label}
    </div>
  );
}
