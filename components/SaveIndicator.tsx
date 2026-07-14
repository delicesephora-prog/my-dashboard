"use client";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function SaveIndicator({
  status,
  onRetry,
}: {
  status: SaveStatus;
  onRetry?: () => void;
}) {
  const label =
    status === "saving"
      ? "Saving…"
      : status === "saved"
        ? "Saved"
        : status === "error"
          ? "Couldn't save · Tap to retry"
          : "";

  if (!label) return <div className="h-4" />;

  const dotClass =
    status === "saving"
      ? "bg-[#C7A46B] animate-pulse"
      : status === "saved"
        ? "bg-[#8FA37E]"
        : "bg-[#B5574A]";

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
