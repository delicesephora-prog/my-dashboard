"use client";

import { useEffect } from "react";

// Bottom-anchored, auto-dismissing chatter toast - structurally the small
// sibling of CelebrationOverlay's own toast variant (same fade-in, same
// pill shape) but anchored to the bottom and on its own timer, since Cher's
// ambient pings are lower-stakes than an actual milestone celebration.
export default function CherToast({
  message,
  onDismiss,
}: {
  message: string | null;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  if (!message) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] flex justify-center px-5 pb-[calc(env(safe-area-inset-bottom)+18px)]">
      <div className="animate-fade-in rounded-full bg-work px-5 py-3 shadow-paper-lg">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">Cher</p>
        <p className="mt-0.5 text-[13px] font-medium text-paper-surface">{message}</p>
      </div>
    </div>
  );
}
