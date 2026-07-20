"use client";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

function formatSavedTime(date: Date): string {
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export default function SaveIndicator({
  status,
  lastSavedAt,
  onRetry,
}: {
  status: SaveStatus;
  lastSavedAt?: Date | null;
  onRetry?: () => void;
}) {
  const label =
    status === "saving"
      ? "Saving…"
      : status === "saved"
        ? lastSavedAt
          ? `Saved · ${formatSavedTime(lastSavedAt)}`
          : "Saved"
        : status === "error"
          ? "Couldn't save · Tap to retry"
          : "";

  if (!label) return <div className="h-4" />;

  const dotClass =
    status === "saving"
      ? "bg-gold animate-pulse"
      : status === "saved"
        ? "bg-sage"
        : "bg-[#A54B3F]";

  const content = (
    <div className="flex items-center gap-1.5 text-xs text-paper-muted">
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      {label}
    </div>
  );

  if (status === "error" && onRetry) {
    return (
      <button type="button" onClick={onRetry}>
        {content}
      </button>
    );
  }

  return content;
}
